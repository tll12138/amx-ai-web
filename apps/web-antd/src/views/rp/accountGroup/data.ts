import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { z } from 'zod';
import { DictEnum } from '@vben/constants';
import { getDictOptions } from '#/utils/dict';
import { ref } from 'vue';

// 全局 Ref：存储 RPA 账号下拉选项
export const rpanoOptions = ref<Array<{ label: string; value: string }>>([]);
// 新增：全局 Ref：存储比特分组下拉选项
export const biteGroupOptions = ref<Array<{ label: string; value: string }>>([]);

// --------------------------
// 核心：Zod 条件校验 Schema
// --------------------------
const rpaFormSchema = z.object({
  platform: z.string().min(1, '请选择分组所属平台'),
  isBite: z.number().optional(),
  rpaNo: z.string().min(1, '请选择关联的RPA账号'), // 始终必填
}).superRefine((data, ctx) => {
  // 1. 如果是抖音平台，isBite 必须选（不能是 undefined）
  if (data.platform === '抖音' && typeof data.isBite !== 'number') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '请选择是否比特',
      path: ['isBite'],
    });
  }

  // 2. 如果是抖音 且 是比特，biteGroup 必须选
  if (data.platform === '抖音' && data.isBite && !data.biteGroup) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '请选择比特分组',
      path: ['biteGroup'],
    });
  }
});

export const querySchema: FormSchemaGetter = () => [
  {
    label: '分组名称',
    fieldName: 'groupName',
    component: 'Input',
    componentProps: {
      placeholder: '请输入分组名称',
    },
  },
  {
    label: '所属平台',
    fieldName: 'platform',
    component: 'Select',
    componentProps: {
      placeholder: '请输入分组所属平台',
      options: getDictOptions(DictEnum.RP_PLATFORMS),
    },
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  { title: '分组名称', field: 'groupName' },
  { title: '所属平台', field: 'platform' },
  { title: '创建时间', field: 'createTime' },
  { title: '关联rpa账号', field: 'rpaName' },
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
    label: '分组ID',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '分组名称',
    fieldName: 'groupName',
    rules: 'required',
    component: 'Input',
    componentProps: {
      placeholder: '请输入分组名称',
    },
  },
  {
    label: '分组所属平台',
    fieldName: 'platform',
    rules: 'required',
    component: 'Select',
    componentProps: {
      placeholder: '请选择分组所属平台',
      options: getDictOptions(DictEnum.RP_PLATFORMS),
    },
  },
  // 1. 是否比特：仅抖音显示，无默认值（强制用户选择）
  {
    label: '是否比特',
    fieldName: 'isBite',
    rules: 'required',
    component: 'RadioGroup',
    dependencies: {
      show: (values) => values?.platform === '抖音',
      triggerFields: ['platform'],
    },
    componentProps: {
      options: [
        { label: '是', value: 1 },
        { label: '否', value: 0 },
      ],
      // 注意：不设 defaultValue，强制用户必选
    },
  },
  // 3. 关联RPA账号：始终显示，始终必填
  {
    label: '关联RPA账号',
    fieldName: 'rpaNo',
    rules: 'required', // 静态必填即可
    component: 'Select',
    componentProps: () => ({
      placeholder: '请选择关联的RPA账号',
      options: rpanoOptions.value || [],
    }),
  },
];
