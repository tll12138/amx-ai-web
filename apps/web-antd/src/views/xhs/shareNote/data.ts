import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

export const querySchema: FormSchemaGetter = () => [
  {
    label: '创建人',
    fieldName: 'createBy',
    component: 'Input',

  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '笔记作者',
    field: 'username',
    slots: { default: 'username' },
    width: 200,
  },
  {
    title: '笔记信息',
    field: 'noteId',
    slots: { default: 'noteId' },
    width: 300,
  },
  {
    title: '上次互动',
    field: 'preInteraction',
    sortable: true,
  },
  {
    title: '本次互动',
    field: 'interaction',
    sortable: true,
  },
  {
    title: '互动增量',
    field: 'interactions',
    slots: { default: 'interactions' },
  },
  {
    title: '创建人',
    field: 'createBy',
  },
  {
    title: '创建时间',
    field: 'createTime',
    width: 150,
  },
  {
    title: '更新时间',
    field: 'updateTime',
    width: 150,
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 250,
  },
];

export const ModalSchema: FormSchemaGetter = () => [
  {
    label: 'id',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '分享链接',
    fieldName: 'shareUrl',
    rules: 'required',
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入分享链接',
      autoSize: { minRows: 6, maxRows: 6 },
    },
  },
];
