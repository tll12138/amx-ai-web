<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';
import type { RuleObject } from 'ant-design-vue/es/form';

import type { AiGenerateTask } from './data.ts';

import { defineEmits, onMounted, reactive, ref, watch } from 'vue';

import { DictEnum } from '@vben/constants';

import { message, Select } from 'ant-design-vue';

import { GoodsApi } from '#/api/ai/goods';
import { KeywordsApi } from '#/api/ai/keywords';
import { ModelApi } from '#/api/ai/model';
import { HC_TYPE } from '#/api/ai/promptStyle';
import { UtilApi } from '#/api/ai/util';
import ProviderOption from '#/components/AIProvider/ProviderOption.vue';
import { getDictOptions } from '#/utils/dict';
import { renderTag } from '#/utils/render';
import StyleSelect from '#/views/ai/components/StyleSelect.vue';

interface Props {
  isLoading: boolean;
  isHide: boolean;
}

const props = defineProps<Props>();
// 使用 defineProps 并指定类型
const emit = defineEmits(['noteInfo', 'submitTask', 'stopTask', 'hideNote']);
// 创建本地副本
const localFormState = reactive<AiGenerateTask>({
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
  temperature: undefined,
  topP: undefined,
});
const noteUrl = ref('');
const loading = ref(false);
const visible = ref(true);
const formRef = ref<FormInstance>();
const modelOptions = ref([] as any[]);
const rules: Record<string, RuleObject[]> = {
  style: [
    {
      required: true,
      message: '请选择内容风格',
      trigger: 'change',
    },
  ],
  model: [
    {
      required: true,
      message: '请选择AI模型',
      trigger: 'change',
    },
  ],
  productId: [
    {
      required: true,
      message: '请选择品牌产品',
      trigger: 'change',
    },
  ],
};
const keywordList = ref([] as any[]);

watch(
  () => props.isLoading,
  (newVal) => {
    loading.value = newVal;
  },
  { immediate: true, deep: true },
);

watch(
  () => props.isHide,
  (newVal) => {
    console.log('visible', newVal);
    visible.value = newVal;
  },
  { immediate: true, deep: true },
);

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch (error) {
    console.error(error);
    return;
  }
  if (props.isLoading) {
    emit('stopTask');
  } else {
    emit('submitTask', { ...localFormState });
  }
};

const getNoteInfo = async (value: string) => {
  console.log('getNoteInfo', value);
  if (!value) {
    message.error('请输入参考小红书笔记链接');
    return;
  }
  const param = { url: value };
  const noteInfo = await UtilApi.handleXhsUrl(param);
  if (noteInfo) {
    localFormState.noteId = noteInfo.noteId;
    message.success('解析成功');
    emit('noteInfo', noteInfo);
  }
};
const productOptions = ref([] as any[]);
const competitorOptions = ref([]);

const changeCompetitorOptions = async (value: any, options: any) => {
  console.log('changeCompetitorOptions', value, options);
  if (!value) {
    return;
  }
  competitorOptions.value = await GoodsApi.getCompetitorOptions(value);
  keywordList.value = await KeywordsApi.options(value);
  localFormState.keywords = [];
  localFormState.competitorIds = [];
};

const keywordsChanged = async (value: any) => {
  console.log(value);
  if (value && value.length >= 15) {
    message.error('最多选择15个关键词');
    value.pop();
  }
};

function tagRender(props: any) {
  const { label, closable, onClose } = props;
  return renderTag(label, 'processing', false, closable, onClose);
}

function handleReload(val: string | undefined) {
  if (val && val !== 'ok') {
    localFormState.style = val;
  }
}

function handleModelChange(val: string | undefined) {
  const model = modelOptions.value.find((item) => item.value === val);
  if (model) {
    localFormState.topP = model.topP;
    localFormState.temperature = model.temperature;
  }
}

onMounted(() => {
  GoodsApi.getSelfProduct().then((res) => {
    productOptions.value = res;
  });
  ModelApi.options().then((res) => {
    modelOptions.value = res;
  });
});
</script>

<template>
  <a-card class="config-panel overflow-y-scroll">
    <!-- 标题区域 -->
    <div
      class="mb-6 flex items-center justify-between border-b border-gray-100 pb-4"
    >
      <div class="flex items-center">
        <svg
          class="mr-3 h-6 w-6 text-indigo-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M13 10V3L4 14h7v7l9-11h-7z"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          />
        </svg>
        <h2
          class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent"
        >
          横测配置
        </h2>
      </div>
      <a-switch
        class="ml-2"
        v-model:checked="visible"
        @change="
          (checked) => {
            emit('hideNote', checked);
          }
        "
      />
    </div>

    <a-form
      ref="formRef"
      :model="localFormState"
      :rules="rules"
      layout="vertical"
    >
      <a-row>
        <!-- 内容风格 -->
        <a-col :span="11">
          <StyleSelect
            v-model:value="localFormState.style"
            @reload="handleReload"
            :type="HC_TYPE"
          />
        </a-col>

        <!-- AI模型 -->
        <a-col :offset="2" :span="11">
          <a-form-item label="🤖AI模型" name="model">
            <a-select
              v-model:value="localFormState.model"
              :options="modelOptions"
              @select="handleModelChange"
              placeholder="请选择模型"
            >
              <template #option="{ label, provider }">
                <ProviderOption :label="label" :value="provider" />
              </template>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :span="11">
          <a-form-item
            label="🔥模型随机性"
            name="temperature"
            tooltip="数值越高，输出内容越随机"
          >
            <a-input-number
              v-model:value="localFormState.temperature"
              placeholder="请输入模型随机性"
              class="w-full"
              :step="0.1"
              :min="0"
              :max="1"
            />
          </a-form-item>
        </a-col>
        <a-col :span="11" :offset="2">
          <a-form-item
            label="✨生成多样性"
            name="topP"
            tooltip="数值越高，输出内容越多样性"
          >
            <a-input-number
              v-model:value="localFormState.topP"
              placeholder="请输入模型Top_p"
              class="w-full"
              :step="0.1"
              :min="0"
              :max="1"
            />
          </a-form-item>
        </a-col>

        <!-- 参考链接 -->
        <a-col :span="24">
          <a-form-item label="🔗参考链接" name="noteId" :disabled="!visible">
            <div class="flex items-center justify-between">
              <a-input
                :disabled="!visible"
                v-model:value="noteUrl"
                :loading="false"
                allow-clear
                placeholder="请输入参考小红书笔记链接"
                size="middle"
                style="width: 80%"
              />

              <button
                :disabled="!visible"
                class="group relative inline-flex items-center justify-center overflow-hidden rounded bg-gradient-to-br from-indigo-600 to-purple-600 px-4 py-1 font-medium text-white hover:from-indigo-700 hover:to-purple-700"
                @click="getNoteInfo(noteUrl)"
              >
                <span class="relative flex items-center"> 解 析 </span>
                <span
                  class="absolute h-0 w-0 rounded-full bg-white opacity-10 transition-all duration-300 ease-out group-hover:h-32 group-hover:w-32"
                ></span>
              </button>
            </div>
          </a-form-item>
        </a-col>

        <!-- 品牌产品 -->
        <a-col :span="24">
          <a-form-item label="📦品牌产品" name="productId">
            <Select
              v-model:value="localFormState.productId"
              allow-clear
              option-filter-prop="label"
              placeholder="请选择产品"
              show-search
              @change="changeCompetitorOptions"
            >
              <a-select-opt-group
                v-for="group in productOptions"
                :key="group.label"
                :label="group.label"
              >
                <a-select-option
                  v-for="item in group.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                  {{ item.label }}
                </a-select-option>
              </a-select-opt-group>
            </Select>
          </a-form-item>
        </a-col>

        <!-- 竞品相关 -->
        <a-col :span="17">
          <a-form-item label="🧾竞品">
            <a-select
              v-model:value="localFormState.competitorIds"
              :max-tag-count="4"
              :options="competitorOptions"
              :tag-render="tagRender"
              mode="multiple"
              placeholder="请选择所选产品绑定的竞品"
            />
          </a-form-item>
        </a-col>

        <a-col :offset="1" :span="6">
          <a-form-item label="🌀竞品对比维度">
            <a-select
              v-model:value="localFormState.referenceLatitude"
              :options="getDictOptions(DictEnum.AI_REFERENCE_LATITUDE)"
              allow-clear
              placeholder="对比维度"
            />
          </a-form-item>
        </a-col>

        <a-col :span="24">
          <a-form-item label="🏷️埋词" name="keywords">
            <Select
              v-model:value="localFormState.keywords"
              allow-clear
              option-filter-prop="label"
              placeholder="请选择关键词"
              show-search
              mode="tags"
              :max-tag-count="6"
              :tag-render="tagRender"
              @change="keywordsChanged"
              option-label-prop="label"
            >
              <a-select-opt-group
                v-for="group in keywordList"
                :key="group.label"
                :label="group.label"
              >
                <a-select-option
                  v-for="item in group.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.label"
                >
                  <div class="flex items-center justify-between">
                    <span>{{ item.label }}</span>
                    <span>
                      {{ item.other }}
                      <FireOutlined
                        v-if="Number(item.other) > 100000"
                        class="ml-1 text-red-600"
                      />
                    </span>
                  </div>
                </a-select-option>
              </a-select-opt-group>
            </Select>
          </a-form-item>
        </a-col>

        <!-- 额外要求 -->
        <a-col :span="24">
          <a-form-item label="🥺额外要求">
            <div class="flex items-start gap-2">
              <a-textarea
                v-model:value="localFormState.otherLimit"
                :auto-size="{ minRows: 2, maxRows: 3 }"
                class="modern-textarea w-full"
                :maxlength="800"
                placeholder="请输入额外要求;最多输入800字"
              />
            </div>
          </a-form-item>
        </a-col>

        <!-- 生成按钮 -->
        <a-col :offset="1" :span="23">
          <button class="modern-generate-btn group" @click="handleSubmit">
            <!-- Show loading spinner when loading -->
            <svg
              v-if="loading"
              class="mr-2 h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
              />
            </svg>
            <!-- Original icon when not loading -->
            <svg
              v-else
              class="mr-2 h-5 w-5 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
            <!-- Change text based on loading state -->
            <span class="relative flex items-center">
              {{ loading ? 'Stop Generate' : 'Generate Content' }}
            </span>
            <!-- Keep the hover effect -->
            <span
              class="absolute h-0 w-0 rounded-full bg-white opacity-10 transition-all duration-300 ease-out group-hover:h-60 group-hover:w-60"
            ></span>
          </button>
        </a-col>
      </a-row>
    </a-form>
  </a-card>
</template>

<style lang="scss" scoped>
.config-panel {
  height: 100%;
  border-radius: 20px;
  border: 1px solid rgba(99, 102, 241, 0.12);
  background: linear-gradient(135deg, #fafcff 0%, #f3f8ff 80%);
}

// 解析链接按钮
.link-parse-btn {
  @apply flex items-center rounded-lg border border-indigo-100 bg-white px-4 py-1 text-indigo-600 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md;
}

// 表单标签样式
:deep(.ant-form-item-label > label) {
  @apply text-[14px] font-semibold uppercase tracking-wide text-gray-600;
}

// 生成按钮
.modern-generate-btn {
  @apply relative inline-flex w-[96%] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:scale-105 hover:from-indigo-700 hover:to-purple-700 active:scale-95;
  &:hover {
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
  }
}
:deep(.ant-select-selection-overflow-item .ant-select-selection-item) {
  background-color: #e6f6ff;
  color: #006be6;
  border: none;
}
</style>
