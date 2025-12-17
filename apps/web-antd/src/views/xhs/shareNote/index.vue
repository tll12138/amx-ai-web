<script lang="ts" name="ShareNote" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { getVxePopupContainer } from '@vben/utils';

import {
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { Modal, Popconfirm, Space } from 'ant-design-vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '#/adapter/vxe-table';
import { baseName, baseUrl, ShareNoteApi } from '#/api/xhs/shareNote';
import { ExcelUpload } from '#/components/ExcelUpload';
import { commonDownloadExcel } from '#/utils/file/download';

import { columns, querySchema } from './data';
import ExtraModal from './edit-form.vue';

// 搜索框
const formOptions: VbenFormProps = {
  commonConfig: {
    labelWidth: 70,
    componentProps: {
      allowClear: true,
    },
  },
  schema: querySchema(),
  wrapperClass:
    'grid-col-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  handleReset: async () => {
    // eslint-disable-next-line no-use-before-define
    const { formApi, reload } = tableApi;
    await formApi.resetForm();
    const formValues = formApi.form.values;
    formApi.setLatestSubmissionValues(formValues);
    await reload(formValues);
  },
};

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    trigger: 'cell',
  },
  columns,
  height: 'auto',
  keepSource: true,
  sortConfig: {
    remote: true,
  },
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page, sort, sorts }, formValues) => {
        return await ShareNoteApi.getList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          orderByColumn: sort?.field,
          isAsc: sort?.order,
          ...formValues,
        });
      },
    },
    sort: true,
  },
  rowConfig: {
    keyField: 'id',
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
  },
  showOverflow: false,
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

const [BasicModal, modalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: ExtraModal,
});

function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

async function handleBatchUpdate() {
  await ShareNoteApi.batchUpdate();
  await tableApi.query();
}

async function handleUpdateByNoteId(id: string) {
  const data = await ShareNoteApi.updateByNoteId(id);
  await tableApi.query();
}

function goto(row: any) {
  window.open(row.shareUrl, '_blank');
}

async function handleDelete(row: any) {
  await ShareNoteApi.delete(row.id);
  await tableApi.query();
}

async function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row) => row.id);
  Modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await ShareNoteApi.delete(ids);
      await tableApi.query();
    },
  });
}

const handleExport = () => {
  commonDownloadExcel(
    ShareNoteApi.export,
    '小红书笔记链接分享',
    tableApi.formApi.form.values,
  );
};

const excelUploadRef = ref();
const templateUrl = ref(`${baseUrl}/importTemplate`);
const title = ref(baseName);
const url = ref(`${baseUrl}/importData`);
// 导入相关
const showUploadDialog = () => {
  excelUploadRef.value.show();
};

async function handleUploadSuccess() {
  await tableApi.query();
}
</script>
<template>
  <Page :auto-content-height="true">
    <BasicTable :table-title="`${title}列表`">
      <template #toolbar-tools>
        <Space>
          <Popconfirm
            cancel-text="取消"
            ok-text="确定"
            title="确定要批量更新互动数据嘛？"
            @confirm="handleBatchUpdate"
          >
            <a-button
              v-access:code="['xhs:shareNote:edit']"
              danger
              type="primary"
            >
              批量更新
            </a-button>
          </Popconfirm>
          <a-button
            v-access:code="['xhs:shareNote:add']"
            type="primary"
            @click="handleAdd"
          >
            新增
          </a-button>
          <a-button
            v-access:code="['xhs:shareNote:remove']"
            :disabled="!vxeCheckboxChecked(tableApi)"
            danger
            type="primary"
            @click="handleMultiDelete"
          >
            删除
          </a-button>
          <a-button
            v-access:code="['xhs:shareNote:add']"
            @click="showUploadDialog"
          >
            <template #icon>
              <ImportOutlined />
            </template>
            导入
          </a-button>
          <Popconfirm
            cancel-text="取消"
            ok-text="确定"
            title="确定要导出嘛？"
            @confirm="handleExport"
          >
            <a-button
              v-access:code="['xhs:shareNote:export']"
              color="red"
              type="primary"
            >
              <template #icon>
                <ExportOutlined />
              </template>
              导出
            </a-button>
          </Popconfirm>
        </Space>
      </template>
      <template #username="{ row }">
        <div class="user-avatar-wrapper">
          <div class="avatar-container">
            <img :src="row.avatar" class="avatar-image" />
          </div>
          {{ row.username || '作者昵称' }}
        </div>
      </template>
      <template #noteId="{ row }">
        <div class="note-cell">
          <div class="cover-wrapper">
            <a-image
              :src="row.cover"
              class="cover-image"
              height="80px"
              width="60px"
            />
          </div>
          <div class="info-wrapper">
            <div class="title-wrapper">
              <h3
                :title="row.title"
                class="title"
                style="cursor: pointer"
                @click="goto(row.shareUrl)"
              >
                {{ row.title }}
              </h3>
            </div>
            <div class="meta">
              <div style="display: flex; align-items: center">
                <span class="time"> 发布时间：{{ row.postTime }} </span>
              </div>
              <div style="display: flex; align-items: center">
                <span class="id" @click="goto(row.shareUrl)">
                  ID: {{ row.noteId }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #interactions="{ row }">
        <span> {{ row.interaction - row.preInteraction }} </span>
      </template>
      <template #action="{ row }">
        <Space>
          <Popconfirm
            :get-popup-container="getVxePopupContainer"
            placement="left"
            title="确认删除？"
            @confirm="handleDelete(row)"
          >
            <a-button
              v-access:code="['xhs:shareNote:remove']"
              danger
              type="link"
              @click.stop=""
            >
              <template #icon>
                <DeleteOutlined />
              </template>
              删除
            </a-button>
          </Popconfirm>
          <Popconfirm
            :get-popup-container="getVxePopupContainer"
            placement="left"
            title="确认更新此笔记的互动数据吗？"
            @confirm="handleUpdateByNoteId(row.noteId)"
          >
            <a-button
              v-access:code="['xhs:shareNote:edit']"
              primary
              type="link"
            >
              <template #icon>
                <ReloadOutlined />
              </template>
              更新互动
            </a-button>
          </Popconfirm>
        </Space>
      </template>
    </BasicTable>
    <BasicModal @reload="tableApi.query()" />
    <ExcelUpload
      ref="excelUploadRef"
      :template-url="templateUrl"
      :title="title"
      :url="url"
      @success="handleUploadSuccess"
    />
  </Page>
</template>

<style lang="less" scoped>
.user-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem;
}

.avatar-container {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  transition: border-color 0.2s ease;
}

.avatar-container:hover {
  border-color: #60a5fa;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nickname-link {
  color: #3b82f6;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.nickname-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.note-cell {
  display: flex;
  gap: 12px;
  background: #ffffff;
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.note-cell:hover {
  background-color: #f8f9fa;
}

.cover-wrapper {
  flex-shrink: 0;
}

.cover-image {
  width: 100px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
  display: block;
}

.info-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: left;
}

.title-wrapper {
  margin-bottom: 8px;
}

.title {
  margin: 0;
  text-align: left;
  font-size: 14px;
  color: #2c3e50;
  font-weight: 550;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  color: #666;
  font-size: 14px;
}

.id {
  line-height: 24px;
  color: #42b883;
  font-weight: 500;
  font-size: 12px;
  cursor: pointer;
}

.divider {
  color: #ddd;
}

.time {
  line-height: 24px;
  color: #666;
}
</style>
