import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import { getDictOptions } from '#/utils/dict';
import { renderDictTag } from '#/utils/render';

export const querySchema: FormSchemaGetter = () => [
    {
        label: '账号名称',
        fieldName: 'accountName',
        component: 'Input',
        componentProps: {
            placeholder: '请输入账号名称',
        },
        colProps: { span: 8 },
    },
    {
        label: '账号编码',
        fieldName: 'accountCode',
        component: 'Input',
        componentProps: {
            placeholder: '请输入账号编码',
        },
        colProps: { span: 8 },
    },
    {
        label: '账号状态',
        fieldName: 'status',
        component: 'Select',
        componentProps: {
            placeholder: '请选择账号状态',
            options: getDictOptions(DictEnum.IS_USED),
        },
        colProps: { span: 8 },
    },
]

export const columns: VxeGridProps['columns'] = [
    { type: 'checkbox', width: 60 },
    {
        title: '账号名称',
        field: 'accountName',
    },
    {
        title: '账号编码',
        field: 'accountCode',
    },
    {
        title: '账号状态',
        field: 'status',
        slots: {
            default: ({ row }) => {
                const { status } = row;
                return renderDictTag(
                    status as string,
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
        label: '比特账号ID',
        fieldName: 'id',
        component: 'Input',
        dependencies: {
            show: () => false,
            triggerFields: [''],
        },
    },
    {
        label: '账号名称',
        fieldName: 'accountName',
        rules: 'required',
        component: 'Input',
        componentProps: {
            placeholder: '请输入账号名称',
        },
    },
    {
        label: '账号编码',
        fieldName: 'accountCode',
        rules: 'required',
        component: 'Input',
        componentProps: {
            placeholder: '请输入账号编码',
        },
    },
    {
        label: '账号状态',
        fieldName: 'status',
        component: 'RadioGroup',
        componentProps: {
            options: getDictOptions(DictEnum.IS_USED),
        },
    },
]
