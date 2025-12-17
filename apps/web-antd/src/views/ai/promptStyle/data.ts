import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import dayjs from 'dayjs';

import { z } from '#/adapter/form';
import { getDictOptions } from '#/utils/dict';
import { renderDictTag } from '#/utils/render';

export const querySchema: FormSchemaGetter = () => [
  {
    label: '风格名称',
    fieldName: 'name',
    component: 'Input',
    componentProps: {
      placeholder: '请输入风格名称',
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

  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '风格名称',
    field: 'name',
    width: 180,
  },
  {
    title: '类型',
    field: 'type',
    width: 250,
    slots: { default: 'type' },
  },
  {
    title: '提示词',
    field: 'prompt',
    showOverflow: false,
  },
  {
    title: '排序',
    field: 'orders',
    width: 150,
  },
  {
    title: '状态',
    field: 'enable',
    slots: {
      default: ({ row }) => {
        const { enable } = row;
        return renderDictTag(
          enable as string,
          getDictOptions(DictEnum.SYS_ENABLE),
        );
      },
    },
    width: 150,
  },
  {
    title: '创建时间',
    field: 'createTime',
    slots: {
      default: ({ row }) => {
        const { createTime } = row;
        return dayjs(createTime).format('MM-DD HH:mm');
      },
    },
    width: 180,
  },
  {
    title: '创建人',
    field: 'createByName',
    width: 180,
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
    label: '主键',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '名称',
    labelWidth: 60,
    fieldName: 'name',
    rules: z
      .string()
      .min(1, { message: '最少输入1个字符' })
      .max(10, '最多输入10个字符'),
    component: 'Input',
    formItemClass: 'items-baseline col-span-6',
    componentProps: {
      placeholder: '请输入风格名称',
    },
  },
  {
    label: '状态',
    labelWidth: 40,
    fieldName: 'enable',
    rules: 'required',
    component: 'RadioGroup',
    formItemClass: 'col-start-8 col-span-6',
    defaultValue: 'on',
    componentProps: {
      placeholder: '请选择状态',
      options: getDictOptions(DictEnum.SYS_ENABLE),
    },
  },

  {
    label: '类型',
    labelWidth: 60,
    fieldName: 'type',
    component: 'Select',
    formItemClass: 'col-span-6',
    componentProps: {
      mode: 'multiple',
      placeholder: '请选择风格类型',
      options: getDictOptions(DictEnum.AI_STYLE_TYPE),
    },
  },
  {
    label: '排序',
    fieldName: 'orders',
    rules: 'required',
    component: 'InputNumber',
    defaultValue: 0,
    labelWidth: 40,
    formItemClass: 'col-start-8 col-span-6',
    componentProps: {
      class: 'w-[130px]',
      placeholder: '请输入排序',
    },
  },
  {
    label: '描述',
    labelWidth: 60,
    fieldName: 'description',
    rules: z.string().max(100, '最多输入100个字符'),
    component: 'Textarea',
    formItemClass: 'items-baseline col-span-12',
    componentProps: {
      autoSize: { minRows: 2, maxRows: 3 },
      placeholder: '请输入风格描述',
    },
  },
  {
    label: '提示词',
    labelWidth: 60,
    fieldName: 'prompt',
    rules: 'required',
    component: 'Textarea',
    formItemClass: 'items-baseline col-span-12',
    componentProps: {
      autoSize: { minRows: 4, maxRows: 15 },
      placeholder: '请输入提示词',
    },
  },
];
