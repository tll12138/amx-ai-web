import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import { getDictOptions } from '#/utils/dict';
import { renderDictTag } from '#/utils/render';

export const querySchema: FormSchemaGetter = () => [
  {
    label: '产品名称',
    fieldName: 'name',
    component: 'Input',
    componentProps: {
      placeholder: '请输入产品名称',
    },

  },
  {
    label: '品牌',
    fieldName: 'brand',
    component: 'Input',
    componentProps: {
      placeholder: '请输入品牌',
    },

  },
  {
    label: '功效',
    fieldName: 'effect',
    component: 'Input',
    componentProps: {
      placeholder: '请输入功效',
    },

  },
  {
    label: '归属',
    fieldName: 'type',
    component: 'Select',
    componentProps: {
      placeholder: '请选择归属',
      options: getDictOptions(DictEnum.PRODUCT_TYPE),
    },

  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '产品名称',
    align: 'left',
    field: 'name',
  },
  {
    title: '品牌',
    field: 'brand',
  },
  {
    title: '别名',
    field: 'nickName',
    align: 'left',
    slots: { default: 'nickName' },
  },
  {
    title: '归属',
    field: 'type',
    slots: {
      default: ({ row }) => {
        const { type } = row;
        return renderDictTag(
          type as string,
          getDictOptions(DictEnum.PRODUCT_TYPE),
        );
      },
    },
  },
  {
    title: '功效',
    field: 'effect',
    slots: { default: 'effect' },
  },
  {
    title: '年龄范围',
    field: 'ageRange',
  },
  {
    title: '成分',
    field: 'component',
  },
  {
    title: '卖点',
    field: 'description',
    slots: {
      default: ({ row }) => {
        const { description } = row;
        return description || '——';
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
    label: 'ID',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '产品名称',
    fieldName: 'name',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入产品名称',
    },
  },
  {
    label: '品牌',
    fieldName: 'brand',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入品牌',
    },
  },
  {
    label: '别名',
    fieldName: 'nickName',
    component: 'Select',
    componentProps: {
      placeholder: '请输入别名；使用空格分割',
    },
  },
  {
    label: '功效',
    fieldName: 'effect',
    rules: 'required',
    component: 'Select',
    componentProps: {
      placeholder: '请输入功效；使用空格分割',
    },
  },
  {
    label: '归属',
    fieldName: 'type',
    rules: 'required',
    component: 'Select',
    defaultValue: 'competitor',
    componentProps: {
      class: 'w-[180px]',
      placeholder: '请选择归属',
      options: getDictOptions(DictEnum.PRODUCT_TYPE),
    },
  },
  {
    label: '绑定产品',
    fieldName: 'productIds',
    component: 'Select',
    dependencies: {
      if(values) {
        return values.type === 'competitor';
      },
      triggerFields: ['type'],
    },
  },
  {
    label: '年龄范围',
    fieldName: 'ageRange',
    component: 'Input',
    componentProps: {
      placeholder: '请输入年龄范围',
    },
  },
  {
    label: '成分',
    fieldName: 'component',
    component: 'Input',
    componentProps: {
      placeholder: '请输入成分',
    },
  },
  {
    label: '卖点',
    fieldName: 'description',
    component: 'Textarea',
    componentProps: {
      autoSize: { minRows: 3, maxRows: 5 },
      placeholder: '请输入卖点',
    },
  },
];
