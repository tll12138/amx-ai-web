<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenModal, z } from '@vben/common-ui';
import { DictEnum } from '@vben/constants';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { useVbenForm } from '#/adapter/form';
import { PromptStyleApi } from '#/api/ai/promptStyle';
import { getDictOptions } from '#/utils/dict';

import { ModalSchema } from './data';

const emit = defineEmits<{ reload: [id: string] }>();

const isUpdate = ref(false);
const isCopy = ref(false);
const title = computed(() => {
  return `${isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add')}风格`;
});

const [Form, formApi] = useVbenForm({
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  showDefaultActions: false,
  // 垂直布局，label和input在不同行，值为vertical
  // 水平布局，label和input在同一行
  layout: 'horizontal',
  schema: ModalSchema(),
  wrapperClass: 'grid-cols-12',
});

const [Modal, modalApi] = useVbenModal({
  onCancel: handleCancel,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);
    const { id } = modalApi.getData() as { id?: string };
    const { copy } = modalApi.getData() as { copy?: boolean };
    isUpdate.value = !!id;
    isCopy.value = !!copy;
    console.log('isUpdate', isUpdate.value);
    // 更新 && 赋值
    if (isUpdate.value && id) {
      const record = await PromptStyleApi.getDetail(id);
      record.type = record.type.split(',');
      formApi.setValues(record);
    }
    if (isCopy.value) {
      formApi.updateSchema([
        {
          label: '主键',
          fieldName: 'id',
          component: 'Input',
          dependencies: {
            show: () => false,
            triggerFields: [''],
          },
        },
        {
          label: '名称',
          labelWidth: 60,
          fieldName: 'name',
          rules: z
            .string()
            .min(1, { message: '最少输入1个字符' })
            .max(10, '最多输入10个字符'),
          component: 'Input',
          formItemClass: 'items-baseline col-span-6',
          componentProps: {
            placeholder: '请输入风格名称',
          },
        },
        {
          label: '状态',
          labelWidth: 40,
          fieldName: 'enable',
          rules: 'required',
          component: 'RadioGroup',
          formItemClass: 'col-start-8 col-span-6',
          defaultValue: 'on',
          disabled: true,
          componentProps: {
            placeholder: '请选择状态',
            options: getDictOptions(DictEnum.SYS_ENABLE),
          },
        },

        {
          label: '类型',
          labelWidth: 60,
          fieldName: 'type',
          component: 'Select',
          formItemClass: 'col-span-6',
          componentProps: {
            mode: 'multiple',
            placeholder: '请选择风格类型',
            options: getDictOptions(DictEnum.AI_STYLE_TYPE),
          },
        },
        {
          label: '排序',
          fieldName: 'orders',
          rules: 'required',
          component: 'InputNumber',
          defaultValue: 0,
          labelWidth: 40,
          formItemClass: 'col-start-8 col-span-6',
          componentProps: {
            class: 'w-[130px]',
            placeholder: '请输入排序',
          },
        },
        {
          label: '提示词',
          labelWidth: 60,
          fieldName: 'prompt',
          rules: 'required',
          component: 'Textarea',
          formItemClass: 'items-baseline col-span-12',
          componentProps: {
            autoSize: { minRows: 4, maxRows: 15 },
            placeholder: '请输入提示词',
          },
        },
      ]);
    }

    console.log('isUpdate', isUpdate.value);
    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.modalLoading(true);
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const data = cloneDeep(await formApi.getValues());
    data.type = data.type.join(',');
    await (isUpdate.value
      ? PromptStyleApi.update(data)
      : PromptStyleApi.create(data));
    emit('reload', 'ok');
    await handleCancel();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.modalLoading(false);
  }
}
async function handleSave() {
  try {
    modalApi.modalLoading(true);
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const data = cloneDeep(await formApi.getValues());
    data.id = null;
    data.type = data.type.join(',');
    console.log('data', data);
    const resp = await PromptStyleApi.create(data);
    emit('reload', resp);
    await handleCancel();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.modalLoading(false);
  }
}

async function handleCancel() {
  modalApi.close();
  await formApi.resetForm();
}
</script>

<template>
  <Modal
    :draggable="true"
    :close-on-click-modal="false"
    :title="title"
    class="w-[650px]"
    style="z-index: 999"
  >
    <Form />
    <template #footer>
      <a-space>
        <a-button @click="handleCancel"> 取消 </a-button>
        <a-button type="primary" @click="handleConfirm"> 保存 </a-button>
        <a-button v-if="isCopy" type="primary" @click="handleSave">
          另存为
        </a-button>
      </a-space>
    </template>
  </Modal>
</template>
