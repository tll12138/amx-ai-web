<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DictEnum } from '@vben/constants';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { ModelApi } from '#/api/ai/model';
import ProviderOption from '#/components/AIProvider/ProviderOption.vue';
import { getDictOptions } from '#/utils/dict';

import { ModalSchema } from './data';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

const [Form, formApi] = useVbenForm({
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // 所有表单项
    componentProps: {
      class: 'w-[80%]',
    },
  },
  showDefaultActions: false,
  // 垂直布局，label和input在不同行，值为vertical
  // 水平布局，label和input在同一行
  layout: 'horizontal',
  schema: ModalSchema(),
  wrapperClass: 'grid-cols-1',
});

const [VModal, modalApi] = useVbenModal({
  onCancel: handleCancel,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);
    const { id } = modalApi.getData() as { id?: string };
    isUpdate.value = !!id;

    // 更新 && 赋值
    if (isUpdate.value && id) {
      const record = await ModelApi.getDetail(id);
      formApi.setValues(record);
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
    await (isUpdate.value ? ModelApi.update(data) : ModelApi.create(data));
    emit('reload');
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
const handleTest = async () => {
  modalApi.modalLoading(true);
  const data = cloneDeep(await formApi.getValues());
  ModelApi.testModel(data)
    .then((res) => {
      Modal.info({
        title: '测试结果',
        content: res.data,
      });
    })
    .finally(() => {
      modalApi.modalLoading(false);
    });
};
</script>

<template>
  <VModal
    :draggable="true"
    :close-on-click-modal="false"
    :title="title"
    class="w-[500px]"
  >
    <template #footer>
      <div class="flex flex-row items-center">
        <a-space :size="12">
          <button
            v-tippy="{ theme: 'light', content: '测试模型连通性' }"
            class="rounded-[10px] bg-green-500 px-4 py-2 text-white"
            @click="handleTest"
          >
            测试
          </button>
          <a-button @click="handleCancel"> 取消 </a-button>
          <a-button type="primary" @click="handleConfirm"> 确定 </a-button>
        </a-space>
      </div>
    </template>
    <Form>
      <template #provider="slotProps">
        <a-select
          v-bind="slotProps"
          :options="getDictOptions(DictEnum.AI_PROVIDER)"
        >
          <template #option="{ label, value }">
            <ProviderOption :label="label" :value="value" />
          </template>
        </a-select>
      </template>
    </Form>
  </VModal>
</template>
