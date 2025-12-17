<!-- 审批同意的弹窗 -->
<script setup lang="ts">
import type { CompleteTaskReqData } from '#/api/workflow/task/model';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { omit } from 'lodash-es';

import { useVbenForm } from '#/adapter/form';
import { completeTask } from '#/api/workflow/task';

import { CopyComponent } from '.';

const emit = defineEmits<{ complete: [] }>();

const [BasicForm, formApi] = useVbenForm({
  commonConfig: {
    // 默认占满两列
    formItemClass: 'col-span-2',
    // 默认label宽度 px
    labelWidth: 100,
    // 通用配置项 会影响到所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      fieldName: 'taskId',
      component: 'Input',
      label: '任务ID',
      dependencies: {
        show: false,
        triggerFields: [''],
      },
    },
    {
      fieldName: 'messageType',
      component: 'CheckboxGroup',
      componentProps: {
        options: [
          { label: '站内信', value: '1', disabled: true },
          { label: '邮件', value: '2' },
          { label: '短信', value: '3' },
        ],
      },
      label: '通知方式',
      defaultValue: ['1'],
    },
    {
      fieldName: 'attachment',
      component: 'FileUpload',
      componentProps: {
        resultField: 'ossId',
        maxNumber: 10,
        maxSize: 20,
        accept: [
          'png',
          'jpg',
          'jpeg',
          'doc',
          'docx',
          'xlsx',
          'xls',
          'ppt',
          'pdf',
        ],
      },
      defaultValue: [],
      label: '附件上传',
      formItemClass: 'items-start',
    },
    {
      fieldName: 'flowCopyList',
      component: 'Input',
      defaultValue: [],
      label: '抄送人',
    },
    {
      fieldName: 'message',
      component: 'Textarea',
      label: '审批意见',
      formItemClass: 'items-baseline',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

interface ModalProps {
  taskId: string;
}

const [BasicModal, modalApi] = useVbenModal({
  title: '审批通过',
  fullscreenButton: false,
  class: 'min-h-[365px]',
  onConfirm: handleSubmit,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      await formApi.resetForm();
      return null;
    }
    modalApi.modalLoading(true);

    const { taskId } = modalApi.getData() as ModalProps;
    await formApi.setFieldValue('taskId', taskId);

    modalApi.modalLoading(false);
  },
});

async function handleSubmit() {
  try {
    modalApi.modalLoading(true);
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const data = cloneDeep(await formApi.getValues());
    // 需要转换数据 抄送人员
    const flowCopyList = (data.flowCopyList as Array<any>).map((item) => ({
      userId: item.userId,
      userName: item.nickName,
    }));
    const requestData = {
      ...omit(data, ['attachment']),
      fileId: data.attachment.join(','),
      taskVariables: {},
      variables: {},
      flowCopyList,
    } as CompleteTaskReqData;
    await completeTask(requestData);
    modalApi.close();
    emit('complete');
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.modalLoading(false);
  }
}
</script>

<template>
  <BasicModal>
    <BasicForm>
      <template #flowCopyList="slotProps">
        <CopyComponent v-model:user-list="slotProps.modelValue" />
      </template>
    </BasicForm>
  </BasicModal>
</template>
