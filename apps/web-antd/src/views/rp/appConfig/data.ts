import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';

import { getDictOptions } from '#/utils/dict';
import { renderDictTag } from '#/utils/render';

export const querySchema: FormSchemaGetter = () => [
    {
        label: '平台',
        fieldName: 'platform',
        component: 'Select',
        componentProps: {
            placeholder: '请选择平台',
            options: getDictOptions(DictEnum.SEND_PLATFORM),
        },
        colProps: { span: 8 },
    },
    {
        label: '设备类型',
        fieldName: 'deviceType',
        component: 'Select',
        componentProps: {
            placeholder: '请选择设备类型',
            options: getDictOptions(DictEnum.DEVICE_TYPE),
        },
        colProps: { span: 8 },
    },
    {
        label: '应用id',
        fieldName: 'applicationId',
        component: 'Input',
        componentProps: {
            placeholder: '请输入应用id',
        },
        colProps: { span: 8 },
    },
]

export const columns: VxeGridProps['columns'] = [
    { type: 'checkbox', width: 60 },
    {
        title: '平台',
        field: 'platform',
        slots: {
            default: ({ row }) => {
                const { platform } = row;
                return renderDictTag(
                    platform as string,
                    getDictOptions(DictEnum.SEND_PLATFORM),
                );
            },
        },
    },
    {
        title: '设备类型',
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
        title: '应用id',
        field: 'applicationId',
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
        label: '平台',
        fieldName: 'platform',
        rules: 'required',
        component: 'RadioGroup',
        componentProps: {
            options: getDictOptions(DictEnum.SEND_PLATFORM),
        },
    },
    {
        label: '设备类型',
        fieldName: 'deviceType',
        rules: 'required',
        component: 'Select',
        componentProps: {
            class: 'w-[180px]',
            placeholder: '请选择设备类型',
            options: getDictOptions(DictEnum.DEVICE_TYPE),
        },
    },
    {
        label: '应用id',
        fieldName: 'applicationId',
        rules: 'required',
        component: 'Input',
        componentProps: {
            placeholder: '请输入应用id',
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
