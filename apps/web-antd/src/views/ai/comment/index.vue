<script lang="ts" setup>
import type { AICommentVO } from './data';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import {
  EventStreamContentType,
  fetchEventSource,
} from '@microsoft/fetch-event-source';
import { message } from 'ant-design-vue';

import { CommentTaskApi } from '#/api/ai/commentTask';
import { commonDownloadExcel } from '#/utils/file/download';

import ConfigPanel from './ConfigPanel.vue';
import ResultPanel from './ResultPanel.vue';
// 状态变量
const generateStatus = ref<'done' | 'error' | 'init' | 'processing'>('init');

// 生成的评论
const generatedComments = ref<Array<string>>([]);

// 配置选项
const formState = reactive<AICommentVO>({
  id: '',
  type: '',
  style: undefined,
  model: undefined,
  productId: undefined,
  sentiment: 'mixed',
  guideline: 'mixed',
  operationType: '',
  generateStatus: '',
  example: '',
  keywords: '',
  aiContent: '',
  commentCount: 5,
  maxWords: 20,
  temperature: 0.7,
  topP: 0.7,
});

const container = reactive({
  content: '',
  loading: false,
  ctrl: new AbortController(),
  thinkContent: '',
  think: false,
});
const accessStore = useAccessStore();
const { apiURL, clientId } = useAppConfig(
  import.meta.env,
  import.meta.env.PROD,
);
/**
 * 重置容器
 */
const resetContainer = () => {
  container.content = '';
  container.loading = false;
  container.ctrl = new AbortController();
  container.think = false;
  container.thinkContent = '';
  // 更新生成状态
  generateStatus.value = 'processing';
  //  重置forState
  formState.id = '';
  formState.aiContent = '';
};

/**
 * 处理断开连接
 */
const handleDisconnect = () => {
  container.ctrl.abort();
  container.loading = false;
  generateStatus.value = 'init';
  console.log('SSE 断开连接');
};

const handleSaveComments = (content: string) => {
  formState.aiContent = content;
  CommentTaskApi.create(formState).then((res: string) => {
    formState.id = res;
  });
};

/**
 * 发送SSE请求
 * @param url
 * @param headers
 */
const sendRequest = (url: string, headers: Record<string, string>) => {
  fetchEventSource(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(formState),
    openWhenHidden: true,
    signal: container.ctrl.signal,
    async onopen(response) {
      if (
        response.ok &&
        response.headers.get('content-type')?.includes(EventStreamContentType)
      ) {
        console.log(`SSE 连接成功`);
        generateStatus.value = 'processing';
      } else {
        throw new Error(response.statusText);
      }
    },
    onmessage(ev) {
      if (ev.event === 'error') {
        generateStatus.value = 'error';
        handleDisconnect();
        message.error(ev.data);
        return;
      }
      generatedComments.value = JSON.parse(ev.data);
      generateStatus.value = 'done';
      // 保存内容
      handleSaveComments(ev.data);
    },
    onclose() {
      handleDisconnect();
      generateStatus.value = 'done';
    },
    onerror(err) {
      container.loading = false;
      container.ctrl.abort();
      message.error(err);
      generateStatus.value = 'error';
      throw err;
    },
  });
};
/**
 * 提交任务
 * @param data
 */
const handleSubmitTask = (data: AICommentVO) => {
  resetContainer();
  const url = `${apiURL}/ai/commentTask/generate`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessStore.accessToken}`,
    clientId,
  };
  container.loading = true;
  formState.type = 'product';
  formState.style = data.style;
  formState.model = data.model;
  formState.example = data.example;
  formState.productId = data.productId;
  formState.operationType = 'generate';
  formState.generateStatus = 'completed';
  formState.maxWords = data.maxWords;
  formState.commentCount = data.commentCount;
  formState.sentiment = data.sentiment;
  formState.guideline = data.guideline;
  formState.topP = data.topP;
  formState.temperature = data.temperature;
  const keyword = data?.keywords;
  formState.keywords = Array.isArray(keyword) ? keyword.join(',') : keyword;
  sendRequest(url, headers);
};

const handleExport = () => {
  if (!formState.id) {
    message.error('导出异常');
  }
  commonDownloadExcel(CommentTaskApi.export, 'AI评论内容', formState);
};
</script>
<template>
  <Page :auto-content-height="true">
    <div class="flex h-full">
      <div class="w-1/3 border-r border-gray-200">
        <ConfigPanel
          :is-loading="container.loading"
          @generate="handleSubmitTask"
          @stop-task="handleDisconnect"
        />
      </div>
      <div class="w-2/3">
        <ResultPanel
          :generated-comments="generatedComments"
          :show-results="generateStatus"
          @export="handleExport"
        />
      </div>
    </div>
  </Page>
</template>
<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

:deep(.ant-form-item-label > label) {
  @apply text-[14px] font-semibold uppercase tracking-wide text-gray-600;
}
</style>
