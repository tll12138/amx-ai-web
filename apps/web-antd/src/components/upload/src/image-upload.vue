<script lang="ts" setup>
import type { UploadFile, UploadProps } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';

import type { AxiosResponse } from '@vben/request';

import type { AxiosProgressEvent } from '#/api';

import { ref, toRefs, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { $t } from '@vben/locales';

import { PlusOutlined } from '@ant-design/icons-vue';
import { Image, message, Upload } from 'ant-design-vue';
import { isArray, isFunction, isObject, isString, uniqueId } from 'lodash-es';

import { uploadApi } from '#/api';
import { ossInfo } from '#/api/system/oss';

import { checkImageFileType, defaultImageAccept } from './helper';
import { UploadResultStatus } from './typing';
import { useUploadType } from './use-upload';

defineOptions({ name: 'ImageUpload', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /**
     * 包括拓展名(不带点) 文件头(image/png等 不包括泛写法即image/*)
     */
    accept?: string[];
    api?: (
      file: Blob | File,
      onUploadProgress?: AxiosProgressEvent,
    ) => Promise<AxiosResponse<any>>;
    disabled?: boolean;
    helpText?: string;

    listType?: ListType;
    // 最大数量的文件，Infinity不限制
    maxNumber?: number;
    // 文件最大多少MB
    maxSize?: number;
    // 是否支持多选
    multiple?: boolean;
    // support xxx.xxx.xx
    // 返回的字段 默认url
    resultField?: 'fileName' | 'ossId' | 'url';
    /**
     * 是否显示下面的描述
     */
    showDescription?: boolean;
    /**
     * 是否启用拖拽排序功能（仅在多图片时有效）
     */
    sortable?: boolean;
    value?: string | string[];
  }>(),
  {
    value: () => [],
    disabled: false,
    listType: 'picture-card',
    helpText: '',
    maxSize: 2,
    maxNumber: 1,
    accept: () => defaultImageAccept,
    multiple: false,
    api: uploadApi,
    resultField: 'url',
    showDescription: true,
    sortable: true,
  },
);
const emit = defineEmits(['change', 'update:value', 'delete']);
type ListType = 'picture' | 'picture-card' | 'text';
const { accept, helpText, maxNumber, maxSize } = toRefs(props);
const isInnerOperate = ref<boolean>(false);
const { getStringAccept } = useUploadType({
  acceptRef: accept,
  helpTextRef: helpText,
  maxNumberRef: maxNumber,
  maxSizeRef: maxSize,
});
const previewOpen = ref<boolean>(false);
const previewImage = ref<string>('');
const previewTitle = ref<string>('');
const previewIndex = ref<number>(0);
const previewImages = ref<string[]>([]);

const fileList = ref<NonNullable<UploadProps['fileList']>>([]);
const isLtMsg = ref<boolean>(true);
const isActMsg = ref<boolean>(true);
const isFirstRender = ref<boolean>(true);

watch(
  () => props.value,
  async (v) => {
    if (isInnerOperate.value) {
      isInnerOperate.value = false;
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
  {
    immediate: true,
    deep: true,
  },
);

function getBase64<T extends ArrayBuffer | null | string>(file: File) {
  return new Promise<T>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener('load', () => {
      resolve(reader.result as T);
    });
    reader.addEventListener('error', (error) => reject(error));
  });
}

const handlePreview = async (file: UploadFile) => {
  // 构建所有图片的预览列表
  const allImages: string[] = [];
  let currentIndex = 0;
  for (let i = 0; i < (fileList.value || []).length; i++) {
    const item = fileList.value?.[i];
    if (item && item.status === 'done') {
      if (!item.url && !item.preview && item.originFileObj) {
        item.preview = await getBase64<string>(item.originFileObj);
      }
      const imageUrl = item.url || item.preview || '';
      if (imageUrl) {
        allImages.push(imageUrl);
        // 记录当前点击图片的索引
        if (item.uid === file.uid) {
          currentIndex = allImages.length - 1;
        }
      }
    }
  }

  previewImages.value = allImages;
  console.log('previewImages', allImages);
  previewIndex.value = currentIndex;
  previewImage.value = allImages[currentIndex] || '';
  previewOpen.value = true;
  previewTitle.value =
    file.name ||
    previewImage.value.slice(
      Math.max(0, previewImage.value.lastIndexOf('/') + 1),
    );
};

const handleRemove = async (file: UploadFile) => {
  if (fileList.value) {
    const index = fileList.value.findIndex((item) => item.uid === file.uid);
    index !== -1 && fileList.value.splice(index, 1);
    const value = getValue();
    isInnerOperate.value = true;
    emit('update:value', value);
    emit('change', value);
    emit('delete', file);
  }
};

const handleCancel = () => {
  previewOpen.value = false;
  previewTitle.value = '';
  previewImages.value = [];
  previewIndex.value = 0;
};

const beforeUpload = async (file: File) => {
  const { maxSize, accept } = props;
  const isAct = await checkImageFileType(file, accept);
  if (!isAct) {
    message.error($t('component.upload.acceptUpload', [accept]));
    isActMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isActMsg.value = true), 1000);
  }
  const isLt = file.size / 1024 / 1024 > maxSize;
  if (isLt) {
    message.error($t('component.upload.maxSizeMultiple', [maxSize]));
    isLtMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isLtMsg.value = true), 1000);
  }
  return (isAct && !isLt) || Upload.LIST_IGNORE;
};

async function customRequest(info: UploadRequestOption<any>) {
  const { api } = props;
  if (!api || !isFunction(api)) {
    console.warn('upload api must exist and be a function');
    return;
  }
  try {
    // 为文件生成预览图片
    const file = info.file as any;
    if (!file.preview && file.type?.startsWith('image/')) {
      file.preview = await getBase64<string>(file as File);
    }

    // 进度条事件
    const progressEvent: AxiosProgressEvent = (e) => {
      const percent = Math.trunc((e.loaded / e.total!) * 100);
      info.onProgress!({ percent });
    };
    const res = await api?.(info.file as File, progressEvent);
    console.log('upload res', res);
    /**
     * 由getValue处理 传对象过去
     * 直接传string(id)会被转为Number
     * 内部的逻辑由requestClient.upload处理 这里不用判断业务状态码 不符合会自动reject
     */
    info.onSuccess!(res);
    message.success($t('component.upload.uploadSuccess'));
    // 获取
    const value = getValue();
    isInnerOperate.value = true;
    emit('update:value', value);
    emit('change', value);
  } catch (error: any) {
    console.error(error);
    info.onError!(error);
  }
}

// 处理拖拽排序
const handleDragSort = () => {
  if (!props.sortable || props.maxNumber === 1) return;

  const value = getValue();
  isInnerOperate.value = true;
  emit('update:value', value);
  emit('change', value);
};

function getValue() {
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
  if (props.maxNumber === 1 && list.length === 1) {
    return list[0];
  }
  // 只有一张图片 && 删除图片时 可自行修改
  if (props.maxNumber === 1 && list.length === 0) {
    return '';
  }
  return list;
}
</script>

<template>
  <div>
    <!-- 当启用拖拽排序且为多图片模式时，使用自定义布局 -->
    <div class="sortable-upload-container">
      <!-- 拖拽排序的图片列表 -->
      <VueDraggable
        v-model="fileList"
        class="sortable-image-list"
        :disabled="disabled"
        :animation="200"
        ghost-class="sortable-ghost"
        chosen-class="sortable-chosen"
        drag-class="sortable-drag"
        @end="handleDragSort"
      >
        <div
          v-for="file in fileList"
          :key="file.uid"
          class="sortable-image-item"
          :class="{
            'upload-error': file.status === 'error',
            'upload-uploading': file.status === 'uploading',
          }"
        >
          <!-- 图片预览区域 -->
          <div class="image-preview" @click="handlePreview(file)">
            <img
              v-if="
                (file as any).url ||
                (file as any).preview ||
                (file as any).response?.url
              "
              :src="
                (file as any).url ||
                (file as any).preview ||
                (file as any).response?.url
              "
              :alt="(file as any).name"
              class="preview-image"
            />
            <div v-else class="preview-placeholder">
              <PlusOutlined />
            </div>
          </div>

          <!-- 上传进度 -->
          <div v-if="file.status === 'uploading'" class="upload-progress">
            <div
              class="progress-bar"
              :style="{ width: `${(file as any).percent || 0}%` }"
            ></div>
          </div>

          <!-- 操作按钮 -->
          <div class="image-actions">
            <button
              type="button"
              class="action-btn remove-btn"
              :disabled="disabled"
              @click.stop="handleRemove(file)"
            >
              ×
            </button>
          </div>

          <!-- 错误状态遮罩 -->
          <div v-if="file.status === 'error'" class="error-mask">
            <span class="error-text">上传失败</span>
          </div>
        </div>
        <Upload
          v-show="!fileList || (fileList && fileList.length < maxNumber)"
          v-bind="$attrs"
          v-model:file-list="fileList"
          :accept="getStringAccept"
          :before-upload="beforeUpload"
          :custom-request="customRequest"
          :disabled="disabled"
          :show-upload-list="false"
          :list-type="listType"
          :max-count="maxNumber"
          :multiple="multiple"
          :progress="{ showInfo: true }"
          @preview="handlePreview"
          @remove="handleRemove"
          class="upload-button"
        >
          <div>
            <PlusOutlined />
            <div>{{ $t('component.upload.upload') }}</div>
          </div>
        </Upload>
      </VueDraggable>
    </div>
    <div
      v-if="showDescription"
      class="mt-2 flex flex-wrap items-center text-[14px]"
    >
      请上传不超过
      <div class="text-primary mx-1 font-bold">{{ maxSize }}MB</div>
      的
      <div class="text-primary mx-1 font-bold">{{ accept.join('/') }}</div>
      格式文件
    </div>
    <!-- 图片预览模态框 - 使用Image.PreviewGroup实现多图预览 -->
    <div v-if="previewOpen" class="preview-container">
      <Image.PreviewGroup
        :preview="{
          visible: previewOpen,
          current: previewIndex,
          onVisibleChange: (visible) => {
            if (!visible) {
              handleCancel();
            }
          },
        }"
      >
        <Image
          v-for="(image, index) in previewImages"
          :key="index"
          :src="image"
          :style="{ display: 'none' }"
        />
      </Image.PreviewGroup>
    </div>
  </div>
</template>

<style lang="less">
/* 拖拽排序样式 */
.sortable-upload-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .sortable-image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .sortable-image-item {
      position: relative;
      width: 104px;
      height: 104px;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      background: #fafafa;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: move;

      &:hover {
        border-color: #1890ff;
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);

        .drag-handle {
          opacity: 1;
        }

        .image-actions {
          opacity: 1;
        }
      }

      &.upload-error {
        border-color: #ff4d4f;
        background: #fff2f0;
      }

      &.upload-uploading {
        .image-preview {
          opacity: 0.7;
        }
      }

      .drag-handle {
        position: absolute;
        top: 4px;
        left: 4px;
        z-index: 10;
        width: 20px;
        height: 20px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.3s ease;
        cursor: grab;

        &:active {
          cursor: grabbing;
        }

        &.drag-handle-disabled {
          display: none;
        }
      }

      .image-preview {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-placeholder {
          color: #999;
          font-size: 24px;
        }
      }

      .upload-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: rgba(0, 0, 0, 0.1);

        .progress-bar {
          height: 100%;
          background: #1890ff;
          transition: width 0.3s ease;
        }
      }

      .image-actions {
        position: absolute;
        top: 4px;
        right: 4px;
        opacity: 0;
        transition: opacity 0.3s ease;

        .action-btn {
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          transition: background 0.3s ease;

          &:hover {
            background: rgba(255, 77, 79, 0.8);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }

      .error-mask {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 77, 79, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;

        .error-text {
          color: #ff4d4f;
          font-size: 12px;
          background: white;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #ff4d4f;
        }
      }
    }
  }

  /* 拖拽状态样式 */
  .sortable-ghost {
    opacity: 0.5;
    background: #e6f7ff;
    border: 2px dashed #1890ff;
  }

  .sortable-chosen {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    z-index: 1000;
  }

  .sortable-drag {
    opacity: 0.8;
    transform: rotate(5deg);
  }

  /* Upload按钮样式 */
  .upload-button {
    width: 104px;
    height: 104px;
  }
}

/* 图片预览相关样式 */
.preview-container {
  .current-preview {
    text-align: center;
    margin-bottom: 16px;
  }

  .preview-navigation {
    .nav-buttons {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;

      .nav-info {
        font-size: 14px;
        color: #666;
        min-width: 80px;
        text-align: center;
      }
    }

    .thumbnail-nav {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
      max-height: 120px;
      overflow-y: auto;

      .thumbnail-item {
        width: 60px;
        height: 60px;
        border: 2px solid transparent;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: #1890ff;
          transform: scale(1.05);
        }

        &.active {
          border-color: #1890ff;
          box-shadow: 0 0 8px rgba(24, 144, 255, 0.3);
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
  }
}
</style>
