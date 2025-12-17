<script setup lang="ts">
import type { DropDownOptionsGroup } from './types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { Select, SelectOptGroup, SelectOption } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { AccountApi } from '#/api/rp/account';

import { ModalSchema } from './data';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const accountGroupOptions = ref<DropDownOptionsGroup[]>([]);
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
    const { id, accountGroups } = modalApi.getData() as {
      accountGroups: any[];
      id?: string;
    };
    accountGroupOptions.value = accountGroups as any;
    isUpdate.value = !!id;

    // 更新 && 赋值
    if (isUpdate.value && id) {
      const record = await AccountApi.getDetail(id);
      await formApi.setValues(record);
      if (record.extraInfo) {
        const extraData = JSON.parse(record.extraInfo);
        await formApi.setFieldValue('phone', extraData.phone);
        await formApi.setFieldValue('account', extraData.account);
        await formApi.setFieldValue('password', extraData.password);
      }
    }
    modalApi.modalLoading(false);
  },
});
function handleSelectChange(_: any, option: any) {
  formApi.setFieldValue('platform', option.extra);
}

async function handleConfirm() {
  try {
    modalApi.modalLoading(true);
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const data = cloneDeep(await formApi.getValues());
    const extraInfo = JSON.stringify({
      phone: data.phone,
      account: data.account,
      password: data.password,
    });
    const params = {
      id: isUpdate.value ? data.id : undefined,
      accountName: data.accountName,
      groupId: data.groupId,
      deviceCode: data.deviceCode,
      platform: data.platform,
      status: data.status,
      extraInfo,
    };
    console.log('params', params);
    await (isUpdate.value
      ? AccountApi.update(params)
      : AccountApi.create(params));
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
      <template #groupId="slotProps">
        <Select
          show-search
          allow-clear
          class="w-[80%]"
          v-bind="slotProps"
          placeholder="请选择分组"
          option-filter-prop="label"
          @change="handleSelectChange"
        >
          <SelectOptGroup
            v-for="group in accountGroupOptions"
            :key="group.label"
            :label="group.label"
          >
            <SelectOption
              v-for="item in group.options"
              :key="`${item.label}_${item.value}`"
              :value="item.value"
              :label="item.label"
              :extra="item.extraData"
            >
              {{ item.label }}
            </SelectOption>
          </SelectOptGroup>
        </Select>
      </template>
    </Form>
  </Modal>
</template>
