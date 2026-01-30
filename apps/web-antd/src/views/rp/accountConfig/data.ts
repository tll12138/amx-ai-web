import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import { getDictOptions } from '#/utils/dict';
import { renderDictTag } from '#/utils/render';

export const querySchema: FormSchemaGetter = () => [
    {
        label: '账号名称',
        fieldName: 'robotClientName',
        component: 'Input',
        componentProps: {
            placeholder: '请输入账号名称',
        },
        colProps: { span: 8 },
    },
    {
        label: '账号唯一标识',
        fieldName: 'robotClientUuid',
        component: 'Input',
        componentProps: {
            placeholder: '请输入账号唯一标识',
        },
        colProps: { span: 8 },
    },
    {
        label: '状态 (0正常 1异常)',
        fieldName: 'status',
        component: 'Select',
        componentProps: {
            placeholder: '请选择状态 (0正常 1异常)',
            options: getDictOptions(DictEnum.SYS_NOTICE_STATUS),
        },
        colProps: { span: 8 },
    },
]

export const columns: VxeGridProps['columns'] = [
    { type: 'checkbox', width: 60 },
    {
        title: '账号名称',
        field: 'robotClientName',
    },
    {
        title: '账号唯一标识',
        field: 'robotClientUuid',
    },
    {
        title: '状态 (0正常 1异常)',
        field: 'status',
        slots: {
            default: ({ row }) => {
                const { status } = row;
                return renderDictTag(
                    status as string,
                    getDictOptions(DictEnum.SYS_NOTICE_STATUS),
                );
            },
        },
    },
    {
        title: '备注',
        field: 'remark',
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
        label: '账号名称',
        fieldName: 'robotClientName',
        rules: 'required',
        component: 'Input',
        componentProps: {
            placeholder: '请输入账号名称',
        },
    },
    {
        label: '账号唯一标识',
        fieldName: 'robotClientUuid',
        rules: 'required',
        component: 'Input',
        componentProps: {
            placeholder: '请输入账号唯一标识',
        },
    },
    {
        label: '状态 (0正常 1异常)',
        fieldName: 'status',
        component: 'RadioGroup',
        componentProps: {
            options: getDictOptions(DictEnum.SYS_NOTICE_STATUS),
        },
    },
    {
        label: '备注',
        fieldName: 'remark',
        component: 'Textarea',
        componentProps: {
            placeholder: '请输入备注',
        },
    },
]
