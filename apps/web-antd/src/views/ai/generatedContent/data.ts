import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import { getDictOptions } from '#/utils/dict';
import { renderDictTag } from '#/utils/render';

export const querySchema: FormSchemaGetter = () => [
    {
        label: '标题',
        fieldName: 'parsedTitle',
        component: 'Input',
        componentProps: {
            placeholder: '请输入解析后的标题',
        },
        colProps: { span: 8 },
    },
    {
        label: '生成时间',
        fieldName: 'generateTime',
        component: 'RangePicker',
        colProps: { span: 8 },
    },
    {
      label: '是否已使用',
      fieldName: 'isUsed',
      component: 'Select',
      componentProps: {
        placeholder: '请选择是否已使用',
        options: getDictOptions(DictEnum.IS_USED),
      },
      colProps: { span: 8 },
    },
]

export const columns: VxeGridProps['columns'] = [
    { type: 'checkbox', width: 60 },
    {
        title: '原始AI生成内容',
        field: 'originalContent',
    },
    {
        title: '解析后的标题',
        field: 'parsedTitle',
    },
    {
        title: '解析后的段落',
        field: 'parsedParagraphs',
    },
    {
        title: '关键词',
        field: 'keywordAnalysis',
    },
    {
        title: '生成时间',
        field: 'generateTime',
    },
    {
      title: '是否已使用',
      field: 'isUsed',
      slots: {
        default: ({ row }) => {
          const { isUsed } = row;
          return renderDictTag(
            isUsed as string,
            getDictOptions(DictEnum.IS_USED),
          );
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
]

export const ModalSchema: FormSchemaGetter = () => [
    {
        label: '主键ID',
        fieldName: 'id',
        component: 'Input',
        dependencies: {
            show: () => false,
            triggerFields: [''],
        },
    },
    {
        label: '关联的生成任务ID',
        fieldName: 'taskId',
        rules: 'required',
        component: 'Input',
        componentProps: {
            placeholder: '请输入关联的生成任务ID',
        },
    },
    {
        label: '原始AI生成内容',
        fieldName: 'originalContent',
        component: 'Editor',
        componentProps: {
            placeholder: '请输入原始AI生成内容',
        },
    },
    {
        label: '解析后的标题',
        fieldName: 'parsedTitle',
        component: 'Input',
        componentProps: {
            placeholder: '请输入解析后的标题',
        },
    },
    {
        label: '解析后的段落（JSON格式）',
        fieldName: 'parsedParagraphs',
        component: 'Textarea',
        componentProps: {
            placeholder: '请输入解析后的段落（JSON格式）',
        },
    },
    {
        label: '关键词分析（JSON格式）',
        fieldName: 'keywordAnalysis',
        component: 'Textarea',
        componentProps: {
            placeholder: '请输入关键词分析（JSON格式）',
        },
    },
    {
        label: '生成时间',
        fieldName: 'generateTime',
        rules: 'required',
        component: 'DatePicker',
        componentProps: {
            showTime: true,
            format: 'YYYY-MM-DD HH:mm:ss',
            valueFormat: 'x',
        },
    },
    {
      label: '是否已使用',
      fieldName: 'isUsed',
      rules: 'required',
      component: 'Select',
      componentProps: {
        class: 'w-[180px]',
        placeholder: '请选择是否已使用',
        options: getDictOptions(DictEnum.IS_USED),
      },
    },
]
