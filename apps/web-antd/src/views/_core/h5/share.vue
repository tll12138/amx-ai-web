<script setup lang="ts">
/**
 * 移动端分享页面
 * 用于手机扫码后显示分享内容并分享到小红书
 */

import type { XhsShareInfo } from '../../../../types/xhs';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  ClockCircleOutlined,
  LinkOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue';
import {
  Button as AButton,
  Card as ACard,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Result as AResult,
  Space as ASpace,
  Spin as ASpin,
  Typography as ATypography,
  message,
} from 'ant-design-vue';

import { CommonApi } from '#/api/xhs/common';
import { ShareApi } from '#/api/xhs/share';
import { XhsApiService } from '#/api/xhs/token';

import { XhsShareButton, XhsSharePreview } from '../../ai/xhs/components';
import { detectMobileDevice } from '../../ai/xhs/utils/device-detector';

const { Text } = ATypography;

// 路由相关
const route = useRoute();

// 响应式数据
const loading = ref(true);
const shareData = ref<null | XhsShareInfo>(null);
const error = ref<string>('');
const shareId = ref<string>('');
const expireTime = ref<string>('');
const isMobile = ref(false);
const shareSuccess = ref(false);
const noteLink = ref('');
const linkSubmitted = ref(false);
const submittingLink = ref(false);

// 计算属性
const isExpired = computed(() => {
  if (!expireTime.value) return false;
  return new Date() > new Date(expireTime.value);
});

const pageTitle = computed(() => {
  if (shareData.value?.title) {
    return shareData.value.title;
  }
  return '小红书分享';
});

/**
 * 加载分享数据
 */
const loadShareData = async () => {
  try {
    loading.value = true;
    const response = await ShareApi.detail(shareId.value);
    if (response.expiresAt < new Date()) {
      error.value = '分享链接已过期';
      return;
    }
    expireTime.value = response.expiresAt.toLocaleString();
    shareData.value = response;

    // 更新页面标题
    document.title = pageTitle.value;

    // 如果不是移动设备，显示提示
    if (!isMobile.value) {
      message.info('建议在手机上打开此页面以获得更好的分享体验');
    }
  } catch (error_) {
    console.error('加载分享数据失败:', error_);
    error.value = error_ instanceof Error ? error_.message : '加载失败，请重试';
  } finally {
    loading.value = false;
  }
};

// 页面挂载时加载分享内容
onMounted(async () => {
  // 检测设备类型
  isMobile.value = detectMobileDevice();

  // 获取分享ID
  shareId.value = route.params.shareId as string;

  if (!shareId.value) {
    error.value = '无效的分享链接';
    loading.value = false;
    return;
  }

  // 设置页面标题
  document.title = '小红书分享 - 正在加载...';

  await loadShareData();
});

/**
 * 分享成功处理
 */
const handleShareSuccess = () => {
  shareSuccess.value = true;
  message.success('分享成功！');
};

/**
 * 分享失败处理
 */
const handleShareError = async () => {
  message.error(`分享失败: 请稍后重试`);
  await XhsApiService.refresh();
};

const buttonText = computed(() => {
  if (isExpired.value) return '分享已过期';
  if (!isMobile.value) return '请在手机中进行分享';
  return '点击按钮分享到小红书';
});

/**
 * 提交笔记链接
 */
const submitNoteLink = async () => {
  if (!noteLink.value.trim()) {
    message.warning('请输入笔记链接');
    return;
  }
  // 解析链接
  // 提取链接的正则表达式
  const urlPattern = /https?:\/\/\S+/;
  const match = noteLink.value.match(urlPattern);

  if (!match) {
    message.warning('请输入有效的链接地址');
    return;
  }

  try {
    submittingLink.value = true;
    // 这里可以调用API保存链接
    await CommonApi.addNote({ shareUrl: noteLink.value });

    linkSubmitted.value = true;
    message.success('笔记链接提交成功！');
  } catch (error) {
    console.error('提交链接失败:', error);
    message.error('提交失败，请重试');
  } finally {
    submittingLink.value = false;
  }
};

/**
 * 重新加载
 */
const reload = () => {
  error.value = '';
  shareSuccess.value = false;
  noteLink.value = '';
  linkSubmitted.value = false;
  submittingLink.value = false;
  loadShareData();
};
</script>

<template>
  <div class="mobile-share-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="logo">
          <ShareAltOutlined class="logo-icon" />
          <span class="logo-text">分享至小红书</span>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <ASpin size="large" tip="正在加载分享内容..." />
      </div>

      <!-- 错误状态 -->
      <AResult
        v-else-if="error"
        status="error"
        :title="error"
        sub-title="请检查分享链接是否正确或已过期"
      >
        <template #extra>
          <ASpace>
            <AButton type="primary" @click="reload">重新加载</AButton>
          </ASpace>
        </template>
      </AResult>

      <!-- 分享成功状态 -->
      <div v-else-if="shareSuccess" class="share-success-container">
        <!-- 链接提交成功状态 -->
        <AResult
          v-if="linkSubmitted"
          status="success"
          title="链接提交成功！"
          sub-title="感谢您的反馈，我们已收到您的笔记链接"
        >
          <template #extra>
            <ASpace>
              <AButton type="primary" @click="reload">继续分享</AButton>
            </ASpace>
          </template>
        </AResult>

        <!-- 链接提交表单 -->
        <ACard v-else class="link-form-card" title="分享您的笔记链接">
          <template #extra>
            <LinkOutlined class="card-icon" />
          </template>

          <div class="form-description">
            <Text type="secondary">
              请将您刚才分享到小红书的笔记链接粘贴到下方，帮助我们完善分享功能
            </Text>
          </div>

          <AForm layout="vertical" class="link-form">
            <AFormItem label="笔记链接" class="link-input-item">
              <AInput
                v-model:value="noteLink"
                placeholder="请粘贴小红书笔记链接，如：https://www.xiaohongshu.com/..."
                size="large"
                :disabled="submittingLink"
                @press-enter="submitNoteLink"
              >
                <template #prefix>
                  <LinkOutlined class="input-icon" />
                </template>
              </AInput>
            </AFormItem>

            <AFormItem class="form-actions">
              <ASpace size="middle">
                <AButton
                  type="primary"
                  size="large"
                  :loading="submittingLink"
                  @click="submitNoteLink"
                >
                  {{ submittingLink ? '提交中...' : '提交链接' }}
                </AButton>
                <AButton size="large" @click="reload"> 跳过 </AButton>
              </ASpace>
            </AFormItem>
          </AForm>
        </ACard>
      </div>

      <!-- 分享内容 -->
      <div v-else-if="shareData" class="share-content">
        <!-- 过期提示 -->
        <div v-if="isExpired" class="expire-warning">
          <ClockCircleOutlined class="warning-icon" />
          <Text type="warning">此分享链接已过期</Text>
        </div>

        <XhsSharePreview
          :share-info="shareData"
          user-name="用户昵称"
          :show-actions="true"
          :show-publish="false"
        />

        <!-- 分享按钮 -->
        <div class="share-actions">
          <XhsShareButton
            :share-info="shareData"
            :disabled="isExpired || !isMobile"
            :text="buttonText"
            size="large"
            block
            :on-error="handleShareError"
            :on-success="handleShareSuccess"
          />

          <div class="action-tips">
            <Text type="secondary" class="tips-text">
              {{
                isExpired
                  ? '分享已过期'
                  : isMobile
                    ? '点击上方按钮分享到小红书'
                    : '建议在手机上打开获得更好体验'
              }}
            </Text>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-share-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef0 0%, #fff5f5 100%);
  display: flex;
  flex-direction: column;
}

.page-header {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 600px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 20px;
  color: #ff2442;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.page-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  max-width: 600px;
  margin: auto;
  width: 100%;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.expire-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.warning-icon {
  color: #fa8c16;
}

.content-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  overflow: hidden;
}

.content-title {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.content-title :deep(.ant-typography) {
  margin-bottom: 0 !important;
  color: #333;
}

.content-text {
  margin-bottom: 20px;
}

.content-text :deep(.ant-typography) {
  margin-bottom: 0 !important;
  line-height: 1.6;
  color: #666;
}

.content-images,
.content-video {
  margin-bottom: 20px;
}

.images-header,
.video-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.media-icon {
  color: #ff2442;
  font-size: 16px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.content-image {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.content-image :deep(.ant-image) {
  width: 100%;
}

.content-image :deep(.ant-image img) {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.video-container {
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.video-player {
  width: 100%;
  max-height: 400px;
  display: block;
}

.share-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.meta-item {
  display: flex;
  gap: 8px;
}

.share-actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-tips {
  text-align: center;
}

.tips-text {
  font-size: 12px;
}

/* 分享成功容器样式 */
.share-success-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 链接表单卡片样式 */
.link-form-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.link-form-card :deep(.ant-card-head) {
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  border-bottom: none;
  padding: 16px 20px;
}

.link-form-card :deep(.ant-card-head-title) {
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.link-form-card :deep(.ant-card-body) {
  padding: 24px 20px;
}

.card-icon {
  color: #fff;
  font-size: 18px;
}

/* 表单描述样式 */
.form-description {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ff2442;
}

.form-description :deep(.ant-typography) {
  margin-bottom: 0 !important;
  line-height: 1.5;
}

/* 表单样式 */
.link-form {
  margin-top: 0;
}

.link-input-item {
  margin-bottom: 20px;
}

.link-input-item :deep(.ant-form-item-label) {
  font-weight: 600;
  color: #333;
}

.link-input-item :deep(.ant-input-affix-wrapper) {
  border-radius: 12px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.link-input-item :deep(.ant-input-affix-wrapper:focus),
.link-input-item :deep(.ant-input-affix-wrapper-focused) {
  border-color: #ff2442;
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.15);
}

.input-icon {
  color: #ff2442;
}

.form-actions {
  margin-bottom: 0;
  text-align: center;
}

.form-actions :deep(.ant-btn) {
  border-radius: 12px;
  font-weight: 600;
  min-width: 100px;
  height: 44px;
}

.form-actions :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.3);
  transition: all 0.3s ease;
}

.form-actions :deep(.ant-btn-primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 36, 66, 0.4);
}

.form-actions :deep(.ant-btn-default) {
  border: 2px solid #e8e8e8;
  color: #666;
  transition: all 0.3s ease;
}

.form-actions :deep(.ant-btn-default:hover) {
  border-color: #ff2442;
  color: #ff2442;
}

.page-footer {
  text-align: center;
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.footer-text {
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .page-content {
    padding: 12px;
  }

  .content-card {
    margin-bottom: 16px;
  }

  .images-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 6px;
  }

  .content-image :deep(.ant-image img) {
    height: 100px;
  }

  .logo-text {
    font-size: 14px;
  }

  /* 表单响应式样式 */
  .link-form-card {
    border-radius: 12px;
    margin: 0 -4px;
  }

  .link-form-card :deep(.ant-card-head) {
    padding: 12px 16px;
  }

  .link-form-card :deep(.ant-card-body) {
    padding: 20px 16px;
  }

  .form-description {
    padding: 10px 12px;
    margin-bottom: 16px;
  }

  .link-input-item :deep(.ant-input-affix-wrapper) {
    border-radius: 8px;
  }

  .form-actions :deep(.ant-btn) {
    border-radius: 8px;
    height: 40px;
    min-width: 80px;
  }

  .share-success-container {
    gap: 16px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .mobile-share-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  }

  .page-header {
    background: #1f1f1f;
    border-bottom-color: #333;
  }

  .content-card {
    background: #1f1f1f;
  }

  .logo-text {
    color: #fff;
  }

  .content-title :deep(.ant-typography) {
    color: #fff !important;
  }

  .content-text :deep(.ant-typography) {
    color: #ccc !important;
  }

  /* 表单暗色模式样式 */
  .link-form-card {
    background: #1f1f1f;
    border-color: #333;
  }

  .link-form-card :deep(.ant-card-head) {
    background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  }

  .form-description {
    background: #2a2a2a;
    border-left-color: #ff2442;
  }

  .form-description :deep(.ant-typography) {
    color: #ccc !important;
  }

  .link-input-item :deep(.ant-form-item-label) {
    color: #fff !important;
  }

  .link-input-item :deep(.ant-input-affix-wrapper) {
    background: #2a2a2a;
    border-color: #444;
    color: #fff;
  }

  .link-input-item :deep(.ant-input) {
    background: transparent;
    color: #fff;
  }

  .link-input-item :deep(.ant-input::placeholder) {
    color: #666;
  }

  .form-actions :deep(.ant-btn-default) {
    background: #2a2a2a;
    border-color: #444;
    color: #ccc;
  }

  .form-actions :deep(.ant-btn-default:hover) {
    border-color: #ff2442;
    color: #ff2442;
    background: #2a2a2a;
  }
}

/* 动画效果 */
.content-card {
  animation: slideUp 0.3s ease-out;
}

.share-success-container {
  animation: fadeInUp 0.5s ease-out;
}

.link-form-card {
  animation: slideInScale 0.4s ease-out 0.2s both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInScale {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.content-image {
  transition: transform 0.2s ease;
}

.content-image:hover {
  transform: scale(1.02);
}

/* 表单交互动画 */
.link-input-item :deep(.ant-input-affix-wrapper) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-actions :deep(.ant-btn) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-actions :deep(.ant-btn:active) {
  transform: scale(0.98);
}
</style>
