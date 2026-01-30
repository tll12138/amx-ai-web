<script setup lang="ts">
import type { AiGenerateTask } from './data.ts';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import {
  EventStreamContentType,
  fetchEventSource,
} from '@microsoft/fetch-event-source';
import { message } from 'ant-design-vue';

import { GenerationTaskApi } from '#/api/ai/generationTask';
import { copyToClipboard } from '#/utils/copy';

import ConfigPanel from './ConfigPanel.vue';
import GenerationPanel from './GenerationPanel.vue';
import ReferencePanel from './ReferencePanel.vue';

const defaultState: AiGenerateTask = {
  id: undefined,
  style: undefined,
  model: undefined,
  noteId: '',
  xsecToken: '',
  noteTitle: '',
  noteCover: '',
  noteContent: '',
  productId: undefined,
  competitorIds: [],
  keywords: [],
  referenceLatitude: undefined,
  otherLimit: undefined,
  aiContent: '',
  operationType: '',
  generateStatus: '',
  grade: undefined,
  temperature: 0.7,
  topP: 0.7,
};
const formState = reactive<AiGenerateTask>({ ...defaultState });
const generateStatus = ref('noStart');
const isMiddleVisible = ref(true);
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
 * 清除笔记信息
 */
const clearNoteInfo = () => {
  formState.noteId = '';
  formState.noteTitle = '';
  formState.noteContent = '';
  formState.noteCover = '';
  formState.xsecToken = '';
  formState.avatar = '';
  formState.nickname = '';
  formState.publishTime = '';
};

/**
 * 切换 隐藏/显示 中间面板
 */
const toggleMiddle = (visible?: boolean) => {
  if (!visible) {
    clearNoteInfo();
  }
  isMiddleVisible.value = visible;
};

/**
 * 更新笔记内容
 * @param content 笔记内容
 */
const updateNoteDesc = (content: string) => {
  console.log('updateNoteDesc', content);
  formState.noteContent = content;
};

/**
 * 复制文本
 */
const handleCopy = () => {
  copyToClipboard(formState.aiContent);
};

/**
 * 处理笔记信息
 * @param noteInfo
 */
const handleNoteInfo = (noteInfo: any) => {
  console.log('noteInfo', noteInfo);
  formState.noteId = noteInfo.noteId;
  formState.noteContent = `${noteInfo.title}\n${noteInfo.desc}`;
  formState.noteCover = noteInfo.cover;
  formState.xsecToken = noteInfo.xsecToken;
  formState.avatar = noteInfo.avatar;
  formState.nickname = noteInfo.nickname;
  formState.publishTime = noteInfo.publishTime;
};

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
};

/**
 * 处理断开连接
 */
const handleDisconnect = () => {
  container.ctrl.abort();
  container.loading = false;
  console.log('SSE 断开连接');
};

/**
 * 处理提交表单
 */
const handleSubmitForm = async () => {
  const params = {
    type: 'hc',
    style: formState.style,
    model: formState.model,
    noteId: formState.noteId,
    xsecToken: formState.xsecToken,
    noteTitle: formState.noteTitle,
    noteCover: formState.noteCover,
    noteContent: formState.noteContent,
    productId: formState.productId,
    keywords: formState.keywords,
    competitorIds: formState.competitorIds,
    referenceLatitude: formState.referenceLatitude,
    otherLimit: formState.otherLimit,
    aiContent: container.content,
    operationType: formState.operationType,
    generateStatus: 'completed',
    grade: formState.grade,
  };
  formState.id = await GenerationTaskApi.create(params);
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
      } else {
        throw new Error(response.statusText);
      }
    },
    onmessage(ev) {
      console.log('ev', ev);
      if (ev.event === 'error') {
        handleDisconnect();
        message.error(ev.data);
        return;
      }
      console.log(ev.data);
      const jsonData = JSON.parse(ev.data);
      if (jsonData.isEnd) {
        generateStatus.value = 'done';
        handleDisconnect();
        handleSubmitForm();
        return;
      }
      if (jsonData.isThinking) {
        container.think = true;
        container.thinkContent += jsonData.content;
      } else {
        container.think = false;
        container.content += jsonData.content;
      }
    },
    onclose() {
      handleDisconnect();
      console.log(`SSE 关闭`);
      if (container.loading) {
        // TODO 增加生成记录
        console.log('SSE 响应完成 保存生成内容', container.content);
      }
    },
    onerror(err) {
      container.loading = false;
      container.ctrl.abort();
      message.error(err);
      console.log(`SSE 错误: ${err.message}`);
      throw err;
    },
  });
};

/**
 * 重新生成
 */
const handleRegenerate = () => {
  resetContainer();
  const url = `${apiURL}/ai/generationTask/sse`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessStore.accessToken}`,
    clientId,
  };
  container.loading = true;
  formState.id = '';
  formState.type = 'hc';
  formState.operationType = 'regenerate';
  generateStatus.value = 'processing';
  sendRequest(url, headers);
};

/**
 * 提交任务
 * @param data
 */
const handleSubmitTask = (data: AiGenerateTask) => {
  if (!formState.noteContent && isMiddleVisible.value) {
    message.error('请导入笔记内容 或者 解析链接');
    return;
  }
  resetContainer();
  const url = `${apiURL}/ai/generationTask/sse`;
  generateStatus.value = 'processing';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessStore.accessToken}`,
    clientId,
  };
  container.loading = true;
  formState.type = 'hc';
  formState.style = data.style;
  formState.model = data.model;
  formState.productId = data.productId;
  formState.operationType = 'generate';
  formState.referenceLatitude = data.referenceLatitude;
  formState.otherLimit = data.otherLimit;
  formState.keywords = data.keywords;
  formState.temperature = data.temperature;
  formState.topP = data.topP;
  formState.competitorIds = data.competitorIds?.join(',') as any;
  sendRequest(url, headers);
};
</script>

<template>
  <Page :auto-content-height="true">
    <div class="page-container">
      <div class="containers-wrapper">
        <div
          class="side-container left"
          :class="{ 'move-to-middle': !isMiddleVisible }"
        >
          <ConfigPanel
            :is-loading="container.loading"
            :is-hide="isMiddleVisible"
            @note-info="handleNoteInfo"
            @stop-task="handleDisconnect"
            @submit-task="handleSubmitTask"
            @hide-note="toggleMiddle"
          />
        </div>
        <transition name="fade">
          <div v-if="isMiddleVisible" class="middle-container">
            <ReferencePanel
              :form-state="formState"
              @clear-note="clearNoteInfo"
              @update-note="updateNoteDesc"
            />
          </div>
        </transition>
        <div
          class="side-container right"
          :class="{ 'move-to-middle': !isMiddleVisible }"
        >
          <GenerationPanel
            :generate-status="generateStatus"
            :container="container"
            @copy="handleCopy"
            @stop="handleDisconnect"
            @regenerate="handleRegenerate"
          />
        </div>
      </div>
    </div>
  </Page>
</template>

<style lang="scss" scoped>
.page-container {
  width: 100%;
  height: 100%;
  display: flex;
  padding: 20px;
  gap: 16px;
  flex-direction: column;
  align-items: center;
}

.containers-wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  position: relative;
}

.side-container,
.middle-container {
  width: 32%;
  height: 100%;
  transition: transform 0.8s ease;
}

/* 淡入动画 */
.fade-enter-active {
  animation: slit-in-diagonal-2 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
  @keyframes slit-in-diagonal-2 {
    0% {
      transform: scaleX(0);
      opacity: 1;
    }
    100% {
      transform: scaleX(1);
      opacity: 1;
    }
  }
}
/* 淡出动画 */
.fade-leave-active {
  @keyframes scale-out-horizontal {
    0% {
      transform: scaleX(1);
      opacity: 1;
    }
    100% {
      transform: scaleX(0);
      opacity: 1;
    }
  }
  animation: scale-out-horizontal 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53)
    both;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 左右容器移动动画 */
.left.move-to-middle {
  transform: translateX(50%);
}

.right.move-to-middle {
  transform: translateX(-50%);
}
</style>
