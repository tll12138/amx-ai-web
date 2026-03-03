import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import { getDictOptions } from '#/utils/dict';
import { renderDictTag } from '#/utils/render';

export const querySchema: FormSchemaGetter = () => [
    {
        label: '所属任务',
        fieldName: 'taskId',
        component: 'Input',
        componentProps: {
            placeholder: '请输入所属任务ID',
        },
        colProps: { span: 8 },
    },
    {
        label: '执行账号',
        fieldName: 'accountId',
        component: 'Input',
        componentProps: {
            placeholder: '请输入执行账号ID',
        },
        colProps: { span: 8 },
    },
    {
        label: '文章类型',
        fieldName: 'type',
        component: 'Select',
        componentProps: {
            placeholder: '请选择文章类型',
            options: getDictOptions(DictEnum.ARTICLE_TYPE),
        },
        colProps: { span: 8 },
    },
    {
        label: '文章标题',
        fieldName: 'title',
        component: 'Input',
        componentProps: {
            placeholder: '请输入文章标题',
        },
        colProps: { span: 8 },
    },
    {
        label: '发布状态',
        fieldName: 'publishStatus',
        component: 'Select',
        componentProps: {
            placeholder: '请选择发布状态',
            options: getDictOptions(DictEnum.ARTICLE_RELEASE_STATUS),
        },
        colProps: { span: 8 },
    }
]

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
        title: '文章类型',
        field: 'type',
        slots: {
            default: ({ row }) => {
                const { type } = row;
                return renderDictTag(
                    type as string,
                    getDictOptions(DictEnum.ARTICLE_TYPE),
                );
            },
        },
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
        title: '发布状态',
        field: 'publishStatus',
        slots: {
            default: ({ row }) => {
                const { publishStatus } = row;
                return renderDictTag(
                    publishStatus as string,
                    getDictOptions(DictEnum.ARTICLE_RELEASE_STATUS),
                );
            },
        },
    },
    {
        title: '发布截图',
        field: 'screenshot',
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
        label: '文章类型',
        fieldName: 'type',
        rules: 'required',
        component: 'Select',
        componentProps: {
            class: 'w-[180px]',
            placeholder: '请选择文章类型',
            options: getDictOptions(DictEnum.ARTICLE_TYPE),
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
        label: '发布状态',
        fieldName: 'publishStatus',
        component: 'Select',
        componentProps: {
            class: 'w-[180px]',
            placeholder: '请选择发布状态',
            options: getDictOptions(DictEnum.ARTICLE_RELEASE_STATUS),
        },
    },
    {
        label: '额外信息（如视频URL、封面图、标签、发布时间等）',
        fieldName: 'extraInfo',
    },
    {
        label: '发布截图',
        fieldName: 'screenshot',
        component: 'FileUpload',
        componentProps: {
            fileType: 'image',
            maxCount: 1,
        },
    },
]
