<script setup name="ArticleTask" lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { getVxePopupContainer } from '@vben/utils';

import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons-vue';
import { Drawer, Popconfirm, Space } from 'ant-design-vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '#/adapter/vxe-table';
import { ArticleTaskApi, baseName, baseUrl } from '#/api/rp/articleTask';
import { ExcelUpload } from '#/components/ExcelUpload/index';
import { commonDownloadExcel } from '#/utils/file/download';

import { columns, querySchema } from './data';
import ExtraDrawer from './edit-form.vue';

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
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await ArticleTaskApi.getList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          orderByColumn: 'create_time',
          isAsc: 'desc',
          ...formValues,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
  },
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

const [BasicDrawer, drawerApi] = useVbenDrawer({
  // 连接抽离的组件
  connectedComponent: ExtraDrawer,
});

function handleAdd() {
  drawerApi.setData({ isAdd: true, id: undefined });
  drawerApi.open();
}
async function handleEdit(row: any) {
  drawerApi.setData({ isAdd: false, id: row.id });
  drawerApi.open();
}

async function handleDelete(row: any) {
  await ArticleTaskApi.delete(row.id);
  await tableApi.query();
}
async function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row) => row.id);
  Drawer.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await ArticleTaskApi.delete(ids);
      await tableApi.query();
    },
  });
}

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

const handleExport = () => {
  commonDownloadExcel(
    ArticleTaskApi.export,
    '文章任务',
    tableApi.formApi.form.values,
  );
};
</script>
<template>
  <Page :auto-content-height="true">
    <BasicTable class="flex-1 overflow-hidden" :table-title="`${title}列表`">
      <template #toolbar-tools>
        <Space>
          <a-button
            type="primary"
            v-access:code="['rp:articleTask:add']"
            @click="handleAdd"
          >
            新增
          </a-button>
          <a-button
            :disabled="!vxeCheckboxChecked(tableApi)"
            danger
            type="primary"
            v-access:code="['rp:articleTask:remove']"
            @click="handleMultiDelete"
          >
            删除
          </a-button>
          <a-button
            v-access:code="['rp:articleTask:add']"
            @click="showUploadDialog"
          >
            <template #icon><ImportOutlined /></template>
            导入
          </a-button>
          <Popconfirm
            title="确定要导出嘛？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleExport"
          >
            <a-button
              v-access:code="['rp:articleTask:export']"
              type="primary"
              color="red"
            >
              <template #icon><ExportOutlined /></template>
              导出
            </a-button>
          </Popconfirm>
        </Space>
      </template>
      <template #action="{ row }">
        <Space>
          <a-button
            size="small"
            type="link"
            v-access:code="['rp:articleTask:edit']"
            @click="handleEdit(row)"
          >
            <template #icon><EditOutlined /></template>
            编辑
          </a-button>
          <Popconfirm
            :get-popup-container="getVxePopupContainer"
            placement="left"
            title="确认删除？"
            @confirm="handleDelete(row)"
          >
            <a-button
              type="link"
              danger
              v-access:code="['rp:articleTask:remove']"
              @click.stop=""
            >
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
          </Popconfirm>
        </Space>
      </template>
    </BasicTable>
    <BasicDrawer @reload="tableApi.query()" @close="() => drawerApi.setData({ isAdd: true, id: undefined })" />
    <ExcelUpload
      @success="handleUploadSuccess"
      :template-url="templateUrl"
      :title="title"
      :url="url"
      ref="excelUploadRef"
    />
  </Page>
</template>
