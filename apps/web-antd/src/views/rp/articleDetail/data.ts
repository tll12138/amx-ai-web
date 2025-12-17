import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

export const querySchema: FormSchemaGetter = () => [
  {
    label: '所属任务ID',
    fieldName: 'taskId',
    component: 'Input',
    componentProps: {
      placeholder: '请输入所属任务ID',
    },
  },
  {
    label: '执行账号ID',
    fieldName: 'accountId',
    component: 'Input',
    componentProps: {
      placeholder: '请输入执行账号ID',
    },
  },
  {
    label: '文章类型',
    fieldName: 'type',
    component: 'Select',
    componentProps: {
      placeholder: '请选择文章类型',
      options: [],
    },
  },
  {
    label: '文章标题',
    fieldName: 'title',
    component: 'Input',
    componentProps: {
      placeholder: '请输入文章标题',
    },
  },
  {
    label: '发布状态',
    fieldName: 'publishStatus',
    component: 'Select',
    componentProps: {
      placeholder: '请选择发布状态',
      options: [],
    },
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '所属任务ID',
    field: 'taskId',
  },
  {
    title: '执行账号ID',
    field: 'accountId',
  },
  {
    title: '文章类型（image_text 图文 / video 视频）',
    field: 'type',
  },
  {
    title: '文章标题',
    field: 'title',
  },
  {
    title: '文章内容',
    field: 'content',
  },
  {
    title: '发布状态（0未发布 1发布中 2成功 3失败）',
    field: 'publishStatus',
  },
  {
    title: '额外信息（如视频URL、封面图、标签、发布时间等）',
    field: 'extraInfo',
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
    label: '任务明细ID',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '所属任务ID',
    fieldName: 'taskId',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入所属任务ID',
    },
  },
  {
    label: '执行账号ID',
    fieldName: 'accountId',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入执行账号ID',
    },
  },
  {
    label: '文章类型（image_text 图文 / video 视频）',
    fieldName: 'type',
    rules: 'required',
    component: 'Select',
    componentProps: {
      class: 'w-[180px]',
      placeholder: '请选择文章类型（image_text 图文 / video 视频）',
      options: [],
    },
  },
  {
    label: '文章标题',
    fieldName: 'title',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入文章标题',
    },
  },
  {
    label: '文章内容',
    fieldName: 'content',
    component: 'Editor',
    componentProps: {
      placeholder: '请输入文章内容',
    },
  },
  {
    label: '发布状态（0未发布 1发布中 2成功 3失败）',
    fieldName: 'publishStatus',
    component: 'RadioGroup',
    componentProps: {
      options: [],
    },
  },
];
