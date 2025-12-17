<!-- eslint-disable prettier/prettier -->
<script lang="ts" setup>
import type { AiTaskHistory } from './data.ts';

import { computed, nextTick, onMounted, ref } from 'vue';
import { Typewriter } from 'vue-element-plus-x';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { GenerationTaskApi } from '#/api/ai/generationTask';
import { copyToClipboard } from '#/utils/copy.js';

// 搜索和过滤
const searchQuery = ref('');
const activeFilter = ref('all');
const filters = [
  { label: '全部', value: 'all' },
  { label: '横测', value: 'hc' },
  { label: '种草', value: 'zc' },
  { label: '最近三天', value: 'recent3' },
  { label: '最近一周', value: 'recent7' },
];
// 示例数据
const historyRecords = ref([]);
// 检查记录是否匹配搜索条件
const matchesSearchQuery = (record: AiTaskHistory): boolean => {
  return (
    searchQuery.value === '' ||
    record.productName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
};

// 检查记录是否匹配当前筛选条件
const matchesActiveFilter = (record: AiTaskHistory): boolean => {
  if (activeFilter.value === 'recent3') {
    // 最近一周的记录
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recordDate = new Date(record.createTime);
    return recordDate >= threeDaysAgo;
  }
  if (activeFilter.value === 'recent7') {
    // 最近一周的记录
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recordDate = new Date(record.createTime);
    return recordDate >= oneWeekAgo;
  }
  if (activeFilter.value === 'all') {
    return true;
  }
  // 按模型过滤
  return record.type === activeFilter.value;
};

// 计算过滤后的记录
const filteredRecords = computed(() => {
  if (!historyRecords.value) return [];
  return historyRecords.value.filter(
    (record: AiTaskHistory) =>
      matchesSearchQuery(record) && matchesActiveFilter(record),
  ) as AiTaskHistory[];
});
// 选中的记录
const selectedRecord = ref(null as unknown as AiTaskHistory);
const showExtraRequirements = ref(false);
const showCompetitors = ref(false);
// 同步滚动
const referenceContentRef = ref(null);
const aiContentRef = ref(null);
let isScrolling = false;
function selectRecord(record: AiTaskHistory) {
  selectedRecord.value = record;
  showExtraRequirements.value = false;
  showCompetitors.value = false;
  // 重置滚动位置
  nextTick(() => {
    if (referenceContentRef.value) referenceContentRef.value.scrollTop = 0;
    if (aiContentRef.value) aiContentRef.value.scrollTop = 0;
  });
}
function handleGetCompetitors(id: string) {
  if(showCompetitors.value){
    showCompetitors.value = false;
    return;
  }
  if (selectedRecord.value.competitors) {
    showCompetitors.value = true;
    return;
  }
  GenerationTaskApi.getCompetitors(id).then((res: string[]) => {
    selectedRecord.value.competitors = res;
    showCompetitors.value = true;
  });
}

function syncScroll(source: string) {
  if (isScrolling) return;
  isScrolling = true;
  if (
    source === 'reference' &&
    referenceContentRef.value &&
    aiContentRef.value
  ) {
    const scrollPercentage =
      referenceContentRef.value.scrollTop /
      (referenceContentRef.value.scrollHeight -
        referenceContentRef.value.clientHeight);
    aiContentRef.value.scrollTop =
      scrollPercentage *
      (aiContentRef.value.scrollHeight - aiContentRef.value.clientHeight);
  } else if (
    source === 'ai' &&
    referenceContentRef.value &&
    aiContentRef.value
  ) {
    const scrollPercentage =
      aiContentRef.value.scrollTop /
      (aiContentRef.value.scrollHeight - aiContentRef.value.clientHeight);
    referenceContentRef.value.scrollTop =
      scrollPercentage *
      (referenceContentRef.value.scrollHeight -
        referenceContentRef.value.clientHeight);
  }
  setTimeout(() => {
    isScrolling = false;
  }, 50);
}
onMounted(() => {
  GenerationTaskApi.getAll().then((res) => {
    console.log(res);
    historyRecords.value = res;
  });
});
// 复制到剪贴板
async function copy(text: string, type: string) {
  const flag = await copyToClipboard(text);
  if (flag) {
    message.success(`${type}复制成功`);
  }else{
    message.error(`${type}复制失败`);
  }
}
</script>

<template>
  <Page :auto-content-height="true">
    <div
      class="h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800"
    >
      <!-- 主容器 -->
      <div class="flex h-full flex-col">
        <!-- 主要内容区域 -->
        <div class="flex h-full gap-6 overflow-hidden">
          <!-- 左侧历史记录列表 -->
          <div
            class="flex w-1/5 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div class="border-b border-slate-200 p-4">
              <div class="mb-4">
                <h1
                  class="flex items-center bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-2xl font-bold text-transparent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="mr-2 h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="url(#history-icon-gradient)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <defs>
                      <linearGradient
                        id="history-icon-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stop-color="#60a5fa" />
                        <stop offset="100%" stop-color="#a855f7" />
                      </linearGradient>
                    </defs>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  历史记录
                </h1>
              </div>
              <div class="relative">
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="搜索产品名称历史记录..."
                  class="w-full rounded-sm border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:ring-2"
                />
                <i
                  class="icon-[iconamoon--search-light] absolute left-3 top-1/2 -translate-y-1/2 transform text-slate-400"
                ></i>
              </div>
              <div class="mt-3 flex gap-2">
                <button
                  v-for="(filter, index) in filters"
                  :key="index"
                  @click="activeFilter = filter.value"
                  class="!rounded-button cursor-pointer whitespace-nowrap rounded-sm px-3 py-1 text-xs"
                  :class="[
                    activeFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ]"
                >
                  {{ filter.label }}
                </button>
              </div>
            </div>
            <div class="custom-scrollbar flex-1 overflow-y-auto">
              <div
                v-for="(record, index) in filteredRecords"
                :key="index"
                @click="selectRecord(record)"
                class="cursor-pointer border-b border-slate-200 p-4 transition-all duration-300 hover:bg-slate-50"
                :class="[
                  selectedRecord?.id === record.id
                    ? 'border-l-4 border-l-blue-500 bg-slate-50'
                    : '',
                ]"
              >
                <div class="mb-2 flex items-start justify-between">
                  <h3 class="truncate font-medium">{{ record.productName }}</h3>
                  <span class="text-xs text-slate-500">{{
                    record.createTime
                      ? dayjs(record.createTime).format('MM-DD HH:mm')
                      : '--:--'
                  }}</span>
                </div>
                <p class="line-clamp-2 text-ellipsis text-sm text-slate-500">
                  {{ record.aiContent }}
                </p>
                <div class="mt-2 flex gap-2">
                  <span
                    :class="[
                      record.type === 'zc'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-blue-50 text-blue-600',
                    ]"
                    class="flex items-center rounded-sm px-2 py-0.5 text-xs"
                  >
                    {{ record.type === 'zc' ? '种草' : '横测' }}
                  </span>
                  <span
                    class="flex items-center rounded-sm bg-purple-50 px-2 py-0.5 text-xs text-purple-600"
                  >
                    <i class="icon-[fa--paint-brush] mr-1"></i>
                    {{ record.styleName }}
                  </span>
                  <span
                    class="flex items-center rounded-sm bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
                  >
                    <span class="icon-[jam--microchip] mr-1"></span>
                    {{ record.modelName }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- 右侧详细内容 -->
          <div
            class="flex w-4/5 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div
              v-if="selectedRecord"
              class="flex flex-1 flex-col overflow-hidden"
            >
              <!-- 基本信息 -->
              <div class="border-b border-slate-200 bg-white p-6">
                <div class="flex items-start justify-between">
                  <h2 class="mb-4 text-2xl font-bold text-slate-800">
                    {{ selectedRecord.productName }}
                  </h2>
                  <span class="text-sm text-slate-500">{{
                    selectedRecord.createTime
                  }}</span>
                </div>
                <div class="mb-4 flex flex-wrap gap-2">
                  <span
                    :class="[
                      selectedRecord.type === 'zc'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-blue-50 text-blue-600',
                    ]"
                    class="flex items-center rounded-sm px-2 py-0.5 text-sm"
                  >
                    {{ selectedRecord.type === 'zc' ? '种草' : '横测' }}
                  </span>
                  <span
                    class="flex items-center rounded-sm bg-purple-50 px-3 py-1 text-sm text-purple-600"
                  >
                    <i class="icon-[fa--paint-brush] mr-1"></i> 风格:
                    {{ selectedRecord.styleName }}
                  </span>
                  <span
                    class="flex items-center rounded-sm bg-blue-50 px-3 py-1 text-sm text-blue-600"
                  >
                    <span class="icon-[jam--microchip] mr-1"></span>
                    模型: {{ selectedRecord.modelName }}
                  </span>
                  <span
                    v-if="selectedRecord.referenceLatitude"
                    class="flex items-center rounded-sm bg-cyan-50 px-3 py-1 text-sm text-cyan-600"
                  >
                    <i
                      class="icon-[icon-park-outline--two-dimensional-code] mr-1"
                    ></i>
                    对比维度:
                    {{ selectedRecord.referenceLatitude }}
                  </span>
                  <button
                    @click="showExtraRequirements = !showExtraRequirements"
                    class="!rounded-button flex cursor-pointer items-center whitespace-nowrap rounded-sm bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
                  >
                    <i
                      class="mr-1 text-sm"
                      :class="[
                        showExtraRequirements
                          ? 'icon-[icon-park-outline--up]'
                          : 'icon-[icon-park-outline--down]',
                      ]"
                    ></i>
                    额外要求
                  </button>
                  <button
                    v-if="selectedRecord.type !== 'zc'"
                    @click="handleGetCompetitors(selectedRecord.id)"
                    class="!rounded-button flex cursor-pointer items-center whitespace-nowrap rounded-sm bg-yellow-100 px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-200"
                  >
                    <i
                      class="mr-1 text-sm"
                      :class="[
                        showCompetitors
                          ? 'icon-[icon-park-outline--up]'
                          : 'icon-[icon-park-outline--down]',
                      ]"
                    ></i>
                    竞品信息
                  </button>
                </div>
                <div
                  v-if="showExtraRequirements"
                  class="animate-fadeIn rounded-sm bg-slate-50 p-4 text-sm text-slate-700"
                >
                  <p>额外要求：{{ selectedRecord.otherLimit || '无' }}</p>
                </div>
                <div
                  v-if="showCompetitors"
                  class="animate-fadeIn mt-2 rounded-sm bg-slate-50 p-4 text-sm text-slate-700"
                >
                  <p
                    v-if="
                      !selectedRecord.competitors ||
                      selectedRecord.competitors.length === 0
                    "
                  >
                    竞品信息：无
                  </p>
                  <template v-else>
                    <div class="mt-2 flex flex-wrap items-center gap-2">
                      竞品信息：
                      <span
                        v-for="(
                          competitor, index
                        ) in selectedRecord.competitors"
                        :key="index"
                        class="inline-flex items-center rounded-sm bg-yellow-50 px-3 py-1 text-sm text-yellow-600"
                      >
                        {{ competitor }}
                      </span>
                    </div>
                  </template>
                </div>
              </div>
              <!-- 内容展示区 -->
              <div class="h-full flex-1 overflow-hidden">
                <!-- 有仿写内容时的左右对比布局 -->
                <div v-if="selectedRecord.noteContent" class="flex h-full">
                  <div class="relative w-1/2 border-r border-blue-500/50">
                    <div class="flex h-full flex-col p-6">
                      <div class="flex justify-between">
                        <h3
                          class="flex items-center text-lg font-bold text-red-500"
                        >
                          <i class="fas fa-pen-fancy mr-2"></i> 参考内容
                        </h3>
                        <button
                          @click="copy(selectedRecord.noteContent, '参考内容')"
                          class="!rounded-button flex cursor-pointer items-center whitespace-nowrap rounded-sm bg-slate-100 px-3 text-sm text-slate-600 hover:bg-slate-200"
                        >
                          <i
                            class="icon-[icon-park-outline--copy] mr-1 text-sm"
                          ></i>
                          复制
                        </button>
                      </div>
                      <div
                        ref="referenceContentRef"
                        class="custom-scrollbar flex-1 overflow-y-auto p-4"
                        @scroll="syncScroll('reference')"
                      >
                        <div
                          class="whitespace-pre-wrap p-4"
                          v-html="selectedRecord.noteContent"
                        ></div>
                      </div>
                    </div>
                    <!-- 中间分隔线的呼吸灯效果 -->
                    <div
                      class="absolute right-0 top-1/2 h-20 w-1 -translate-y-1/2 translate-x-1/2 transform"
                    >
                      <div
                        class="h-full w-full animate-pulse rounded-sm bg-blue-500/100"
                      ></div>
                    </div>
                  </div>
                  <div class="w-1/2">
                    <div class="flex h-full flex-col p-6">
                      <div class="flex justify-between">
                        <h3
                          class="flex items-center text-lg font-bold text-purple-400"
                        >
                          <i class="fas fa-robot mr-2"></i> AI 生成内容
                        </h3>
                        <button
                          @click="copy(selectedRecord.aiContent, 'AI 生成内容')"
                          class="!rounded-button flex cursor-pointer items-center whitespace-nowrap rounded-sm bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
                        >
                          <i
                            class="icon-[icon-park-outline--copy] mr-1 text-sm"
                          ></i>
                          复制
                        </button>
                      </div>
                      <div
                        ref="aiContentRef"
                        class="custom-scrollbar flex-1 overflow-y-auto p-4"
                        @scroll="syncScroll('ai')"
                      >
                        <Typewriter
                          style="padding: 16px"
                          :content="selectedRecord.aiContent"
                          :is-markdown="true"
                          :typing="false"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 无仿写内容时的全宽布局 -->
                <div v-else class="flex h-full flex-col p-6">
                  <div class="flex justify-between">
                    <h3
                      class="flex items-center text-lg font-bold text-purple-400"
                    >
                      <i class="fas fa-robot mr-2"></i> AI 生成内容
                    </h3>
                    <button
                      @click="copy(selectedRecord.aiContent, 'AI 生成内容')"
                      class="!rounded-button flex cursor-pointer items-center whitespace-nowrap rounded-sm bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
                    >
                      <i
                        class="icon-[icon-park-outline--copy] mr-1 text-sm"
                      ></i>
                      复制
                    </button>
                  </div>
                  <div
                    ref="aiContentRef"
                    class="custom-scrollbar flex-1 overflow-y-auto"
                    @scroll="syncScroll('ai')"
                  >
                    <Typewriter
                      style="padding: 16px"
                      :content="selectedRecord.aiContent"
                      :is-markdown="true"
                      :typing="false"
                    />
                  </div>
                </div>
              </div>
            </div>
            <!-- 未选择记录时的提示 -->
            <div
              v-else
              class="flex flex-1 flex-col items-center justify-center text-gray-500"
            >
              <p class="text-xl">请从左侧选择一条历史记录</p>
              <p class="mt-2 text-sm">选择后将在此处显示详细内容</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.7);
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
