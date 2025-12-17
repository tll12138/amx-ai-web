<script setup lang="ts">
import type { XhsSharePreviewProps } from 'types/xhs';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import {
  HeartFilled,
  HeartOutlined,
  LeftOutlined,
  MessageOutlined,
  QrcodeOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons-vue';
import { Avatar as AAvatar, Button as AButton } from 'ant-design-vue';

// 定义事件
interface XhsSharePreviewEmits {
  /** 分享事件 */
  share: [];
}

// 定义props
const props = withDefaults(defineProps<XhsSharePreviewProps>(), {
  shareInfo: () => ({}),
  userAvatar: '',
  userName: '',
  showPublish: false,
  showShareButton: false,
});

// 定义emits
const emit = defineEmits<XhsSharePreviewEmits>();

// 响应式数据
const isLiked = ref(false);
const isStarred = ref(false);
// Embla Carousel 相关
const emblaRef = ref<HTMLElement>();
const emblaApi = ref<any>();

const currentImageIndex = ref(0);
const canScrollPrev = ref(false);
const canScrollNext = ref(false);

// 计算属性
const defaultAvatar = computed(() => {
  return props.userAvatar || 'http://10.10.4.32:9000/pai/avatar.jpg';
});

// 获取图片数组
const imageList = computed(() => {
  console.log('图片数组', props.shareInfo?.images);
  const images = props.shareInfo?.images || [];
  // 如果没有图片，返回默认占位图
  return images.length > 0 ? images : [''];
});

// 图片总数
const totalImages = computed(() => imageList.value.length);

// 是否显示轮播指示器
const showCarouselIndicator = computed(() => totalImages.value > 1);

// 事件处理
const handleLike = () => {
  isLiked.value = !isLiked.value;
};

const handleStar = () => {
  isStarred.value = !isStarred.value;
};

// 处理分享事件
const handleShare = () => {
  emit('share');
};
// Embla Carousel 事件处理
const updateCarouselState = () => {
  if (!emblaApi.value) return;
  currentImageIndex.value = emblaApi.value.selectedScrollSnap();
  canScrollPrev.value = emblaApi.value.canScrollPrev();
  canScrollNext.value = emblaApi.value.canScrollNext();
};

// 初始化Embla Carousel
const initEmblaCarousel = async () => {
  if (!emblaRef.value || !showCarouselIndicator.value) return;

  // 销毁之前的实例
  if (emblaApi.value) {
    emblaApi.value.destroy();
  }

  // 动态导入embla-carousel
  const emblaModule = await import('embla-carousel');
  const EmblaCarousel = emblaModule.default;

  // 创建新的实例
  emblaApi.value = EmblaCarousel(emblaRef.value, {
    loop: false,
    align: 'start',
    skipSnaps: false,
    dragFree: false,
  });

  // 绑定事件监听器
  emblaApi.value.on('select', updateCarouselState);
  emblaApi.value.on('reInit', updateCarouselState);

  // 初始化状态
  updateCarouselState();
};
const scrollTo = (index: number) => {
  if (emblaApi.value) emblaApi.value.scrollTo(index);
};

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.warn('图片加载失败:', img.src);
};

// 图片加载成功处理
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.log('图片加载成功:', img.src);
};

// 生命周期
onMounted(async () => {
  await nextTick();
  if (showCarouselIndicator.value) {
    await initEmblaCarousel();
  }
});

// 监听图片变化，重新初始化轮播图
watch(
  () => imageList.value,
  async () => {
    if (showCarouselIndicator.value) {
      await nextTick();
      await initEmblaCarousel();
    }
  },
  { deep: true },
);

// 监听轮播模式变化，重新初始化轮播图
watch(
  () => showCarouselIndicator.value,
  async (newVal) => {
    console.log('轮播模式变化', newVal);
    // 等待 DOM 更新完成
    await nextTick();

    if (newVal) {
      // 切换到多图模式，初始化轮播
      console.log('切换到多图模式，初始化轮播');
      await initEmblaCarousel();
    } else {
      // 切换到单图模式，销毁轮播功能
      console.log('切换到单图模式，销毁轮播');
      if (emblaApi.value) {
        emblaApi.value.destroy();
        emblaApi.value = null;
      }
      currentImageIndex.value = 0;
    }
  },
);
</script>

<template>
  <div class="xhs-share-preview">
    <!-- 导航栏 -->
    <div class="nav-bar">
      <LeftOutlined />
      <div class="nav-center">
        <AAvatar :src="defaultAvatar" :size="30" />
        <span class="nav-title">{{ props.userName || 'Definition' }}</span>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="scrollable-content">
      <!-- Embla轮播图区域 -->
      <div class="image-section">
        <div class="embla-carousel">
          <!-- 多图轮播模式 -->
          <template v-if="showCarouselIndicator">
            <div ref="emblaRef" class="embla__viewport" key="multi-image">
              <div class="embla__container">
                <div
                  v-for="(image, index) in imageList"
                  :key="index"
                  class="embla__slide"
                >
                  <div class="embla__slide__content">
                    <img
                      v-if="image"
                      :src="image"
                      :alt="`产品图片 ${index + 1}`"
                      class="carousel-image"
                      @error="handleImageError"
                      @load="handleImageLoad"
                    />
                    <!-- 默认占位图 -->
                    <div v-else class="image-placeholder">
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="#ccc"
                      >
                        <path
                          d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                        />
                      </svg>
                      <p>图片</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 图片位置角标 -->
            <div class="image-counter">
              {{ currentImageIndex + 1 }}/{{ totalImages }}
            </div>

            <!-- 自定义轮播指示器 -->
            <div class="carousel-indicators">
              <span
                v-for="(_, index) in imageList"
                :key="index"
                class="indicator"
                :class="{ active: index === currentImageIndex }"
                @click="scrollTo(index)"
              ></span>
            </div>
          </template>

          <!-- 单图模式 -->
          <template v-else>
            <div class="single-image-container">
              <img
                v-if="imageList[0]"
                :src="imageList[0]"
                alt="产品图片"
                class="carousel-image"
                @error="handleImageError"
                @load="handleImageLoad"
              />
              <!-- 默认占位图 -->
              <div v-else class="image-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="#ccc">
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  />
                </svg>
                <p>图片</p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-section">
        <div class="title-info">
          <span class="title">{{ shareInfo?.title }}</span>
        </div>
        <div class="content-text">
          {{ shareInfo?.content || '....' }}
        </div>
        <div class="time-info">
          <span class="time">刚刚</span>
        </div>
      </div>

      <!-- 底部交互区域 -->
      <div class="action-bar">
        <!-- 点赞 -->
        <AButton type="text" class="action-btn" @click="handleLike">
          <template #icon>
            <HeartFilled v-if="isLiked" class="liked" />
            <HeartOutlined v-else />
          </template>
          <span class="action-text">点赞</span>
        </AButton>

        <!-- 收藏 -->
        <AButton type="text" class="action-btn" @click="handleStar">
          <template #icon>
            <StarFilled v-if="isStarred" class="starred" />
            <StarOutlined v-else />
          </template>
          <span class="action-text">收藏</span>
        </AButton>

        <!-- 评论 -->
        <AButton type="text" class="action-btn">
          <template #icon>
            <MessageOutlined />
          </template>
          <span class="action-text">评论</span>
        </AButton>
      </div>
    </div>

    <!-- 固定底部发布区域 -->
    <div v-if="showPublish" class="fixed-bottom">
      <!-- 发布区域 -->
      <div class="publish-section">
        <div class="publish-btn">发布笔记</div>
      </div>
      <!-- 底部指示器 -->
      <div class="bottom-indicator"></div>
    </div>

    <div v-if="showShareButton" class="fixed-bottom">
      <!-- 分享按钮区域 -->
      <div class="publish-section">
        <AButton type="primary" class="publish-btn" @click="handleShare">
          <QrcodeOutlined />
          分享到红书
        </AButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.xhs-share-preview {
  max-width: 325px;
  max-height: 1000px;
  margin: 0 auto;
  background: #f8f8f8;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;

  // 隐藏滚动条
  ::-webkit-scrollbar {
    display: none;
  }
}

// 状态栏
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #000;
  color: #fff;
  font-size: 14px;
  font-weight: 600;

  .time {
    font-size: 16px;
  }

  .status-icons {
    display: flex;
    gap: 4px;
    font-size: 12px;
  }
}

// 导航栏
.nav-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 12px 16px;
  background: #fff;

  .nav-center {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 8px;
    justify-content: center;

    .nav-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
  }
}

// 可滚动内容区域
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  max-height: 600px;
  background: #fff;

  // 隐藏滚动条
  &::-webkit-scrollbar {
    display: none;
  }

  // 兼容Firefox
  scrollbar-width: none;

  // 兼容IE
  -ms-overflow-style: none;
}

// 固定底部区域
.fixed-bottom {
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

// 标题区域
.title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 16px 16px 12px;
  border-bottom: 2px solid #ff4757;

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0;
    line-height: 1.3;
  }

  .volume {
    font-size: 14px;
    color: #666;
    margin-top: 4px;
  }
}

// Embla轮播图区域
.image-section {
  margin-bottom: 0;
  position: relative;

  .embla-carousel {
    position: relative;
    width: 100%;
    max-height: 450px; // 限制最大高度为450px
    min-height: 250px;
    overflow: hidden;
    background: #ffffff; // 设置白色背景
    display: flex;
    flex-direction: column;
    align-items: center; // 垂直居中
    justify-content: center; // 水平居中
  }

  // Embla轮播图样式
  .embla__viewport {
    overflow: hidden;
    width: 100%;
    max-height: 450px; // 限制视口最大高度
    min-height: 250px; // 最小高度
    display: flex;
    align-items: center; // 垂直居中
  }

  .embla__container {
    display: flex;
    height: auto; // 自适应高度
    max-height: 450px; // 限制最大高度
    margin-left: calc(var(--slide-spacing, 1rem) * -1);
    align-items: center; // 垂直居中
  }

  .embla__slide {
    flex: 0 0 100%;
    min-width: 0;
    padding-left: var(--slide-spacing, 1rem);
    position: relative;
    height: auto; // 自适应高度
    max-height: 450px; // 限制最大高度
    display: flex;
    align-items: center; // 垂直居中
  }

  .embla__slide__content {
    width: 100%;
    height: auto; // 自适应高度
    max-height: 450px; // 限制最大高度
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0;
    overflow: hidden;
    background: #ffffff; // 确保背景为白色
  }

  .single-image-container {
    width: 100%;
    height: auto; // 自适应高度
    max-height: 450px; // 限制最大高度
    min-height: 250px; // 最小高度
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff; // 确保背景为白色
  }

  .carousel-image {
    max-width: 100%;
    max-height: 450px; // 限制最大高度为450px
    width: auto; // 自动宽度以保持纵横比
    height: auto; // 自动高度以保持纵横比
    object-fit: contain; // 保持纵横比，完整显示图片
    display: block;
    background: #ffffff; // 图片背景为白色
  }

  .image-placeholder {
    text-align: center;
    color: #999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    p {
      margin: 8px 0 0 0;
      font-size: 14px;
    }
  }

  // 图片位置角标
  .image-counter {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    z-index: 10;
  }

  // 轮播控制按钮
  .embla__button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    color: #333;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    &:hover {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-50%) scale(1.1);
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }

    &--prev {
      left: 12px;
    }

    &--next {
      right: 12px;
    }
  }

  // 自定义轮播指示器
  .carousel-indicators {
    display: flex;
    height: 8px;
    margin-top: 5px;
    align-items: center;
    gap: 5px;
    z-index: 10;

    .indicator {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #e4e4e7;
      cursor: pointer;
      transition: all 0.3s ease;

      &.active {
        background: red;
        transform: scale(1.2);
      }

      &:hover {
        transform: scale(1.2);
        background: grey;
      }
    }
  }
}

// 内容区域
.content-section {
  padding: 12px 16px;

  .title-info {
    margin-bottom: 8px;

    .title {
      font-size: 14px;
      font-weight: 700;
      color: #333;
    }
  }

  .content-text {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    margin-bottom: 8px;
    white-space: pre-wrap;
  }

  .time-info {
    .time {
      font-size: 12px;
      color: #999;
    }
  }
}

// 交互按钮区域
.action-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px 36px;
  background: #fff;
  border-top: 1px solid #f0f0f0;

  .action-btn {
    padding: 4px 6px;
    border: none;
    background: transparent;
    color: #666;
    height: auto;

    .action-text {
      font-size: 12px;
    }

    .liked {
      color: #ff4757;
    }

    .starred {
      color: #ffa502;
    }
  }
}

// 发布按钮区域
.publish-section {
  padding: 10px 16px;
  background: #fff;

  .publish-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 24px;
    background: #ff4757;
    border-color: #ff4757;
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #ff3742;
      transform: translateY(-1px);
    }
  }
}

// 分享按钮区域
.share-section {
  padding: 8px 16px 12px;
  background: #fff;
  border-top: 1px solid #f0f0f0;

  .share-btn {
    width: 100%;
    height: 44px;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
    border: none;
    box-shadow: 0 2px 8px rgba(255, 36, 66, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: linear-gradient(135deg, #e91e3a 0%, #ff5252 100%) !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(255, 36, 66, 0.3) !important;
    }

    &:active {
      transform: translateY(0);
    }

    &:focus {
      background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%) !important;
      box-shadow: 0 2px 8px rgba(255, 36, 66, 0.2) !important;
    }

    // 图标样式
    :deep(.anticon) {
      margin-right: 6px;
      font-size: 16px;
    }
  }
}

// 底部指示器
.bottom-indicator {
  width: 134px;
  height: 5px;
  background: #000;
  border-radius: 2.5px;
  margin: 8px auto;
}

// 桌面模式适配
.xhs-preview-desktop {
  .status-bar {
    display: none; // 桌面模式隐藏状态栏
  }

  .nav-bar {
    padding: 16px 20px;
  }

  .title-section {
    padding: 20px 20px 16px;
  }

  .content-section {
    padding: 20px;
  }

  .action-bar {
    padding: 12px 20px 40px;
  }

  .publish-section {
    padding: 12px 20px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .xhs-share-preview {
    max-width: 100%;
    border-radius: 0;
  }
}
</style>
