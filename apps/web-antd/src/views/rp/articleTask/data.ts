import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

export const querySchema: FormSchemaGetter = () => [
  {
    label: '任务名称',
    fieldName: 'taskName',
    component: 'Input',
    componentProps: {
      placeholder: '请输入任务名称',
    },
  },
  {
    label: '任务状态',
    fieldName: 'status',
    component: 'Select',
    componentProps: {
      placeholder: '请选择任务状态',
      options: [],
    },
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '任务名称',
    field: 'taskName',
  },
  {
    title: '任务描述',
    field: 'description',
  },
  {
    title: '文章数量',
    field: 'totalArticles',
  },
  {
    title: '任务状态',
    field: 'status',
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

export const DrawerSchema: FormSchemaGetter = () => [
  {
    label: '任务ID',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '任务名称',
    fieldName: 'taskName',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入任务名称',
    },
  },
  {
    label: '任务描述',
    fieldName: 'description',
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入任务描述',
    },
  },
  {
    label: '文章数量',
    fieldName: 'totalArticles',
    component: 'Input',
    componentProps: {
      placeholder: '请输入文章数量',
    },
  },
  {
    label: '任务状态',
    fieldName: 'status',
    component: 'RadioGroup',
    componentProps: {
      options: [],
    },
  },
];
