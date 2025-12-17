<script setup lang="ts">
/**
 * 小红书二维码分享组件
 * 用于生成分享二维码，实现跨设备分享功能
 */

import type { XhsShareInfo } from 'types/xhs';

import { computed, ref, watch } from 'vue';

import {
  CloseOutlined,
  CopyOutlined,
  DownloadOutlined,
  QrcodeOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue';
import {
  Button as AButton,
  Card as ACard,
  Modal as AModal,
  Space as ASpace,
  Spin as ASpin,
  Typography as ATypography,
  message,
} from 'ant-design-vue';

import { ShareApi } from '#/api/xhs/share';
import { copyWithMsg } from '#/utils/copy';

import {
  downloadQRCode,
  generateXhsShareQRCode,
  validateQRCodeText,
} from '../utils/qrcode-generator';

// 组件属性定义
interface XhsQRCodeShareProps {
  /** 分享信息 */
  shareInfo: XhsShareInfo;
  /** 是否显示 */
  visible?: boolean;
  /** 二维码尺寸 */
  qrCodeSize?: number;
}

// 事件定义
interface XhsQRCodeShareEmits {
  /** 关闭事件 */
  close: [];
  /** 分享创建成功事件 */
  shareCreated: [shareId: string, shareUrl: string];
  /** 错误事件 */
  error: [error: Error];
}

// 定义props和emits
const props = withDefaults(defineProps<XhsQRCodeShareProps>(), {
  visible: false,
  qrCodeSize: 200,
});

const emit = defineEmits<XhsQRCodeShareEmits>();

const { Text, Title } = ATypography;

// 响应式数据
const loading = ref(false);
const qrCodeDataURL = ref('');
const shareId = ref('');
const shareUrl = ref('');
const expireTime = ref('');
const copyLoading = ref(false);

// 计算属性
const isValidShare = computed(() => {
  return (
    props.shareInfo &&
    (props.shareInfo.title || props.shareInfo.content) &&
    ((props.shareInfo.type === 'normal' && props.shareInfo.images?.length) ||
      (props.shareInfo.type === 'video' && props.shareInfo.video))
  );
});

/**
 * 生成二维码分享
 */
const generateQRCodeShare = async () => {
  if (!isValidShare.value) {
    message.error('请先完善分享内容');
    return;
  }

  loading.value = true;
  try {
    // 创建分享存储
    const response = await ShareApi.create(props.shareInfo);
    shareId.value = response.shareId;
    shareUrl.value = response.shareUrl;
    expireTime.value = response.expiresAt;

    // 验证分享链接
    if (!validateQRCodeText(shareUrl.value)) {
      throw new Error('分享链接格式无效');
    }

    // 生成二维码
    const qrCode = await generateXhsShareQRCode(shareUrl.value);
    qrCodeDataURL.value = qrCode;

    // 触发成功事件
    emit('shareCreated', shareId.value, shareUrl.value);
    message.success('二维码生成成功！请用手机扫码分享');
  } catch (error) {
    console.error('生成二维码分享失败:', error);
    const errorMsg =
      error instanceof Error ? error.message : '生成失败，请重试';
    message.error(errorMsg);
    emit('error', error as Error);
  } finally {
    loading.value = false;
  }
};

/**
 * 复制分享链接
 */
const copyShareUrl = async () => {
  if (!shareUrl.value) return;
  copyLoading.value = true;
  try {
    // 复制分享链接
    await copyWithMsg(shareUrl.value, '分享链接');
  } finally {
    copyLoading.value = false;
  }
};

/**
 * 下载二维码
 */
const downloadQRCodeImage = async () => {
  if (!shareUrl.value) return;

  try {
    await downloadQRCode(shareUrl.value, `xhs-share-${shareId.value}`, {
      width: props.qrCodeSize * 2, // 高分辨率
      color: {
        dark: '#FF2442',
        light: '#FFFFFF',
      },
    });
    message.success('二维码已下载');
  } catch {
    message.error('下载失败，请重试');
  }
};

/**
 * 重置数据
 */
const resetData = () => {
  qrCodeDataURL.value = '';
  shareId.value = '';
  shareUrl.value = '';
  expireTime.value = '';
  loading.value = false;
};

/**
 * 重新生成二维码
 */
const regenerateQRCode = () => {
  resetData();
  generateQRCodeShare();
};

/**
 * 关闭弹窗
 */
const handleClose = () => {
  emit('close');
};

// 监听分享信息变化
watch(
  () => props.shareInfo,
  () => {
    if (props.visible && isValidShare.value) {
      generateQRCodeShare();
    }
  },
  { deep: true },
);

// 监听显示状态变化
watch(
  () => props.visible,
  (visible) => {
    if (visible && isValidShare.value) {
      generateQRCodeShare();
    } else if (!visible) {
      resetData();
    }
  },
);

// 暴露方法给父组件
defineExpose({
  /** 生成二维码分享 */
  generateShare: generateQRCodeShare,
  /** 重新生成 */
  regenerate: regenerateQRCode,
  /** 重置 */
  reset: resetData,
});
</script>

<template>
  <AModal
    :open="visible"
    title="扫码分享到小红书"
    :width="480"
    :footer="null"
    centered
    @cancel="handleClose"
  >
    <template #closeIcon>
      <CloseOutlined />
    </template>

    <div class="qrcode-share-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <ASpin size="large" tip="正在生成二维码..." />
      </div>

      <!-- 二维码内容 -->
      <div v-else-if="qrCodeDataURL" class="qrcode-content">
        <!-- 二维码图片 -->
        <div class="qrcode-wrapper">
          <ACard class="qrcode-card" :bordered="false">
            <div class="qrcode-image-container">
              <img
                :src="qrCodeDataURL"
                :alt="`分享二维码 - ${shareId}`"
                class="qrcode-image"
                :style="{ width: `${qrCodeSize}px`, height: `${qrCodeSize}px` }"
              />
              <div class="qrcode-overlay">
                <QrcodeOutlined class="qrcode-icon" />
              </div>
            </div>
          </ACard>
        </div>

        <!-- 分享信息 -->
        <div class="share-info">
          <Title :level="4" class="share-title">
            <ShareAltOutlined class="title-icon" />
            用手机扫码分享
          </Title>

          <div class="info-item">
            <Text type="secondary">分享链接：</Text>
            <div class="url-container">
              <Text code class="share-url">{{ shareUrl }}</Text>
              <AButton
                type="text"
                size="small"
                :loading="copyLoading"
                @click="copyShareUrl"
              >
                <CopyOutlined />
              </AButton>
            </div>
          </div>

          <div class="info-item">
            <Text type="secondary">有效期至：</Text>
            <Text class="expire-time">{{ expireTime }}</Text>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <ASpace>
            <AButton @click="copyShareUrl" :loading="copyLoading">
              <CopyOutlined />
              复制链接
            </AButton>
            <AButton @click="downloadQRCodeImage">
              <DownloadOutlined />
              下载二维码
            </AButton>
            <AButton type="primary" @click="regenerateQRCode">
              <QrcodeOutlined />
              重新生成
            </AButton>
          </ASpace>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else class="error-container">
        <div class="error-content">
          <QrcodeOutlined class="error-icon" />
          <Title :level="4">生成二维码</Title>
          <Text type="secondary">点击下方按钮生成分享二维码</Text>
          <AButton
            type="primary"
            @click="generateQRCodeShare"
            :disabled="!isValidShare"
          >
            <QrcodeOutlined />
            生成二维码
          </AButton>
        </div>
      </div>
    </div>
  </AModal>
</template>

<style scoped>
.qrcode-share-container {
  padding: 16px 0;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.qrcode-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.qrcode-wrapper {
  display: flex;
  justify-content: center;
}

.qrcode-card {
  background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(255, 36, 66, 0.2);
}

.qrcode-image-container {
  position: relative;
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  padding: 8px;
}

.qrcode-image {
  display: block;
  border-radius: 8px;
}

.qrcode-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.qrcode-image-container:hover .qrcode-overlay {
  opacity: 1;
}

.qrcode-icon {
  font-size: 16px;
  color: #ff2442;
}

.share-info {
  width: 100%;
  max-width: 400px;
}

.share-title {
  text-align: center;
  margin-bottom: 16px !important;
  color: #333;
}

.title-icon {
  margin-right: 8px;
  color: #ff2442;
}

.info-item {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.url-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 6px;
}

.share-url {
  flex: 1;
  font-size: 12px;
  word-break: break-all;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}

.expire-time {
  color: #ff6b6b;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 8px;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  color: #d9d9d9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .qrcode-share-container {
    padding: 8px 0;
  }

  .qrcode-content {
    gap: 16px;
  }

  .qrcode-card {
    padding: 12px;
  }

  .share-info {
    max-width: 100%;
  }

  .action-buttons :deep(.ant-space) {
    flex-wrap: wrap;
    justify-content: center;
  }

  .action-buttons :deep(.ant-btn) {
    font-size: 12px;
    padding: 4px 8px;
  }
}

/* 动画效果 */
.qrcode-image {
  transition: transform 0.3s ease;
}

.qrcode-image:hover {
  transform: scale(1.02);
}

.qrcode-card {
  transition: box-shadow 0.3s ease;
}

.qrcode-card:hover {
  box-shadow: 0 12px 40px rgba(255, 36, 66, 0.3);
}
</style>
