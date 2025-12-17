import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import dayjs from 'dayjs';

import { getDictOptions } from '#/utils/dict';
import { renderAILogo, renderDictTag } from '#/utils/render';

export const querySchema: FormSchemaGetter = () => [
  {
    label: '模型名称',
    fieldName: 'model',
    component: 'Input',
    componentProps: {
      placeholder: '请选择模型名称',
    },

  },
  {
    label: '供应商',
    fieldName: 'provider',
    component: 'Select',
    componentProps: {
      placeholder: '请选择供应商',
      options: getDictOptions(DictEnum.AI_PROVIDER),
    },

  },
  {
    label: '模型别名',
    fieldName: 'name',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模型别名',
    },

  },
  {
    label: '状态',
    fieldName: 'enable',
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      options: getDictOptions(DictEnum.SYS_ENABLE),
    },
    colProps: { span: 6 },
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '模型别名',
    field: 'name',
    align: 'left',
    width: 220,
  },
  {
    title: '供应商',
    field: 'provider',
    align: 'left',
    slots: {
      default: ({ row }) => {
        const { provider } = row;
        return renderAILogo(provider);
      },
    },
  },
  {
    title: '模型名称',
    field: 'model',
    align: 'left',
    width: 220,
  },
  {
    title: '最大回复长度',
    field: 'maxToken',
    width: 150,
  },
  {
    title: '随机性',
    field: 'temperature',
    width: 120,
  },
  {
    title: 'top_p',
    field: 'topP',
    width: 120,
  },
  {
    title: '模型顺序',
    field: 'orders',
    width: 120,
  },
  {
    title: '状态',
    field: 'enable',
    width: 120,
    slots: {
      default: ({ row }) => {
        const { enable } = row;
        return renderDictTag(
          enable as string,
          getDictOptions(DictEnum.SYS_ENABLE),
        );
      },
    },
  },
  {
    title: '创建时间',
    field: 'createTime',
    width: 120,
    slots: {
      default: ({ row }) => {
        const { createTime } = row;
        return dayjs(createTime).format('MM-DD HH:mm');
      },
    },
  },
  {
    title: '创建人',
    field: 'createByName',
    width: 120,
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 300,
  },
];

export const ModalSchema: FormSchemaGetter = () => [
  {
    label: '主键',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '模型别名',
    fieldName: 'name',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模型别名',
    },
  },
  {
    label: '供应商',
    fieldName: 'provider',
    rules: 'required',
    component: 'Select',
    componentProps: {
      placeholder: '请选择供应商',
      options: getDictOptions(DictEnum.AI_PROVIDER),
    },
  },
  {
    label: '模型名称',
    fieldName: 'model',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模型名称',
    },
  },
  {
    label: '最大回复长度',
    fieldName: 'maxToken',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入最大回复长度',
    },
  },
  {
    label: 'apiKey',
    fieldName: 'apiKey',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入apiKey',
    },
  },
  {
    label: 'baseUrl',
    fieldName: 'baseUrl',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入baseUrl',
    },
  },
  {
    label: '排序',
    fieldName: 'orders',
    rules: 'required',
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入模型顺序',
    },
  },
  {
    label: '状态',
    fieldName: 'enable',
    rules: 'required',
    component: 'RadioGroup',
    defaultValue: 'on',
    componentProps: {
      class: 'w-[180px]',
      placeholder: '请选择状态',
      options: getDictOptions(DictEnum.SYS_ENABLE),
    },
  },
  {
    label: '随机性',
    fieldName: 'temperature',
    component: 'InputNumber',
    defaultValue: 0.7,
    componentProps: {
      placeholder: '请输入随机性值0.1 - 1之间',
    },
  },
  {
    label: 'top_p',
    fieldName: 'topP',
    component: 'InputNumber',
    defaultValue: 0.7,
    componentProps: {
      placeholder: '请输入top_p',
    },
  },
  {
    label: '超时分钟',
    fieldName: 'timeout',
    component: 'InputNumber',
    defaultValue: 5,
    componentProps: {
      placeholder: '请输入超时时间（分钟）',
    },
  },
  {
    label: 'endpoint',
    fieldName: 'endpoint',
    component: 'Input',
    componentProps: {
      placeholder: '请输入endpoint',
    },
  },
  {
    label: 'secretKey',
    fieldName: 'secretKey',
    component: 'Input',
    componentProps: {
      placeholder: '请输入secretKey',
    },
  },
];
