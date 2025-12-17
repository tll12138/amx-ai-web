import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

export const querySchema: FormSchemaGetter = () => [
  {
    label: '商品',
    fieldName: 'productId',
    component: 'Select',
    componentProps: {
      placeholder: '请选择商品',
    },
    colProps: {span: 8},
  },
  {
    label: '类别',
    fieldName: 'type',
    component: 'Input',
    componentProps: {
      placeholder: '请输入类别',
    },
    colProps: {span: 8},
  },
  {
    label: '关键词',
    fieldName: 'keyword',
    component: 'Input',
    componentProps: {
      placeholder: '请输入关键词',
    },
    colProps: {span: 8},
  },
]

export const columns: VxeGridProps['columns'] = [
  {type: 'checkbox', width: 60},
  {
    title: '商品',
    field: 'productName',
  },
  {
    title: '类别',
    field: 'type',
  },
  {
    title: '关键词',
    field: 'keyword',
  },
  {
    title: '搜索指数',
    field: 'weight',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: {default: 'action'},
    title: '操作',
    width: 180,
  },
]

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
    label: '商品',
    fieldName: 'productId',
    rules: 'required',
    component: 'Select',
    componentProps: {
      placeholder: '请选择商品',
    },
  },
  {
    label: '类别',
    fieldName: 'type',
    rules: 'required',
    component: 'Input',
    componentProps: {
      class: 'w-[180px]',
      placeholder: '请输入类别',
    },
  },
  {
    label: '关键词',
    fieldName: 'keyword',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入关键词',
    },
  },
  {
    label: '搜索指数',
    fieldName: 'weight',
    rules: 'required',
    component: 'InputNumber',
    componentProps: {
      min: 0,
      max: 100000000,
      placeholder: '请输入搜索指数',
    },
  },
]
