<script lang="ts" setup>
import { CopyIcon } from '@vben/icons';

import { notification } from 'ant-design-vue';

import { copyToClipboard } from '#/utils/copy';

interface Props {
  generatedComments: Array<string>;
  showResults: 'done' | 'error' | 'init' | 'processing';
}

const props = defineProps<Props>();
const emit = defineEmits(['export']);

const handleCopy = (text: string) => {
  const flag = copyToClipboard(text);
  if (!flag) {
    notification.error({
      message: '操作通知',
      description: '复制失败',
      duration: 1,
      placement: 'topRight',
    });
  }
  notification.success({
    message: '操作通知',
    description: '复制成功',
    duration: 1,
    placement: 'topRight',
  });
};
const handleExport = () => {
  emit('export', props.generatedComments);
};
</script>

<template>
  <div
    class="h-full w-full overflow-y-auto bg-gradient-to-br from-indigo-50 to-violet-50 p-8"
    v-if="props.showResults === 'done'"
  >
    <div class="mb-6 flex items-center">
      <h3
        class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent"
      >
        AI生成评论
      </h3>
      <button
        class="ml-auto flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        @click="handleExport"
      >
        导出全部
      </button>
    </div>
    <div class="comment-box">
      <a-card
        v-for="(comment, index) in props.generatedComments"
        :key="index"
        :body-style="{ padding: '16px' }"
        class="comment-item"
      >
        <span class="mb-2 whitespace-pre-line text-sm text-gray-600">
          {{ comment }}
        </span>
        <div class="comment-action">
          <button
            class="p-1 text-gray-500 transition-colors duration-200 hover:text-gray-900"
            @click="handleCopy(comment)"
          >
            <CopyIcon class="h-4 w-4" />
          </button>
        </div>
      </a-card>
    </div>
  </div>
  <div
    v-else-if="props.showResults === 'processing'"
    class="flex h-full flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 text-gray-500"
  >
    <div class="rounded-xl p-8 text-center shadow-lg">
      <div class="flex animate-pulse flex-col items-center">
        <div
          class="icon-[fa--commenting] mb-4 h-16 w-16 rounded-full bg-indigo-200"
        ></div>
        <div class="mb-2 h-4 w-32 rounded bg-indigo-200"></div>
        <div class="h-3 w-48 rounded bg-indigo-100"></div>
      </div>
      <p class="mt-8 font-medium text-indigo-500">
        正在生成评论，请稍候...
        <i class="icon-[fa--spinner] animate-spin"></i>
      </p>
    </div>
  </div>
  <div
    v-else
    class="flex h-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-gray-500"
  >
    <div class="rounded-xl p-8 text-center shadow-lg">
      <div
        class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100"
      >
        <i class="icon-[fa--commenting] text-3xl text-indigo-300"></i>
      </div>
      <h3 class="mb-2 text-lg font-medium text-gray-700">等待生成评论</h3>
      <p class="text-gray-400">生成的评论将在这里显示</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comment-box {
  columns: 3;
  column-gap: 16px;
  break-inside: avoid; /* 防止卡片在列之间断开 */
}

.comment-box > div {
  break-inside: avoid; /* 确保卡片不会被截断 */
}
.comment-item {
  @apply rounded-lg border border-violet-100 bg-white p-4 shadow-md transition-shadow hover:shadow-lg;
  position: relative;
  overflow: hidden;
}

.comment-item:hover .comment-action {
  opacity: 1;
  transform: translateY(0);
}

.comment-action {
  @apply absolute bottom-2 right-2 flex items-center gap-1;
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.2s ease;
}
.comment-item:not(:first-child) {
  @apply mt-4;
}
</style>
