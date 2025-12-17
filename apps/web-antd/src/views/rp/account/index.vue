<script setup name="Account" lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { DropDownOptionsGroup } from '#/views/rp/account/types';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { getVxePopupContainer } from '@vben/utils';

import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons-vue';
import {
  Modal,
  Popconfirm,
  Select,
  SelectOptGroup,
  SelectOption,
  Space,
} from 'ant-design-vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '#/adapter/vxe-table';
import { AccountApi, baseName, baseUrl } from '#/api/rp/account';
import { AccountGroupApi } from '#/api/rp/accountGroup';
import { ExcelUpload } from '#/components/ExcelUpload/index';
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
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await AccountApi.getList({
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

const [BasicModal, modalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: ExtraModal,
});

const accountGroupOptions = ref<DropDownOptionsGroup[]>([]);
async function handleGetGroups() {
  accountGroupOptions.value = await AccountGroupApi.options();
  // 遍历accountGroupOptions获取所有的options，然后整个为一个list，根据value为键，label为值组合为一个map进行返回
}

const accountGroupOptionsMap = computed(() => {
  const valueLabelMap = new Map<any, string>();
  accountGroupOptions.value
    .flatMap((g) => g.options)
    .forEach((opt) => valueLabelMap.set(opt.value, opt.label));
  return valueLabelMap;
});

function handleAdd() {
  modalApi.setData({ accountGroups: accountGroupOptions.value });
  modalApi.open();
}
async function handleEdit(row: any) {
  modalApi.setData({ accountGroups: accountGroupOptions.value, id: row.id });
  modalApi.open();
}

async function handleDelete(row: any) {
  await AccountApi.delete(row.id);
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
      await AccountApi.delete(ids);
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
    AccountApi.export,
    '账号信息',
    tableApi.formApi.form.values,
  );
};

// 初始化
onMounted(() => {
  handleGetGroups();
});
</script>
<template>
  <Page :auto-content-height="true">
    <BasicTable class="flex-1 overflow-hidden" :table-title="`${title}列表`">
      <template #groupId="{ row }">
        <a-tag>{{ accountGroupOptionsMap.get(row.groupId) }}</a-tag>
      </template>
      <template #form-groupId="slotProps">
        <Select
          show-search
          allow-clear
          class="w-[80%]"
          v-bind="slotProps"
          placeholder="请选择分组"
          option-filter-prop="label"
        >
          <SelectOptGroup
            v-for="group in accountGroupOptions"
            :key="group.label"
            :label="group.label"
          >
            <SelectOption
              v-for="item in group.options"
              :key="`${item.label}_${item.value}`"
              :value="item.value"
              :label="item.label"
              :extra="item.extraData"
            >
              {{ item.label }}
            </SelectOption>
          </SelectOptGroup>
        </Select>
      </template>
      <template #toolbar-tools>
        <Space>
          <a-button
            type="primary"
            v-access:code="['rp:account:add']"
            @click="handleAdd"
          >
            新增
          </a-button>
          <a-button
            :disabled="!vxeCheckboxChecked(tableApi)"
            danger
            type="primary"
            v-access:code="['rp:account:remove']"
            @click="handleMultiDelete"
          >
            删除
          </a-button>
          <a-button
            v-access:code="['rp:account:add']"
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
              v-access:code="['rp:account:export']"
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
            v-access:code="['rp:account:edit']"
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
              v-access:code="['rp:account:remove']"
              @click.stop=""
            >
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
          </Popconfirm>
        </Space>
      </template>
    </BasicTable>
    <BasicModal @reload="tableApi.query()" />
    <ExcelUpload
      @success="handleUploadSuccess"
      :template-url="templateUrl"
      :title="title"
      :url="url"
      ref="excelUploadRef"
    />
  </Page>
</template>
