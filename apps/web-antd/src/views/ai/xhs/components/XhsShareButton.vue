<script setup lang="ts">
import type { ButtonProps } from 'ant-design-vue';

import type { XhsShareConfig, XhsShareInfo } from '../../../../../types/xhs';

import { computed, ref } from 'vue';

import { Button as AButton, message } from 'ant-design-vue';

import { xhsSDK } from '#/utils/xhs/xhs-sdk';

import { getCompleteVerifyConfig } from '../../../../api/xhs/token';
import { XHS_CONFIG } from '../config';

// 组件属性定义
interface XhsShareButtonProps {
  /** 分享信息 */
  shareInfo: XhsShareInfo;
  /** 按钮文本 */
  text?: string;
  /** 按钮类型 */
  buttonType?: ButtonProps['type'];
  /** 按钮尺寸 */
  size?: ButtonProps['size'];
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否为危险按钮 */
  danger?: boolean;
  /** 是否为幽灵按钮 */
  ghost?: boolean;
  /** 按钮形状 */
  shape?: ButtonProps['shape'];
  /** 是否为块级按钮 */
  block?: boolean;
  /** 自定义样式 */
  customStyle?: boolean;
  /** 应用Key（可选，默认使用配置文件中的） */
  appKey?: string;
  /** 分享前的回调 */
  beforeShare?: () => boolean | Promise<boolean>;
  /** 分享成功的回调 */
  onSuccess?: () => void;
  /** 分享失败的回调 */
  onError?: (error: Error) => void;
}

// 定义props和emits
const props = withDefaults(defineProps<XhsShareButtonProps>(), {
  text: '分享到小红书',
  buttonType: 'primary',
  size: 'middle',
  disabled: false,
  showIcon: true,
  danger: false,
  ghost: false,
  shape: 'default',
  block: false,
  customStyle: false,
  appKey: '',
  beforeShare: () => true,
  onSuccess: () => {},
  onError: (error: Error) => {
    message.error(error.message);
  },
});

// 响应式数据
const loading = ref(false);

// 计算属性
const buttonText = computed(() => {
  if (loading.value) {
    return '分享中...';
  }
  return props.text;
});

const currentAppKey = computed(() => {
  return props.appKey || XHS_CONFIG.APP_KEY;
});

// 验证分享信息
const validateShareInfo = (shareInfo: XhsShareInfo): void => {
  if (!shareInfo.type) {
    throw new Error('分享类型不能为空');
  }

  if (!['normal', 'video'].includes(shareInfo.type)) {
    throw new Error('分享类型必须是 video 或 normal');
  }

  // 验证标题长度
  if (
    shareInfo.title &&
    shareInfo.title.length > XHS_CONFIG.SHARE.MAX_TITLE_LENGTH
  ) {
    throw new Error(
      `标题长度不能超过${XHS_CONFIG.SHARE.MAX_TITLE_LENGTH}个字符`,
    );
  }

  // 验证内容长度
  if (
    shareInfo.content &&
    shareInfo.content.length > XHS_CONFIG.SHARE.MAX_CONTENT_LENGTH
  ) {
    throw new Error(
      `内容长度不能超过${XHS_CONFIG.SHARE.MAX_CONTENT_LENGTH}个字符`,
    );
  }

  // 验证图文类型
  if (shareInfo.type === 'normal') {
    if (!shareInfo.images || shareInfo.images.length === 0) {
      throw new Error('图文类型分享必须提供图片');
    }
    if (shareInfo.images.length > XHS_CONFIG.SHARE.MAX_IMAGES) {
      throw new Error(`图片数量不能超过${XHS_CONFIG.SHARE.MAX_IMAGES}张`);
    }
    if (shareInfo.images.length < XHS_CONFIG.SHARE.MIN_IMAGES) {
      throw new Error(`图片数量不能少于${XHS_CONFIG.SHARE.MIN_IMAGES}张`);
    }
  }

  // 验证视频类型
  if (shareInfo.type === 'video' && !shareInfo.video) {
    throw new Error('视频类型分享必须提供视频URL');
  }
};

// 处理分享点击
const handleShare = async (): Promise<void> => {
  if (loading.value || props.disabled) {
    return;
  }

  try {
    // 验证配置
    if (!currentAppKey.value) {
      throw new Error('应用Key未配置，请检查环境变量 VITE_XHS_APP_KEY');
    }

    // 验证分享信息
    validateShareInfo(props.shareInfo);

    // 执行分享前回调
    if (props.beforeShare) {
      const canShare = await props.beforeShare();
      if (!canShare) {
        return;
      }
    }

    loading.value = true;

    // 获取验证配置
    const verifyConfig = await getCompleteVerifyConfig(currentAppKey.value);
    let flag = true;

    // 构建分享配置
    const shareConfig: XhsShareConfig = {
      shareInfo: {
        ...props.shareInfo,
        // 如果没有提供标题和内容，使用默认值
        title: props.shareInfo.title || XHS_CONFIG.SHARE.DEFAULT_TITLE,
        content: props.shareInfo.content || XHS_CONFIG.SHARE.DEFAULT_CONTENT,
      },
      verifyConfig,
      fail: (error) => {
        flag = false;
        console.error('小红书SDK分享失败:', error.message);
        props.onError(error);
      },
    };

    // 执行分享
    await xhsSDK.share(shareConfig);
    if (flag) {
      // 分享成功
      props.onSuccess();
    }
  } finally {
    loading.value = false;
  }
};

// 暴露方法给父组件
defineExpose({
  /** 手动触发分享 */
  share: handleShare,
  /** 获取加载状态 */
  isLoading: () => loading.value,
});
</script>

<template>
  <AButton
    :type="buttonType"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :danger="danger"
    :ghost="ghost"
    :shape="shape"
    :block="block"
    class="xhs-share-button"
    :class="[
      {
        'xhs-share-button--custom': customStyle,
      },
    ]"
    @click="handleShare"
  >
    <template #icon v-if="showIcon">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="xhs-icon"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        />
      </svg>
    </template>
    {{ buttonText }}
  </AButton>
</template>

<style lang="scss" scoped>
.xhs-share-button {
  transition: all 0.3s ease;
}

.xhs-share-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.xhs-share-button--custom {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border: none;
  color: white;
}

.xhs-share-button--custom:hover {
  background: linear-gradient(135deg, #ee5a24, #ff6b6b);
  color: white;
}

.xhs-icon {
  margin-right: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .xhs-share-button {
    font-size: 14px;
    padding: 8px 16px;
  }
}

@media (max-width: 480px) {
  .xhs-share-button {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>
