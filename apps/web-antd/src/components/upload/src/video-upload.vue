<script lang="ts" setup>
import type { UploadFile, UploadProps } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';

import type { AxiosResponse } from '@vben/request';

import type { AxiosProgressEvent } from '#/api';

import { ref, toRefs, watch } from 'vue';

import { $t } from '@vben/locales';

import {
  DeleteOutlined,
  EyeOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons-vue';
import { message, Modal, Upload } from 'ant-design-vue';
import { isArray, isFunction, isObject, isString, uniqueId } from 'lodash-es';

import { uploadApi } from '#/api';
import { ossInfo } from '#/api/system/oss';

import { checkFileType } from './helper';
import { UploadResultStatus } from './typing';
import { useUploadType } from './use-upload';

defineOptions({ name: 'VideoUpload', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /**
     * 包括拓展名(不带点) 文件头(video/mp4等 不包括泛写法即video/*)
     */
    accept?: string[];
    api?: (
      file: Blob | File,
      onUploadProgress?: AxiosProgressEvent,
    ) => Promise<AxiosResponse<any>>;
    disabled?: boolean;
    height?: number | string;
    helpText?: string;
    // 文件最大多少MB
    maxSize?: number;
    // 返回的字段 默认url
    resultField?: 'fileName' | 'ossId' | 'url';
    /**
     * 是否显示下面的描述
     */
    showHelpText?: boolean;
    /**
     * 是否显示预览按钮
     */
    showPreviewButton?: boolean;
    value?: string | string[];
    width?: number | string;
  }>(),
  {
    accept: () => ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
    api: uploadApi,
    disabled: false,
    helpText: '',
    maxSize: 100,
    resultField: '',
    showHelpText: true,
    showPreviewButton: true,
    value: () => [],
    width: '100%',
    height: 'auto',
  },
);

const emit = defineEmits(['change', 'delete', 'preview']);

const { accept, maxSize, helpText, showHelpText, showPreviewButton } =
  toRefs(props);

const { getStringAccept, getHelpText } = useUploadType({
  acceptRef: accept,
  helpTextRef: helpText,
  maxNumberRef: ref(1), // 仅支持单个视频
  maxSizeRef: maxSize,
});

const fileList = ref<UploadFile[]>([]);
const previewVisible = ref(false);
const previewVideoUrl = ref('');

const getValue = ref<string[]>([]);

const isUploading = ref(false);
const isFirstRender = ref<boolean>(true);
const showOverlay = ref(false);
const uploadPercent = ref(0);

watch(
  () => props.value,
  async (v) => {
    if (isUploading.value) {
      isUploading.value = false;
      return;
    }
    let value: string | string[] = [];
    if (v) {
      const _fileList: string[] = [];
      if (isString(v)) {
        _fileList.push(v);
      }
      if (isArray(v)) {
        _fileList.push(...v);
      }
      // 直接赋值 可能为string | string[]
      value = v;
      const withUrlList: UploadProps['fileList'] = [];
      for (const item of _fileList) {
        // ossId情况
        if (props.resultField === 'ossId') {
          const resp = await ossInfo([item]);
          if (item && isString(item)) {
            withUrlList.push({
              uid: item, // ossId作为uid 方便getValue获取
              name: item.slice(Math.max(0, item.lastIndexOf('/') + 1)),
              status: 'done',
              url: resp?.[0]?.url,
            });
          } else if (item && isObject(item)) {
            withUrlList.push({
              ...(item as any),
              uid: item,
              url: resp?.[0]?.url,
            });
          }
        } else {
          // 非ossId情况
          if (item && isString(item)) {
            withUrlList.push({
              uid: uniqueId(),
              name: item.slice(Math.max(0, item.lastIndexOf('/') + 1)),
              status: 'done',
              url: item,
            });
          } else if (item && isObject(item)) {
            withUrlList.push(item);
          }
        }
      }
      fileList.value = withUrlList;
    }
    if (!isFirstRender.value) {
      emit('change', value);
      isFirstRender.value = false;
    }
  },
  { immediate: true, deep: true },
);

// 上传前检查
const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
  const { accept, maxSize } = props;

  // 检查文件类型
  const isValidType = await checkFileType(file, accept || []);
  if (!isValidType) {
    message.error($t('component.upload.accept', [accept?.join(',')]));
    return false;
  }

  // 检查文件大小
  const isLt = file.size! / 1024 / 1024 < (maxSize || 100);
  if (!isLt) {
    message.error($t('component.upload.maxSize', [maxSize]));
    return false;
  }

  isUploading.value = true; // 开始上传
  uploadPercent.value = 0; // 重置进度
  return true;
};
// 自定义上传
const customRequest = async (info: UploadRequestOption) => {
  const { api } = props;
  if (!api || !isFunction(api)) {
    console.warn('upload api must exist and be a function');
    return;
  }
  try {
    // 进度条事件
    const progressEvent: AxiosProgressEvent = (e) => {
      const percent = Math.trunc((e.loaded / e.total!) * 100);
      uploadPercent.value = percent; // 更新进度值
      info.onProgress!({ percent });
    };
    const res = await api(info.file as File, progressEvent);
    console.log('Upload API response:', res);
    // ===== 关键修复在这三行 =====
    info.onSuccess!(res);

    isUploading.value = false;
    const value = getValueFunc();
    emit('change', value);
  } catch (error) {
    info.onError!(error as Error);
    isUploading.value = false;
  }
};

function getValueFunc() {
  console.log(fileList.value);
  const list = (fileList.value || [])
    .filter((item) => item?.status === UploadResultStatus.DONE)
    .map((item: any) => {
      if (item?.response && props?.resultField) {
        return item?.response?.[props.resultField];
      }
      // ossId兼容 uid为ossId直接返回
      if (props.resultField === 'ossId' && item.uid) {
        return item.uid;
      }
      // 适用于已经有图片 回显的情况 会默认在init处理为{url: 'xx'}
      if (item?.url) {
        return item.url;
      }
      // 注意这里取的key为 url
      return item?.response?.url;
    });
  // 只有一张图片 默认绑定string而非string[]
  if (list.length === 1) {
    return list[0];
  }
  // 只有一张图片 && 删除图片时 可自行修改
  if (list.length === 0) {
    return '';
  }
  return list;
}

// 删除文件
const handleRemove = (file: UploadFile) => {
  const index = fileList.value.findIndex((item) => item.uid === file.uid);
  if (index !== -1) {
    fileList.value.splice(index, 1);
    emit('delete', file);
    const value = getValueFunc();
    emit('change', value);
  }
};

// 预览视频
const handlePreview = (file: UploadFile) => {
  if (!file) {
    file = fileList.value[0];
  }
  if (file.url) {
    previewVideoUrl.value = file.url || '';
    previewVisible.value = true;
    emit('preview', file);
  }
};
const handleChange = (info: any) => {
  // 这行代码是灵魂！！！
  fileList.value = [...info.fileList];
};

// 关闭预览
const handlePreviewClose = () => {
  previewVisible.value = false;
  previewVideoUrl.value = '';
};
</script>

<template>
  <div class="video-upload-container">
    <div class="upload-wrapper">
      <!-- 模拟进度按钮 - 临时 -->

      <!-- 上传区域 - 使用CSS控制显示隐藏 -->
      <div class="upload-section" :class="{ hidden: fileList.length > 0 }">
        <Upload
          v-bind="$attrs"
          v-model:file-list="fileList"
          :accept="getStringAccept"
          :before-upload="beforeUpload"
          :custom-request="customRequest"
          :disabled="disabled"
          :multiple="false"
          :progress="{ strokeWidth: 2, showInfo: false }"
          :show-upload-list="false"
          @change="handleChange"
        >
          <div class="upload-trigger">
            <div
              class="upload-progress-bar"
              :style="{ width: `${uploadPercent}%` }"
            ></div>
            <div class="upload-icon">
              <VideoCameraOutlined />
            </div>
            <div class="upload-text">
              {{ isUploading ? `正在上传... ${uploadPercent}%` : '上传视频' }}
            </div>
            <div v-if="showHelpText && !isUploading" class="upload-help">
              {{ getHelpText }}
            </div>
          </div>
        </Upload>
      </div>

      <!-- 视频预览区域 - 使用CSS控制显示隐藏 -->
      <div
        class="video-preview-section"
        :class="{ hidden: fileList.length === 0 }"
      >
        <div
          class="video-preview-item"
          :style="{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
          }"
          @mouseenter="showOverlay = true"
          @mouseleave="showOverlay = false"
        >
          <video
            :src="fileList[0]?.url"
            class="preview-video"
            controls
            preload="metadata"
          ></video>
          <div
            class="video-overlay"
            :class="{ 'overlay-visible': showOverlay }"
          >
            <div class="overlay-content">
              <a-button
                v-if="showPreviewButton"
                type="text"
                size="middle"
                class="overlay-btn preview-btn"
                @click="handlePreview(fileList[0]?.response)"
              >
                <template #icon>
                  <EyeOutlined />
                </template>
              </a-button>
              <a-button
                type="text"
                size="middle"
                danger
                class="overlay-btn delete-btn"
                @click="handleRemove(fileList[0])"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频预览模态框 -->
    <Modal
      v-model:open="previewVisible"
      title="视频预览"
      :footer="null"
      :width="800"
      @cancel="handlePreviewClose"
    >
      <div class="preview-modal-content">
        <video
          :src="previewVideoUrl"
          class="preview-modal-video"
          controls
          autoplay
          preload="metadata"
        ></video>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.video-upload-container {
  width: 100%;
}

.upload-wrapper {
  display: inline-block;
  vertical-align: top;
  position: relative; /* 为绝对定位做准备 */
}

.upload-section {
  display: inline-block;
  transition:
    opacity 0.3s,
    visibility 0.3s;
}

.upload-section.hidden {
  opacity: 0;
  visibility: hidden;
  position: absolute; /* 隐藏时脱离文档流 */
  z-index: -1;
}

.upload-trigger {
  position: relative;
  overflow: hidden;
}

.upload-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: #1890ff;
  transition: width 0.3s ease;
  z-index: 1;
}

.video-preview-section {
  display: inline-block;
  vertical-align: top;

  .video-preview-item {
    position: relative;
    overflow: hidden; /* 隐藏溢出的子元素 */
    border-radius: 8px; /* 圆角，提升美观度 */
    background-color: #000;

    .preview-video {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-end; /* 改为底部对齐 */
      background-color: rgb(0 0 0 / 40%);
      backdrop-filter: blur(8px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 10;

      &.overlay-visible {
        opacity: 1;
        visibility: visible;
      }

      .overlay-content {
        display: flex;
        justify-content: space-between; /* 改为左右分布 */
        align-items: center;
        width: 100%;
        padding: 0 12px 8px; /* 增加水平和底部内边距 */

        .overlay-btn {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 32px; /* 缩小按钮尺寸 */
          height: 32px; /* 缩小按钮尺寸 */
          border-radius: 50%;
          background-color: rgb(255 255 255 / 20%);
          border: 1px solid rgb(255 255 255 / 30%);
          color: #fff;
          font-size: 16px; /* 缩小图标尺寸 */
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.1);
            background-color: rgb(255 255 255 / 30%);
            box-shadow: 0 0 12px rgb(255 255 255 / 50%);
          }
        }
      }
    }
  }
}

.video-preview-section.hidden {
  opacity: 0;
  visibility: hidden;
  position: absolute; /* 隐藏时脱离文档流 */
  z-index: -1;
}

.upload-trigger {
  width: 120px; /* 与预览区域保持一致 */
  height: 160px; /* 与预览区域保持一致，3:4比例 */
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-sizing: border-box;
}

.upload-trigger:hover {
  border-color: #1890ff;
}

.upload-icon {
  font-size: 36px; /* 增大图标，与预览区域协调 */
  color: #999;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.upload-trigger:hover .upload-icon {
  color: #1890ff; /* 悬浮时改变图标颜色 */
  transform: scale(1.1); /* 悬浮时放大图标 */
}

.upload-text {
  font-size: 16px; /* 增大字体 */
  color: #666;
  margin-bottom: 6px;
  text-align: center;
  font-weight: 500; /* 增加字重 */
}

.upload-help {
  font-size: 13px; /* 稍增大帮助文字 */
  color: #999;
  text-align: center;
  padding: 0 12px;
  line-height: 1.5;
}

.video-preview-section {
  display: inline-block;
  vertical-align: top;
}

.video-preview-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  box-sizing: border-box;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 8px; /* 减少内边距 */
  display: flex;
  justify-content: center;
  gap: 6px; /* 减少按钮间距 */
}

.action-btn {
  height: 24px !important; /* 固定按钮高度 */
  padding: 0 8px !important; /* 调整内边距 */
  font-size: 12px !important; /* 减小字体 */
  line-height: 1 !important;
  min-width: auto !important; /* 移除最小宽度 */
}

.action-btn .ant-btn-icon {
  font-size: 12px !important; /* 减小图标大小 */
  margin-right: 4px !important; /* 调整图标与文字间距 */
}

.btn-text {
  font-size: 12px !important; /* 确保文字大小一致 */
}

.video-actions .ant-btn {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px); /* 添加毛玻璃效果 */
}

.video-actions .ant-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px); /* 添加悬浮效果 */
}

.preview-modal-content {
  text-align: center;
  padding: 20px;
}

.preview-modal-video {
  width: auto;
  min-height: 500px;
  max-height: 500px;
  margin: 0 auto;
  border-radius: 8px;
}

/* 默认3:4比例 */
.video-preview-item {
  aspect-ratio: 3 / 4;
}
</style>
