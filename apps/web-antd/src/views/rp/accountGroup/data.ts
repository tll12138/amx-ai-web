import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import { getDictOptions } from '#/utils/dict';
// 新增：创建 Ref 存储下拉选项（供组件内动态更新）
import { ref } from 'vue';

// 全局 Ref：存储 RPA 账号下拉选项（label=rpaname，value=rpano）
export const rpanoOptions = ref<Array<{ label: string; value: string }>>([]);

export const querySchema: FormSchemaGetter = () => [
  {
    label: '分组名称',
    fieldName: 'groupName',
    component: 'Input',
    componentProps: {
      placeholder: '请输入分组名称',
    },

  },
  {
    label: '所属平台',
    fieldName: 'platform',
    component: 'Select',
    componentProps: {
      placeholder: '请输入分组所属平台',
      options: getDictOptions(DictEnum.RP_PLATFORMS),
    },

  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '分组名称',
    field: 'groupName',
  },
  {
    title: '所属平台',
    field: 'platform',
  },
  {
    title: '创建时间',
    field: 'createTime',
  },
  {
    title: '关联rpa账号',
    field: 'rpaName',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 180,
  },
];

export const ModalSchema: FormSchemaGetter = () => [
  {
    label: '分组ID',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '分组名称',
    fieldName: 'groupName',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入分组名称',
    },
  },
  {
    label: '分组所属平台',
    fieldName: 'platform',
    rules: 'required',
    component: 'Select',
    componentProps: {
      placeholder: '请输入分组所属平台',
      options: getDictOptions(DictEnum.RP_PLATFORMS),
    },
  },
  // 新增：rpano 下拉框（绑定 Ref 动态选项）
  {
    label: '关联RPA账号',
    fieldName: 'rpaNo',
    rules: 'required', // 按需调整是否必填
    component: 'Select',
    componentProps: () => ({
      // 函数式返回 props，实时读取 Ref 最新值
      placeholder: '请选择关联的RPA账号',
      options: rpanoOptions.value,
    }),
  },
];
