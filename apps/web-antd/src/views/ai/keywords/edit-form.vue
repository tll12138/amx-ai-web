<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { Select, SelectOptGroup, SelectOption } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { GoodsApi } from '#/api/ai/goods';
import { KeywordsApi } from '#/api/ai/keywords';

import { ModalSchema } from './data';

const emit = defineEmits<{ reload: [] }>();

const productList = ref([]);

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

const [Modal, modalApi] = useVbenModal({
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
      const record = await KeywordsApi.getDetail(id);
      formApi.setValues(record);
    }
    productList.value = await GoodsApi.getSelfProduct();
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
    await (isUpdate.value
      ? KeywordsApi.update(data)
      : KeywordsApi.create(data));
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
</script>

<template>
  <Modal
    :draggable="true"
    :close-on-click-modal="false"
    :title="title"
    class="w-[500px]"
  >
    <Form>
      <template #productId="slotProps">
        <Select
          show-search
          allow-clear
          class="w-[80%]"
          v-bind="slotProps"
          placeholder="请选择商品"
          option-filter-prop="label"
        >
          <SelectOptGroup
            v-for="group in productList"
            :key="group.label"
            :label="group.label"
          >
            <SelectOption
              v-for="item in group.options"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            >
              {{ item.label }}
            </SelectOption>
          </SelectOptGroup>
        </Select>
      </template>
    </Form>
  </Modal>
</template>
