<!-- eslint-disable no-unused-vars -->
<script lang="ts" setup>
import type {
  XhsNoteType,
  XhsShareInfo,
  XhsSharePreviewProps,
} from 'types/xhs';

import { computed, ref } from 'vue';

import { LoadingOutlined, PlayCircleOutlined } from '@ant-design/icons-vue';
import { message, Modal, notification } from 'ant-design-vue';

import { UtilApi } from '#/api/ai/util';
import { CommonApi } from '#/api/xhs/common';

import XhsAnalysisProgress from './components/XhsAnalysisProgress.vue';
import XhsQRCodeShare from './components/XhsQRCodeShare.vue';
import XhsShareForm from './components/XhsShareForm.vue';
import XhsSharePreview from './components/XhsSharePreview.vue';

// 分析状态枚举
enum AnalysisState {
  ANALYZING = 'analyzing', // 分析中
  COMPLETED = 'completed', // 分析完成
  ERROR = 'error', // 分析失败
  IDLE = 'idle', // 空闲状态，未开始分析
}

// 响应式数据
const xhsUrl = ref('');
const analysisState = ref<AnalysisState>(AnalysisState.IDLE);
const currentStepIndex = ref(0);
const analysisError = ref('');
const shareData = ref<XhsShareInfo>({} as XhsShareInfo);
const previewData = ref<null | XhsSharePreviewProps>(null);
const showQRCodeShare = ref<boolean>(false);

// 计算属性 - 简化组件显示逻辑
const showUrlInput = computed(() => {
  return (
    analysisState.value === AnalysisState.IDLE ||
    analysisState.value === AnalysisState.ANALYZING ||
    analysisState.value === AnalysisState.ERROR
  );
});

const showResults = computed(() => {
  return (
    analysisState.value === AnalysisState.COMPLETED &&
    shareData.value &&
    Object.keys(shareData.value).length > 0
  );
});

const isAnalyzing = computed(() => {
  return analysisState.value === AnalysisState.ANALYZING;
});

const hasError = computed(() => {
  return analysisState.value === AnalysisState.ERROR;
});

// 状态控制函数
const updateAnalysisState = (state: AnalysisState, error?: string) => {
  analysisState.value = state;
  if (error) {
    analysisError.value = error;
  } else if (state !== AnalysisState.ERROR) {
    analysisError.value = '';
  }
};

const updateProgress = (stepIndex: number) => {
  currentStepIndex.value = stepIndex;
};

const resetAnalysisData = () => {
  analysisState.value = AnalysisState.IDLE;
  currentStepIndex.value = 0;
  analysisError.value = '';
  shareData.value = {} as XhsShareInfo;
  previewData.value = null;
  showQRCodeShare.value = false;
};

// 暂停分析
const pauseAnalysis = () => {
  // 重置到初始状态
  resetAnalysisData();
  message.info('已暂停分析并重置数据');
};

// 开始分析
const startAnalysis = async () => {
  if (!xhsUrl.value.trim()) {
    message.error('请输入小红书链接');
    return;
  }
  resetAnalysisData();

  // 开始分析状态
  updateAnalysisState(AnalysisState.ANALYZING);
  updateProgress(0);
  console.log('解析链接中...', xhsUrl.value);

  try {
    // 调用后端接口
    const response = await UtilApi.handleXhsUrl({ url: xhsUrl.value });
    updateProgress(1);

    if (response) {
      // 分析完成
      updateProgress(2);
      // 设置分析结果数据
      shareData.value = {
        type: 'normal' as XhsNoteType,
        title: response.title,
        content: response.desc,
        images: response.imageList as string[],
        video: '',
        cover: '',
      };

      previewData.value = {
        shareInfo: shareData.value,
        userAvatar: response.avatar,
        userName: response.nickname,
        showPublish: false,
      };
      // 分析完成
      updateProgress(3);

      // 并行执行图片处理和内容生成接口，每个完成后立即更新进度
      const transformImagesPromise = CommonApi.transformImages({
        images: response.imageList as string[],
      }).then((transformImagesResponse) => {
        console.log('图片处理完成', transformImagesResponse);
        // 图片处理完成，立即更新进度
        updateProgress(4);
        return transformImagesResponse;
      });

      const generateContentPromise = CommonApi.generateContent({
        content: `${response.title}\n${response.desc}`,
      }).then((generateContentResponse) => {
        console.log('内容生成完成', generateContentResponse);
        // 内容生成完成，立即更新进度
        updateProgress(5);
        return generateContentResponse;
      });
      // 等待两个请求都完成并解构响应结果
      const [transformImagesResponse, generateContentResponse] =
        await Promise.all([transformImagesPromise, generateContentPromise]);

      // 使用返回结果
      shareData.value.images = transformImagesResponse || [];
      shareData.value.content = generateContentResponse.content;
      shareData.value.title = generateContentResponse.title;
      updateAnalysisState(AnalysisState.COMPLETED);
    } else {
      throw new Error('分析结果为空');
    }
  } catch (error: any) {
    const errorMessage = (error.message || '请检查链接是否正确') as string;
    if (errorMessage && errorMessage.includes('解析')) {
      updateAnalysisState(
        AnalysisState.ERROR,
        `${errorMessage} 并请检查链接是否正确`,
      );
    } else {
      message.error(`分析失败: ${errorMessage}`);
    }
  }
};

// 处理按钮点击 - 支持开始/暂停切换
const handleAnalysisToggle = () => {
  if (isAnalyzing.value) {
    // 当前正在分析，执行暂停操作
    pauseAnalysis();
  } else {
    // 当前未在分析，执行开始分析
    startAnalysis();
  }
};

// 按钮文本计算属性
const buttonText = computed(() => {
  return isAnalyzing.value ? '暂停分析' : '立即分析';
});

// 处理表单数据更新
const handleFormUpdate = (updatedShareInfo: XhsShareInfo) => {
  // 更新shareData以同步到二维码分享组件
  shareData.value = updatedShareInfo;

  // 更新预览数据以同步到预览组件
  if (previewData.value) {
    previewData.value.shareInfo = updatedShareInfo;
  }
};

type ShareInstance = InstanceType<typeof XhsShareForm>;

const shareFormRef = ref<ShareInstance>();
// 处理分享事件（从预览组件触发）
const handleShare = () => {
  // 校验表单参数， 校验成功后 在展示
  if (shareFormRef.value?.isValid()) {
    showQRCodeShare.value = true;
  } else {
    notification.warn({
      description: '请填写完整表单参数',
      message: '提醒',
      placement: 'topRight',
    });
  }
};

// 重置分析 - 添加确认对话框
const resetAnalysis = () => {
  Modal.confirm({
    title: '确认重新分析',
    content: '重新分析将清除当前的分析结果和编辑内容，确定要继续吗？',
    centered: true,
    okText: '确定',
    cancelText: '取消',
    onOk() {
      resetAnalysisData();
      message.success('已重置，可以开始新的分析');
    },
    onCancel() {
      // 用户取消，不执行任何操作
    },
  });
};
</script>

<template>
  <div class="xhs-analysis-page">
    <!-- 页面标题 -->
    <div v-if="!showResults" class="page-header">
      <h1>小红书笔记分析</h1>
    </div>

    <!-- URL输入区域 -->
    <div v-if="showUrlInput" class="url-input-section">
      <a-card shadow="none" title="输入小红书链接">
        <a-form layout="vertical">
          <a-form-item label="小红书链接" required>
            <a-input
              v-model:value="xhsUrl"
              allow-clear
              placeholder="请输入小红书笔记链接"
              size="large"
            />
          </a-form-item>
          <a-form-item>
            <a-button
              block
              danger
              size="large"
              type="primary"
              @click="handleAnalysisToggle"
            >
              <template #icon>
                <LoadingOutlined v-if="isAnalyzing" />
                <PlayCircleOutlined v-else />
              </template>
              {{ buttonText }}
            </a-button>
          </a-form-item>
        </a-form>

        <XhsAnalysisProgress
          :current-step="currentStepIndex"
          :error-message="analysisError"
          :has-error="hasError"
          :is-analyzing="isAnalyzing"
        />
      </a-card>
    </div>

    <!-- 分析结果区域 - 左右布局 -->
    <div v-if="showResults" class="analysis-result">
      <div class="result-layout">
        <!-- 左侧：编辑表单 -->
        <div class="form-section">
          <a-card class="form-card" title="小红书笔记分析结果">
            <XhsShareForm
              ref="shareFormRef"
              :initial-data="shareData"
              :show-actions="false"
              @update="handleFormUpdate"
            />
            <div class="form-actions">
              <a-button @click="resetAnalysis"> 重新分析</a-button>
            </div>
          </a-card>
        </div>

        <!-- 右侧：预览区域 - 智能粘性定位 -->
        <div class="preview-section">
          <div class="preview-sticky-container">
            <XhsSharePreview
              v-if="previewData"
              :share-info="previewData.shareInfo"
              :show-publish="false"
              :show-share-button="true"
              :user-avatar="previewData.userAvatar"
              :user-name="previewData.userName"
              @share="handleShare"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 二维码分享弹窗 -->
    <XhsQRCodeShare
      v-model:visible="showQRCodeShare"
      :share-info="shareData"
      @close="showQRCodeShare = false"
    />
  </div>
</template>

<style scoped>
/* 主容器样式 - 采用现代化布局设计 */
.xhs-analysis-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  min-height: 100%;
}

/* 页面标题区域 - 简约优雅的标题设计 */
.page-header {
  text-align: center;
  padding: 16px 0;
}

.page-header h1 {
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 600;
  color: #1a202c;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #ff2e4d 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* URL输入区域 - 现代化卡片设计 */
.url-input-section {
  max-width: 900px;
  margin: clamp(24px, 6vw, 48px) auto 0;
}

.url-input-section :deep(.ant-card) {
  border-radius: 16px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.url-input-section :deep(.ant-card-head) {
  border-bottom: 1px solid #f1f5f9;
  padding: 20px 24px 16px;
}

.url-input-section :deep(.ant-card-head-title) {
  font-weight: 700;
  color: #334155;
  font-size: 16px;
}

.url-input-section :deep(.ant-card-body) {
  padding: 24px;
}

/* 分析结果区域 - 优雅的双栏布局 */
.analysis-result {
  margin-top: 40px;
}

.result-layout {
  display: block;
  position: relative;
}

/* 表单区域样式 - 为固定预览区域留出空间 */
.form-section {
  min-width: 0;
  margin-left: 40px;
  max-width: calc((100vw / 6) * 2.8);
}

/* 预览区域固定定位 - 相对于视口 */
.preview-section {
  min-width: 0;
  position: fixed;
  top: 150px;
  right: calc(100vw / 6);
  z-index: 10;
}

/* 卡片样式优化 - 现代化设计语言 */
.form-card :deep(.ant-card),
.preview-card :deep(.ant-card) {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: fit-content;
}

.form-card :deep(.ant-card):hover,
.preview-card :deep(.ant-card):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.form-card :deep(.ant-card-head),
.preview-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f1f5f9;
  padding: 20px 24px 16px;
}

.form-card :deep(.ant-card-head-title),
.preview-card :deep(.ant-card-head-title) {
  font-weight: 600;
  color: #334155;
  font-size: 20px;
}

.form-card :deep(.ant-card-body),
.preview-card :deep(.ant-card-body) {
  padding: 24px;
}

/* 表单操作区域 - 精致的分割线和按钮布局 */
.form-actions {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-actions :deep(.ant-btn) {
  border-radius: 8px;
  font-weight: 500;
  height: 40px;
  padding: 0 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-actions :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #ff2e4d 0%, #ff5a6b 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(255, 46, 77, 0.3);
}

.form-actions :deep(.ant-btn-primary):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 46, 77, 0.4);
}

/* 错误提示区域 - 温和的错误展示 */
.error-section {
  max-width: 640px;
  margin: 40px auto;
}

.error-section :deep(.ant-alert) {
  border-radius: 12px;
  border: 1px solid #fecaca;
  background: rgba(254, 226, 226, 0.5);
  backdrop-filter: blur(10px);
}

.error-actions {
  text-align: center;
}

.error-actions :deep(.ant-btn) {
  border-radius: 8px;
  font-weight: 500;
  height: 40px;
  padding: 0 20px;
  margin-top: 16px;
}

/* 输入框和按钮样式优化 */
:deep(.ant-input) {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-input):focus {
  border-color: #ff2e4d;
  box-shadow: 0 0 0 3px rgba(255, 46, 77, 0.1);
}

:deep(.ant-btn) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #ff2e4d 0%, #ff5a6b 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(255, 46, 77, 0.3);
}

:deep(.ant-btn-primary):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 46, 77, 0.4);
}

:deep(.ant-btn-lg) {
  height: 48px;
  font-size: 16px;
  padding: 0 32px;
}
</style>
