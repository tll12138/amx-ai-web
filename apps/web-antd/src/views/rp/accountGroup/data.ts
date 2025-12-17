import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import { getDictOptions } from '#/utils/dict';

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
];
