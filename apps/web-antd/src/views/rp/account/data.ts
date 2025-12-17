import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import { getDictOptions } from '#/utils/dict';
import { renderDict, renderDictTag } from '#/utils/render';

export const querySchema: FormSchemaGetter = () => [
  {
    label: '账号平台',
    fieldName: 'platform',
    component: 'Select',
    componentProps: {
      placeholder: '请输入账号平台',
      options: getDictOptions(DictEnum.RP_PLATFORMS),
    },
  },
  {
    label: '账号分组',
    fieldName: 'groupId',
    component: 'Select',
    componentProps: {
      placeholder: '请选中账号分组',
    },
  },
  {
    label: '账号名称',
    fieldName: 'accountName',
    component: 'Input',
    componentProps: {
      placeholder: '请输入账号名称',
    },
  },
  {
    label: '设备编号',
    fieldName: 'deviceCode',
    component: 'Input',
    componentProps: {
      placeholder: '请输入设备编号',
    },
  },
  {
    label: '账号状态',
    fieldName: 'status',
    component: 'Select',
    componentProps: {
      placeholder: '请选择账号状态',
      options: [
        {
          label: '正常',
          value: 0,
        },
        {
          label: '停用',
          value: 1,
        },
      ],
    },
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '账号平台',
    field: 'platform',
    slots: {
      default: ({ row }) => {
        return renderDictTag(
          row.platform,
          getDictOptions(DictEnum.RP_PLATFORMS),
        );
      },
    },
  },
  {
    title: '账号名称',
    field: 'accountName',
  },
  {
    title: '账号分组',
    field: 'groupId',
    slots: { default: 'groupId' },
  },
  {
    title: '设备编号',
    field: 'deviceCode',
  },
  {
    title: '账号状态',
    field: 'status',
    slots: {
      default: ({ row }) => {
        return renderDict(row.status, DictEnum.SYS_NORMAL_DISABLE);
      },
    },
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
    label: '账号ID',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '账号名称',
    fieldName: 'accountName',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入账号名称',
    },
  },
  {
    label: '设备编号',
    fieldName: 'deviceCode',
    component: 'Input',
    componentProps: {
      placeholder: '请输入设备编号',
    },
    dependencies: {
      required: (row) => {
        const dictOptions = getDictOptions(DictEnum.RP_PLATFORMS);
        const info = dictOptions.find((item) => item.label === row.platform);
        return info !== undefined && info?.remark.includes('设备');
      },
      triggerFields: ['platform'],
    },
  },
  {
    label: '账号分组',
    fieldName: 'groupId',
    rules: 'required',
    component: 'Select',
    componentProps: {
      placeholder: '请选择账号分组',
    },
  },
  {
    label: '手机号',
    fieldName: 'phone',
    rules: 'required',
    component: 'Input',
    dependencies: {
      show: (row) => {
        const dictOptions = getDictOptions(DictEnum.RP_PLATFORMS);
        const info = dictOptions.find((item) => item.label === row.platform);
        return info !== undefined && info?.remark.includes('账号');
      },
      triggerFields: ['platform'],
    },
  },
  {
    label: '账号平台',
    fieldName: 'platform',
    component: 'Select',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '账号',
    fieldName: 'account',
    rules: 'required',
    component: 'Input',
    dependencies: {
      show: (row) => {
        const dictOptions = getDictOptions(DictEnum.RP_PLATFORMS);
        const info = dictOptions.find((item) => item.label === row.platform);
        return info !== undefined && info?.remark.includes('账号');
      },
      triggerFields: ['platform'],
    },
  },
  {
    label: '密码',
    fieldName: 'password',
    rules: 'required',
    component: 'Input',
    dependencies: {
      show: (row) => {
        const dictOptions = getDictOptions(DictEnum.RP_PLATFORMS);
        const info = dictOptions.find((item) => item.label === row.platform);
        return info !== undefined && info?.remark.includes('账号');
      },
      triggerFields: ['platform'],
    },
  },
  {
    label: '账号状态',
    fieldName: 'status',
    component: 'RadioGroup',
    componentProps: {
      options: [
        {
          label: '正常',
          value: 0,
        },
        {
          label: '停用',
          value: 1,
        },
      ],
    },
    dependencies: {
      show: (row) => {
        return row.id;
      },
      triggerFields: ['platform'],
    },
    defaultValue: 0,
  },
];
