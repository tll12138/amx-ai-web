<script setup lang="ts">
import type { AiRespContainer } from '#/views/ai/generationTask/data';

import { ref, watch } from 'vue';
import { Typewriter } from 'vue-element-plus-x';

import { CopyIcon, RefreshIcon } from '@vben/icons';

import { notification } from 'ant-design-vue';

import { copyToClipboard } from '#/utils/copy';

interface Props {
  container: AiRespContainer; // 生成内容
  generateStatus: string; // 字符串
}
const props = defineProps<Props>();
const emit = defineEmits(['regenerate']);

const markdownText = ref(props.container.content);
const activeKeys = ref(props.container.think ? ['1'] : []);

watch(
  () => props.container,
  (newContent: AiRespContainer) => {
    // console.log('newContent', newContent);
    activeKeys.value = newContent.thinkContent && newContent.think ? ['1'] : [];
    markdownText.value = `${newContent.content}`;
  },
  { immediate: true, deep: true },
);
const handleCopy = () => {
  const flag = copyToClipboard(markdownText.value);
  if (!flag) {
    notification.error({
      message: '系统通知',
      description: '复制失败',
      duration: 1,
      placement: 'topRight',
    });
  }
  notification.success({
    message: '系统通知',
    description: '复制成功',
    duration: 1,
    placement: 'topRight',
  });
};

const handleRefresh = () => {
  // Refresh functionality can be implemented here
  emit('regenerate');
};

const scrollToBottom = () => {
  const contentBox = document.querySelector('.content-box');
  if (contentBox) {
    contentBox.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
};

watch(
  () => markdownText.value,
  () => {
    scrollToBottom();
  },
  { immediate: true },
);
watch(
  () => props.generateStatus,
  (newVal) => {
    if (newVal === 'done') {
      scrollToBottom();
    }
  },
  { immediate: true, deep: true },
);
</script>
<template>
  <a-card class="generation-panel overflow-hidden overflow-y-scroll">
    <!-- <div class="flex items-center border-b border-gray-100 pb-4">
      <Sparkles class="mr-3 h-6 w-6 text-purple-500" />
      <h2
        class="bg-gradient-to-r from-black to-black bg-clip-text text-2xl font-bold text-transparent"
      >
        AI内容
      </h2>
    </div> -->
    <div class="content-box" v-if="container.content || container.thinkContent">
      <div style="background-color: transparent">
        <a-collapse
          v-if="container.thinkContent"
          :bordered="false"
          v-model:active-key="activeKeys"
          style="background-color: rgb(238, 238, 238)"
          class="mb-4"
        >
          <a-collapse-panel
            key="1"
            header="思考过程"
            :header-class="{ fontcolor: 'white' }"
          >
            <div class="think-content">{{ container.thinkContent }}</div>
          </a-collapse-panel>
        </a-collapse>
        <Typewriter
          style="padding: 16px"
          :content="markdownText"
          :is-markdown="true"
          :typing="false"
        />
      </div>

      <div v-if="generateStatus === 'done'">
        <a-divider class="m-2" dashed />
        <div class="ml-4 flex gap-3">
          <button
            v-tippy="{ theme: 'dark', content: '复制', duration: 200 }"
            class="hover:scale-120 p-1 text-xl transition-transform duration-200 active:scale-90"
            @click="handleCopy"
          >
            <CopyIcon class="bg-grey-400" />
          </button>
          <button
            v-tippy="{ theme: 'dark', content: '重新生成', duration: 200 }"
            class="hover:scale-120 p-1 text-xl transition-transform duration-200 active:scale-90"
            @click="handleRefresh"
          >
            <RefreshIcon class="bg-grey-400" />
          </button>
        </div>
      </div>
    </div>
    <a-empty
      v-else-if="
        !container.content && !container.thinkContent && !container.loading
      "
      description="暂未生成仿写内容"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform"
    />
    <a-skeleton v-else class="h-full" active :paragraph="{ rows: 21 }" />
  </a-card>
</template>

<style scoped>
.generation-panel {
  height: 100%;
  background: white;
  border-radius: 24px;
  background: linear-gradient(135deg, #eaf3ff 0%, #fafbff 100%);
  box-shadow:
    0 12px 32px rgba(99, 102, 241, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.8);

  &:hover {
    box-shadow:
      0 16px 40px rgba(99, 102, 241, 0.12),
      inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  }
}

.content-box {
  min-height: 300px;
  max-width: 670px;
  border-radius: 4px;
}

.generated-content {
  margin-bottom: 16px;
  line-height: 1.6;
}

.think-content {
  padding: 10px;
  border-radius: 4px;
  color: #666;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 8px;
}
:deep(.markdown-body) {
  background-color: transparent;
}
</style>
