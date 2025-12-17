<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { XhsNoteType, XhsShareInfo } from 'types/xhs';

import { computed, reactive, ref, watch } from 'vue';

import { Heading, Images, Newspaper, Sparkles, Undo2 } from '@vben/icons';

import { LoadingOutlined } from '@ant-design/icons-vue';
import {
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Textarea as ATextarea,
  Tooltip as ATooltip,
  message,
} from 'ant-design-vue';

import { CommonApi } from '#/api/xhs/common';
import { ImageUpload } from '#/components/upload';

import { XHS_CONFIG } from '../config';

// 组件属性定义
interface XhsShareFormProps {
  /** 初始分享信息 */
  initialData?: Partial<XhsShareInfo>;
}

// 事件定义
interface XhsShareFormEmits {
  /** 表单提交事件 */
  submit: [shareInfo: XhsShareInfo];
  /** 分享成功事件 */
  shareSuccess: [];
  /** 分享失败事件 */
  shareError: [error: Error];
  /** 表单数据更新事件 */
  update: [shareInfo: XhsShareInfo];
}

// 定义props和emits
const props = withDefaults(defineProps<XhsShareFormProps>(), {
  initialData: () => ({}),
  showPreview: true,
});

const emit = defineEmits<XhsShareFormEmits>();

// 表单引用
const formRef = ref();

// 表单数据
const formData = reactive<{
  content: string;
  cover: string;
  images: string[];
  title: string;
  type: XhsNoteType;
  video: string;
}>({
  type: 'normal',
  title: '',
  content: '',
  images: [],
  video: '',
  cover: '',
});

// 文件列表
const imageFileList = ref<string[]>([]);

// 加载状态
const isTransformingImages = ref(false);
const isOptimizingContent = ref(false);

// 内容备份状态（用于回退功能）
const contentBackup = ref<null | {
  content: string;
  title: string;
}>(null);

// 表单验证规则
const formRules: Record<string, Rule[]> = {
  title: [
    {
      max: XHS_CONFIG.SHARE.MAX_TITLE_LENGTH,
      message: `标题长度不能超过${XHS_CONFIG.SHARE.MAX_TITLE_LENGTH}个字符`,
    },
  ],
  content: [
    { required: true, message: '内容不能为空' },
    {
      max: XHS_CONFIG.SHARE.MAX_CONTENT_LENGTH,
      message: `内容长度不能超过${XHS_CONFIG.SHARE.MAX_CONTENT_LENGTH}个字符`,
    },
  ],
  images: [
    {
      required: true,
      message: '请上传图片',
      // 移除trigger，让校验在表单提交或手动调用时进行
      validator: (_, value) => {
        if (formData.type === 'normal' && (!value || value.length === 0)) {
          return Promise.reject(new Error('请上传图片'));
        }
        return Promise.resolve();
      },
    },
  ],
  video: [
    {
      validator: (_, value) => {
        if (formData.type === 'video' && !value) {
          return Promise.reject(new Error('视频类型必须上传视频文件'));
        }
        return Promise.resolve();
      },
    },
  ],
};

// 计算属性
const shareInfo = computed<XhsShareInfo>(() => ({
  type: formData.type,
  title: formData.title,
  content: formData.content,
  ...(formData.type === 'normal' && { images: formData.images }),
  ...(formData.type === 'video' && {
    video: formData.video,
    ...(formData.cover && { cover: formData.cover }),
  }),
}));

// 表单是否有效的计算属性
const isFormValid = computed(() => {
  const hasContent = formData.content.trim().length > 0;
  const hasImages =
    formData.type === 'normal' ? formData.images.length > 0 : true;

  return hasContent && hasImages;
});

// 监听初始数据
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      Object.assign(formData, {
        type: newData.type || 'normal',
        title: newData.title || '',
        content: newData.content || '',
        images: newData.images || [],
        video: newData.video || '',
        cover: newData.cover || '',
      });
    }
  },
  { immediate: true, deep: true },
);

// 监听表单数据变化，触发update事件
watch(
  () => shareInfo.value,
  (newShareInfo) => {
    emit('update', newShareInfo);
    // 只在有值的情况下清除对应字段的校验错误，避免过早显示错误提示
    if (formData.images.length > 0) {
      formRef.value?.clearValidate(['images']);
    }
    if (formData.title.trim()) {
      formRef.value?.clearValidate(['title']);
    }
    if (formData.content.trim()) {
      formRef.value?.clearValidate(['content']);
    }
  },
  { deep: true },
);

// 表单操作
const handleSubmit = async () => {
  try {
    // 提交前进行完整的表单校验
    await formRef.value?.validate();
    emit('submit', shareInfo.value);
  } catch (error) {
    console.warn('表单校验失败:', error);
    // 校验失败时不提交表单
  }
};

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields();
  formData.type = 'normal';
  formData.title = '';
  formData.content = '';
  formData.images = [];
  formData.video = '';
  formData.cover = '';
  imageFileList.value = [];
  // 清除内容备份
  contentBackup.value = null;
};

// 图片滤镜处理
const handleTransformImages = async () => {
  if (!formData.images || formData.images.length === 0) {
    message.warning('请先上传图片');
    return;
  }

  isTransformingImages.value = true;
  try {
    const transformedImages = await CommonApi.transformImages({
      images: formData.images,
    });

    if (transformedImages && transformedImages.length > 0) {
      formData.images = transformedImages;
      message.success('图片滤镜处理完成！');
    } else {
      message.error('图片处理失败，请重试');
    }
  } catch (error: any) {
    console.error('图片处理失败:', error);
    message.error(`图片处理失败: ${error.message || '请重试'}`);
  } finally {
    isTransformingImages.value = false;
  }
};

// 内容优化处理
const handleOptimizeContent = async () => {
  if (!formData.content.trim()) {
    message.warning('请先输入内容');
    return;
  }

  // 保存当前内容到备份（用于回退功能）
  contentBackup.value = {
    title: formData.title,
    content: formData.content,
  };

  isOptimizingContent.value = true;
  try {
    const optimizedResult = await CommonApi.generateContent({
      content: `${formData.title}\n${formData.content}`,
    });

    if (optimizedResult) {
      if (optimizedResult.title) {
        formData.title = optimizedResult.title;
      }
      if (optimizedResult.content) {
        formData.content = optimizedResult.content;
      }
      message.success('内容优化完成！');
    } else {
      message.error('内容优化失败，请重试');
      // 优化失败时清除备份
      contentBackup.value = null;
    }
  } catch (error: any) {
    console.error('内容优化失败:', error);
    message.error(`内容优化失败: ${error.message || '请重试'}`);
    // 优化失败时清除备份
    contentBackup.value = null;
  } finally {
    isOptimizingContent.value = false;
  }
};

// 内容回退处理
const handleRevertContent = () => {
  if (!contentBackup.value) {
    message.warning('没有可回退的内容');
    return;
  }

  // 恢复备份的内容
  formData.title = contentBackup.value.title;
  formData.content = contentBackup.value.content;

  // 清除备份
  contentBackup.value = null;

  message.success('已回退到优化前的内容！');
};

// 暴露方法给父组件
defineExpose({
  /** 获取表单数据 */
  getFormData: () => shareInfo.value,
  /** 验证表单 */
  validate: () => formRef.value?.validate(),
  /** 重置表单 */
  reset: handleReset,
  /** 设置表单数据 */
  setFormData: (data: Partial<XhsShareInfo>) => {
    Object.assign(formData, data);
  },
  /** 获取表单是否有效 */
  isValid: () => isFormValid.value,
  /** 图片滤镜处理 */
  transformImages: handleTransformImages,
  /** 内容优化 */
  optimizeContent: handleOptimizeContent,
  /** 内容回退 */
  revertContent: handleRevertContent,
});
</script>

<template>
  <div class="xhs-share-form">
    <AForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      layout="vertical"
      class="form-container"
      @finish="handleSubmit"
    >
      <!-- 标题输入区域 -->
      <div class="form-section">
        <AFormItem name="title" class="form-item">
          <template #label>
            <div class="form-label">
              <div class="label-content">
                <span class="label-text">标题</span>
                <Heading class="label-icon" />
                <span class="label-optional">选填</span>
              </div>
              <div class="label-tip">吸引人的标题有助于提高笔记曝光度</div>
            </div>
          </template>
          <div class="input-wrapper">
            <AInput
              v-model:value="formData.title"
              :maxlength="XHS_CONFIG.SHARE.MAX_TITLE_LENGTH"
              :show-count="true"
              size="large"
              allow-clear
              placeholder="输入吸引人的标题，让更多人看到你的内容..."
              class="form-input"
            />
          </div>
        </AFormItem>
      </div>

      <!-- 图片上传区域 -->
      <div
        v-if="formData.type === 'normal'"
        class="form-section"
        :class="{ 'section-disabled': isTransformingImages }"
      >
        <AFormItem name="images" class="form-item">
          <template #label>
            <div class="form-label">
              <div class="label-content">
                <span class="label-text">图片</span>
                <Images class="label-icon" />
                <span class="label-required">必填</span>
              </div>
              <div class="label-tip">支持上传最多10张图片，建议尺寸3:4</div>
            </div>
          </template>
          <div
            class="upload-wrapper"
            :class="{ 'wrapper-disabled': isTransformingImages }"
          >
            <div class="upload-container">
              <!-- 加载遮罩层 -->
              <div v-if="isTransformingImages" class="loading-overlay">
                <div class="loading-content">
                  <LoadingOutlined class="loading-icon" />
                  <span class="loading-text">正在优化图片，请稍候...</span>
                </div>
              </div>
              <ImageUpload
                v-model:value="formData.images"
                :max-number="10"
                :multiple="true"
                :show-description="false"
                :disabled="isTransformingImages"
                class="image-upload"
              />
              <!-- 一键加滤镜按钮 -->
              <div
                v-if="formData.images && formData.images.length > 0"
                class="image-actions"
              >
                <ATooltip title="批量为图片添加滤镜，提升视觉效果">
                  <button
                    :disabled="isTransformingImages"
                    class="filter-button"
                    :class="{ loading: isTransformingImages }"
                    @click="handleTransformImages"
                  >
                    <LoadingOutlined
                      v-if="isTransformingImages"
                      class="button-icon"
                    />
                    <Sparkles v-else class="button-icon" />
                    <span class="button-text">
                      {{ isTransformingImages ? '优化中...' : '图片优化' }}
                    </span>
                  </button>
                </ATooltip>
              </div>
            </div>
          </div>
        </AFormItem>
      </div>

      <!-- 内容输入区域 -->
      <div
        class="form-section"
        :class="{ 'section-disabled': isOptimizingContent }"
      >
        <AFormItem name="content" class="form-item">
          <template #label>
            <div class="form-label">
              <div class="label-content">
                <span class="label-text">内容</span>
                <Newspaper class="label-icon" />
                <span class="label-required">必填</span>
              </div>
              <div class="label-tip">
                分享你的想法、经验或故事，让内容更有价值
              </div>
            </div>
          </template>
          <div
            class="textarea-wrapper"
            :class="{ 'wrapper-disabled': isOptimizingContent }"
          >
            <div class="content-container">
              <!-- 加载遮罩层 -->
              <div v-if="isOptimizingContent" class="loading-overlay">
                <div class="loading-content">
                  <LoadingOutlined class="loading-icon" />
                  <span class="loading-text">正在优化内容，请稍候...</span>
                </div>
              </div>
              <ATextarea
                v-model:value="formData.content"
                :auto-size="{ minRows: 8, maxRows: 16 }"
                :maxlength="XHS_CONFIG.SHARE.MAX_CONTENT_LENGTH"
                :show-count="true"
                :disabled="isOptimizingContent"
                size="large"
                placeholder="分享你的想法、经验或故事...\n\n💡 小贴士：\n• 使用表情符号让内容更生动\n• 适当使用话题标签 #话题#\n• 分段展示，提高可读性"
                class="form-textarea"
              />
              <!-- 内容操作按钮组 -->
              <div v-if="formData.content.trim()" class="content-actions">
                <!-- 一键优化按钮 -->
                <ATooltip title="AI智能优化内容，提升吸引力和可读性">
                  <button
                    :disabled="isOptimizingContent"
                    class="optimize-button"
                    :class="{ loading: isOptimizingContent }"
                    @click="handleOptimizeContent"
                  >
                    <LoadingOutlined
                      v-if="isOptimizingContent"
                      class="button-icon"
                    />
                    <Sparkles v-else class="button-icon" />
                    <span class="button-text">
                      {{ isOptimizingContent ? '优化中...' : '内容优化' }}
                    </span>
                  </button>
                </ATooltip>

                <!-- 回退按钮 -->
                <ATooltip v-if="contentBackup" title="回退到优化前的内容">
                  <button
                    :disabled="isOptimizingContent"
                    class="revert-button"
                    @click="handleRevertContent"
                  >
                    <Undo2 class="button-icon" />
                    <span class="button-text">回退</span>
                  </button>
                </ATooltip>
              </div>
            </div>
          </div>
        </AFormItem>
      </div>
    </AForm>
  </div>
</template>

<style scoped>
/* 主容器样式 */
.xhs-share-form {
  max-width: 100%;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
  }
}

/* 表单容器 */
.form-container {
  padding: 40px;
}

/* 表单区块 */
.form-section {
  margin-bottom: 32px;
  position: relative;
}

.form-section:last-child {
  margin-bottom: 0;
}

/* 表单项样式 */
.form-item {
  margin-bottom: 0;
}

/* 标签样式重构 */
.form-label {
  margin-bottom: 12px;
}

.label-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.label-icon {
  width: 18px;
  height: 18px;
  color: #ff4757;
  flex-shrink: 0;
}

.label-text {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.label-required {
  background: linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(255, 71, 87, 0.2);
}

.label-optional {
  background: linear-gradient(135deg, #fca5a5 0%, #f87171 100%);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(248, 113, 113, 0.2);
}

.label-tip {
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

/* 输入框包装器 */
.input-wrapper,
.textarea-wrapper,
.upload-wrapper {
  position: relative;
}

/* 输入框样式优化 - 小红书主题色 */
.form-input :deep(.ant-input) {
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafbfc;
}

.ant-input-affix-wrapper:focus,
.ant-input-affix-wrapper-focused {
  border-color: #ff4757 !important;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(255, 71, 87, 0.1);
}
.ant-input-affix-wrapper:hover,
.ant-input-affix-wrapper-hovered {
  border-color: #ff4757 !important;
  background: #fff;
}

/* 文本域样式优化 */
.form-textarea :deep(.ant-input) {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  font-size: 15px;
  line-height: 1.6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafbfc;
  resize: vertical;
}

.form-textarea :deep(.ant-input:hover) {
  border-color: #ff4757;
  background: #fff;
}

.form-textarea :deep(.ant-input:focus) {
  border-color: #ff4757;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(255, 71, 87, 0.1);
}

/* 上传组件样式优化 */
.upload-wrapper {
  background: #fafbfc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.upload-wrapper:hover {
  border-color: #ff4757;
  background: rgba(255, 71, 87, 0.02);
}

/* 图片操作区域 */
.image-actions {
  position: absolute;
  top: -55px;
  right: 12px;
  z-index: 10;
}

/* 原生按钮基础样式 */
.filter-button,
.optimize-button,
.revert-button {
  /* 重置默认样式 */
  outline: none;
  cursor: pointer;
  user-select: none;

  /* 布局样式 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;

  /* 字体样式 */
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  line-height: 1;

  /* 过渡动画 */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* 定位和层级 */
  position: relative;
  overflow: hidden;
  z-index: 1;
}

/* 优化按钮样式 */
.filter-button,
.optimize-button {
  border: 1px solid #fb9b9b;
  background: linear-gradient(135deg, #fff 0%, #fef7f7 100%);
  color: #ff4757;
  box-shadow:
    0 4px 12px rgba(255, 71, 87, 0.15),
    0 2px 4px rgba(255, 71, 87, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 回退按钮样式 */
.revert-button {
  border: 1px solid #d1d5db;
  background: linear-gradient(135deg, #fff 0%, #f9fafb 100%);
  color: #6b7280;
  box-shadow:
    0 4px 12px rgba(107, 114, 128, 0.15),
    0 2px 4px rgba(107, 114, 128, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 按钮伪元素背景 */
.filter-button::before,
.optimize-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
  z-index: -1;
}

.revert-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
  z-index: -1;
}

/* 悬停效果 */
.filter-button:hover,
.optimize-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 8px 25px rgba(255, 71, 87, 0.25),
    0 4px 12px rgba(255, 71, 87, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.revert-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 8px 25px rgba(107, 114, 128, 0.25),
    0 4px 12px rgba(107, 114, 128, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.filter-button:hover::before,
.optimize-button:hover::before,
.revert-button:hover::before {
  opacity: 0.08;
}

/* 激活效果 */
.filter-button:active,
.optimize-button:active,
.revert-button:active {
  transform: translateY(-1px) scale(1.01);
  transition: all 0.15s ease;
}

/* 加载状态样式 */
.filter-button.loading,
.optimize-button.loading {
  background: linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%);
  color: #fff;
  box-shadow:
    0 6px 20px rgba(255, 71, 87, 0.3),
    0 2px 8px rgba(255, 71, 87, 0.2);
  cursor: not-allowed;
}

.filter-button.loading::before,
.optimize-button.loading::before {
  opacity: 0;
}

.filter-button.loading:hover,
.optimize-button.loading:hover {
  transform: none;
  box-shadow:
    0 6px 20px rgba(255, 71, 87, 0.3),
    0 2px 8px rgba(255, 71, 87, 0.2);
}

/* 禁用状态 */
.filter-button:disabled,
.optimize-button:disabled,
.revert-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.filter-button:disabled:hover,
.optimize-button:disabled:hover {
  transform: none;
  box-shadow:
    0 4px 12px rgba(255, 71, 87, 0.15),
    0 2px 4px rgba(255, 71, 87, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.revert-button:disabled:hover {
  transform: none;
  box-shadow:
    0 4px 12px rgba(107, 114, 128, 0.15),
    0 2px 4px rgba(107, 114, 128, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 按钮图标样式 */
.button-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* 按钮文字样式 */
.button-text {
  font-size: 14px;
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

/* 内容容器样式 */
.content-container {
  position: relative;
}

/* 内容操作区域 */
.content-actions {
  position: absolute;
  top: -55px;
  right: 12px;
  z-index: 10;
  display: flex;
  gap: 8px;
  align-items: center;
}

/* optimize-button 样式已在上面的通用样式中定义 */

.image-upload :deep(.ant-upload-select) {
  border-radius: 8px;
  overflow: hidden;
}

/* 字符计数样式 */
:deep(.ant-input-show-count-suffix) {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

/* 表单验证错误样式 */
:deep(.ant-form-item-has-error .ant-input),
:deep(.ant-form-item-has-error .ant-input-affix-wrapper),
:deep(.ant-form-item-has-error .ant-input:focus),
:deep(.ant-form-item-has-error .ant-input-affix-wrapper-focused) {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
}

:deep(.ant-form-item-explain-error) {
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.05);
  border-radius: 8px;
  border-left: 3px solid #ef4444;
}

/* 成功状态样式 */
:deep(.ant-form-item-has-success .ant-input),
:deep(.ant-form-item-has-success .ant-input-affix-wrapper) {
  border-color: #ff6b7a;
}

/* 禁用状态样式 */
.section-disabled {
  position: relative;
  pointer-events: none;
  user-select: none;
}

.wrapper-disabled {
  position: relative;
}

/* 加载遮罩层样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 12px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(255, 71, 87, 0.15);
  border: 1px solid rgba(255, 71, 87, 0.1);
}

.loading-icon {
  font-size: 24px;
  color: #ff4757;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  font-weight: 500;
  color: #ff4757;
  text-align: center;
  white-space: nowrap;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 禁用状态下的输入框样式 */
.form-textarea :deep(.ant-input:disabled) {
  background: #f5f5f5 !important;
  color: #999 !important;
  cursor: not-allowed !important;
  border-color: #d9d9d9 !important;
}

.form-textarea :deep(.ant-input:disabled:hover) {
  border-color: #d9d9d9 !important;
  background: #f5f5f5 !important;
}

/* 禁用状态下的上传组件样式 */
.image-upload :deep(.ant-upload.ant-upload-disabled) {
  background: #f5f5f5 !important;
  cursor: not-allowed !important;
}

.image-upload :deep(.ant-upload-disabled .ant-upload-btn) {
  color: #999 !important;
  cursor: not-allowed !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-container {
    padding: 16px;
  }

  .form-section {
    margin-bottom: 20px;
  }

  .label-text {
    font-size: 14px;
  }

  .label-tip {
    font-size: 12px;
  }

  /* 移动端按钮调整 */
  .image-actions,
  .content-actions {
    position: static;
    margin-top: 12px;
    text-align: right;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .filter-button,
  .optimize-button,
  .revert-button {
    width: auto;
    min-width: 80px;
    font-size: 12px;
    height: 32px;
    padding: 0 12px;
  }

  /* 移动端加载遮罩调整 */
  .loading-content {
    padding: 16px;
  }

  .loading-text {
    font-size: 13px;
  }
}
</style>
