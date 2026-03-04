<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { useVbenForm } from '#/adapter/form';
import { AccountGroupApi } from '#/api/rp/accountGroup';

import { AccountConfigApi } from '#/api/rp/accountConfig';
import { ModalSchema, rpanoOptions } from './data';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

// 新增：存储账号配置下拉选项
const accountConfigOptions = ref<AccountConfigOption[]>([]);

const loadAccountConfigList = async () => {
  try {
    const requestParams = { pageNum: 1, pageSize: 100 };

    const res = await AccountConfigApi.getList(requestParams);

    // 核心修正：从 res.rows 读取列表（而非 res.records）
    const options = res.rows?.map(item => ({
      label: item.robotClientName, // 账号名称作为下拉显示值
      value: item.id, // id作为下拉值
    })) || [];

    rpanoOptions.value = options;

  } catch (error) {
    console.error('【加载RPA账号列表】失败：', error);
    if (error instanceof Error) {
      console.error('【加载RPA账号列表】错误详情：', error.message, error.stack);
    }
    rpanoOptions.value = [];
  }
};

// 动态生成表单Schema（注入下拉选项）
const getModalSchema = () => {
  const schema = ModalSchema();
  const rpanoField = schema.find(item => item.fieldName === 'rpaNo');
  if (rpanoField) {
    rpanoField.componentProps = {
      ...rpanoField.componentProps,
      options: accountConfigOptions.value,
    };
  }
  return schema;
};

// 初始化表单（无需动态修改 Schema）
const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-[80%]' } },
  showDefaultActions: false,
  layout: 'horizontal',
  schema: ModalSchema(), // 静态 Schema，通过 Ref 动态更新选项
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
    // 1. 获取模态框传参（编辑/新增的上下文）
    const { id, platform } = modalApi.getData() as { id?: string; platform?: string };
    // 2. 加载RPA账号下拉选项（直接更新 Ref）
    await loadAccountConfigList();
    // 3. 编辑场景：回显数据
    isUpdate.value = !!id;
    if (isUpdate.value && id) {
      const record = await AccountGroupApi.getDetail(id);
      formApi.setValues(record);
      console.log('编辑赋值：', record);
    }

    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.modalLoading(true);
    // 1. 表单校验
    const { valid } = await formApi.validate();
    if (!valid) return;

    // 2. 获取表单数据并补充rpaname
    const data = cloneDeep(await formApi.getValues());
    const selectedOption = accountConfigOptions.value.find(item => item.value === data.rpaNo);
    data.rpaname = selectedOption?.label || ''; // 补充rpaname字段

    // 3. 提交接口（新增/编辑）
    await (isUpdate.value ? AccountGroupApi.update(data) : AccountGroupApi.create(data));
    emit('reload'); // 通知列表刷新
    await handleCancel();
  } catch (error) {
    console.error('提交失败：', error);
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
    <Form />
  </Modal>
</template>
