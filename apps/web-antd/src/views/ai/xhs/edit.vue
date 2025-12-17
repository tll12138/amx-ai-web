<!-- 小红书笔记编辑页面 - 简化版本 -->
<script setup lang="ts">
import type {
  XhsNoteType,
  XhsShareInfo,
  XhsSharePreviewProps,
} from 'types/xhs';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { EditOutlined } from '@ant-design/icons-vue';
import { message, notification } from 'ant-design-vue';

import XhsQRCodeShare from './components/XhsQRCodeShare.vue';
import XhsShareForm from './components/XhsShareForm.vue';
import XhsSharePreview from './components/XhsSharePreview.vue';

// 响应式数据
const shareData = ref<XhsShareInfo>({
  type: 'normal' as XhsNoteType,
  title: '',
  content: '',
  images: [],
  video: '',
  cover: '',
});

const previewData = ref<XhsSharePreviewProps>({
  shareInfo: shareData.value,
  userAvatar: 'http://10.10.4.32:9000/pai/avatar.jpg',
  userName: '用户昵称',
  showPublish: false,
  showShareButton: true,
});

const showQRCodeShare = ref<boolean>(false);

// 处理表单数据更新
const handleFormUpdate = (updatedShareInfo: XhsShareInfo) => {
  // 更新shareData以同步到二维码分享组件
  shareData.value = updatedShareInfo;

  // 更新预览数据以同步到预览组件
  previewData.value.shareInfo = updatedShareInfo;
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
      message: '笔记数据缺失',
      placement: 'topRight',
    });
  }
};

// 重置表单内容
const resetForm = () => {
  shareData.value = {
    type: 'normal' as XhsNoteType,
    title: '',
    content: '',
    images: [],
    video: '',
    cover: '',
  };
  previewData.value.shareInfo = shareData.value;
  message.success('已重置表单内容');
};
</script>

<template>
  <Page>
    <div class="xhs-edit-page">
      <!-- 主要内容区域 - 左右布局 -->
      <div class="edit-layout">
        <!-- 左侧：编辑表单 -->
        <div class="form-section">
          <a-card class="form-card">
            <template #title>
              <div class="flex items-center">
                <EditOutlined class="label-icon mr-2" />
                <span>笔记设计</span>
                <span class="ml-4 mt-2 text-xs text-gray-500">
                  创作你的精彩内容，分享美好生活
                </span>
              </div>
            </template>

            <XhsShareForm
              ref="shareFormRef"
              :initial-data="shareData"
              @update="handleFormUpdate"
            />

            <!-- 自定义操作按钮 -->
            <div class="form-actions">
              <a-space>
                <a-button @click="resetForm" danger> 重置内容 </a-button>
              </a-space>
            </div>
          </a-card>
        </div>

        <!-- 右侧：实时预览区域 -->
        <div class="preview-section">
          <XhsSharePreview
            :share-info="previewData.shareInfo"
            :user-avatar="previewData.userAvatar"
            :user-name="previewData.userName"
            :show-publish="false"
            :show-share-button="true"
            @share="handleShare"
          />
        </div>
      </div>

      <!-- 二维码分享弹窗 -->
      <XhsQRCodeShare
        v-model:visible="showQRCodeShare"
        :share-info="shareData"
        @close="showQRCodeShare = false"
      />
    </div>
  </Page>
</template>

<style scoped>
/* 主容器样式 - 现代化设计 */
.xhs-edit-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
  padding: 0;
}

.label-icon {
  width: 24px;
  height: 24px;
  color: #ff4757;
  flex-shrink: 0;
}

/* 页面标题区域 - 优雅的标题设计 */
.page-header {
  text-align: center;
  padding: 40px 24px 32px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0;
  position: relative;
}

.page-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 2px;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%);
  border-radius: 1px;
}

.page-header h1 {
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 700;
  color: #334155;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.page-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
  max-width: 500px;
  margin: 0 auto;
}

/* 编辑布局 - 响应式双栏设计 */
.edit-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  align-items: start;
}

/* 表单区域样式 */
.form-section {
  min-width: 0;
}

/* 预览区域样式 */
.preview-section {
  min-width: 325px;
  position: fixed;
  top: 150px;
  right: calc(95vw / 6);
  z-index: 10;
}

/* 卡片样式优化 - 现代化设计语言 */
.form-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-card :deep(.ant-card) {
  border: none;
  box-shadow: none;
  background: transparent;
}

.form-card :deep(.ant-card-head) {
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 32px 20px;
  border-radius: 0;
}

.form-card :deep(.ant-card-head-title) {
  font-weight: 700;
  color: #1e293b;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-card :deep(.ant-card-body) {
  padding: 0;
}

/* 表单操作区域 - 精致的分割线和按钮布局 */
.form-actions {
  padding: 32px;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-actions :deep(.ant-btn) {
  border-radius: 12px;
  font-weight: 600;
  height: 44px;
  padding: 0 24px;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.form-actions :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(255, 71, 87, 0.3);
  color: #fff;
}

.form-actions :deep(.ant-btn-primary):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 71, 87, 0.4);
}

.form-actions :deep(.ant-btn-default) {
  background: #fff;
  border: 2px solid #e2e8f0;
  color: #64748b;
}

.form-actions :deep(.ant-btn-default):hover {
  border-color: #ff4757;
  color: #ff4757;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 71, 87, 0.1);
}

.form-actions :deep(.ant-btn-dangerous) {
  background: #fff;
  border: 2px solid #fecaca;
  color: #ef4444;
}

.form-actions :deep(.ant-btn-dangerous):hover {
  background: #fef2f2;
  border-color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
}

/* 滚动条样式优化 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
}
</style>
