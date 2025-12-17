<script setup lang="ts">
import type { UploadChangeParam } from 'ant-design-vue';

import { h, ref } from 'vue';

import { useAppConfig } from '@vben/hooks';
import { ExcelIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { InboxOutlined } from '@ant-design/icons-vue';
import { message, Modal, UploadDragger } from 'ant-design-vue';

import { requestClient as request } from '#/api/request';
import { commonDownloadExcel } from '#/utils/file/download';

defineOptions({ name: 'ExcelUpload' });

const props = defineProps({
  title: {
    type: String,
    default: '导入数据',
  },
  url: {
    type: String,
    default: '',
  },
  templateUrl: {
    type: String,
    default: '',
  },
});
const emit = defineEmits<{ success: [] }>();
const accessStore = useAccessStore();
const token = accessStore.accessToken;
const open = ref(false);
const isUploading = ref(false);
const fileList = ref([]);
const updateSupport = ref(0);
const { apiURL, clientId } = useAppConfig(
  import.meta.env,
  import.meta.env.PROD,
);
const headers = ref({ Authorization: `Bearer ${token}`, Clientid: clientId });
const handleChange = (info: UploadChangeParam) => {
  const status = info.file.status;
  if (status !== 'uploading') {
    isUploading.value = true;
  }
  if (status === 'done') {
    console.log(info.file.response);
    open.value = false;
    isUploading.value = false;
    fileList.value = [];
    if (info.file.response.code === 200) {
      // 弹出导入结果
      Modal.success({
        title: '导入成功结果',
        content: () =>
          h('div', {
            style:
              'overflow: auto; overflow-x: hidden; max-height: 70vh; padding: 10px 20px 0;',
            innerHTML: info.file.response.msg,
          }),
        style: 'margin-top: 90px',
      });
    } else {
      fileList.value = [];
      isUploading.value = false;
      Modal.error({
        title: '导入失败结果',
        content: () =>
          h('div', {
            style:
              'overflow: auto; overflow-x: hidden; max-height: 70vh; padding: 10px 20px 0;',
            innerHTML: info.file.response.msg,
          }),
        style: 'margin-top: 90px',
      });
      return;
    }
    emit('success');
  } else if (status === 'error') {
    message.error(`${info.file.name} 上传失败`);
  }
};

async function downloadImportTemplate() {
  return request.post<Blob>(
    props.templateUrl,
    {},
    {
      isTransformResponse: false,
      responseType: 'blob',
    },
  );
}

const submitForm = () => {
  const upload = ref();
  upload.value.submit();
};

const show = () => {
  open.value = true;
};

const hide = () => {
  open.value = false;
};
defineExpose({ show, hide });
</script>

<template>
  <Modal
    :title="title"
    v-model:open="open"
    width="400px"
    @ok="submitForm"
    style="margin-top: 70px"
    :footer="null"
  >
    <UploadDragger
      v-model:file-list="fileList"
      accept=".xlsx,.xls"
      :max-count="1"
      :show-upload-list="true"
      :headers="headers"
      :action="`${apiURL}/${url}?updateSupport=${updateSupport}`"
      :disabled="isUploading"
      @change="handleChange"
      :with-credentials="true"
      draggable
      style="margin-top: 20px"
    >
      <p class="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p class="ant-upload-text">将文件拖到此处，或点击上传</p>
    </UploadDragger>
    <div class="ant-upload-hint">
      <span>仅允许导入xls、xlsx格式文件。</span>
      <a-button
        type="link"
        @click="
          commonDownloadExcel(downloadImportTemplate, `${title}数据导入模板`)
        "
      >
        <div class="flex items-center gap-[4px]">
          <ExcelIcon />
          <span>下载模板</span>
        </div>
      </a-button>
    </div>
  </Modal>
</template>

<style scoped>
.ant-upload-hint {
  margin-top: 10px;
  text-align: center;
}
</style>
