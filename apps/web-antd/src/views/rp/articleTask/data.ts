import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { DictEnum } from '@vben/constants';
import { getDictOptions } from '#/utils/dict';
import { renderDictTag } from '#/utils/render';

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
      options: getDictOptions(DictEnum.ARTICLE_RELEASE_STATUS),
    },
    colProps: { span: 8 },
  },
  {
    label: '终端类型',
    fieldName: 'deviceType',
    component: 'Select',
    componentProps: {
      placeholder: '请选择终端类型',
      options: getDictOptions(DictEnum.DEVICE_TYPE),
    },
    colProps: { span: 8 },
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
    slots: {
      default: ({ row }) => {
        const { status } = row;
        return renderDictTag(
          status as string,
          getDictOptions(DictEnum.ARTICLE_RELEASE_STATUS),
        );
      },
    },
  },
  {
    title: '终端类型',
    field: 'deviceType',
    slots: {
      default: ({ row }) => {
        const { deviceType } = row;
        return renderDictTag(
          deviceType as string,
          getDictOptions(DictEnum.DEVICE_TYPE),
        );
      },
    },
  },
  {
    title: '创建时间',
    field: 'createTime',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' }, // action插槽是业务自定义（已存在），保留
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
    title: '任务状态',
    field: 'status',
    slots: {
      default: ({ row }) => {
        const { status } = row;
        return renderDictTag(
          status as string,
          getDictOptions(DictEnum.ARTICLE_RELEASE_STATUS),
        );
      },
    },
  },
  {
    title: '终端类型',
    field: 'deviceType',
    slots: {
      default: ({ row }) => {
        const { deviceType } = row;
        return renderDictTag(
          deviceType as string,
          getDictOptions(DictEnum.DEVICE_TYPE),
        );
      },
    },
  },
];
