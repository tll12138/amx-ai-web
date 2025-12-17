<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';
import type { RuleObject } from 'ant-design-vue/es/form';

import type { AICommentVO } from './data';

import { onMounted, reactive, ref, watch } from 'vue';

import { GoodsApi } from '#/api/ai/goods';
import { ModelApi } from '#/api/ai/model';
import { C_TYPE } from '#/api/ai/promptStyle';
import ProviderOption from '#/components/AIProvider/ProviderOption.vue';
import { renderTag } from '#/utils/render';

import StyleSelect from '../components/StyleSelect.vue';

interface Props {
  isLoading: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(['generate', 'stopTask']);

const formRef = ref<FormInstance>();
const localFormState = reactive<AICommentVO>({
  id: '',
  style: undefined,
  model: undefined,
  productId: undefined,
  sentiment: 'mixed',
  guideline: 'mixed',
  keywords: [],
  example: undefined,
  commentCount: 10,
  maxWords: 25,
  aiContent: '',
  operationType: '',
  generateStatus: '',
  topP: 0.7,
  temperature: 0.7,
});
// 选项数据
const models = ref<Array<{ description: string; id: string; name: string }>>(
  [],
);
const products = ref<Array<{ label: string; options: any[]; value: string }>>(
  [],
);
const loading = ref(false);
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
  sentiment: [
    {
      required: true,
      message: '请选择情感倾向',
      trigger: 'change',
    },
  ],
  guideline: [
    {
      required: true,
      message: '请选择引导方向',
      trigger: 'change',
    },
  ],
};

watch(
  () => props.isLoading,
  (newVal) => {
    loading.value = newVal;
  },
  { immediate: true, deep: true },
);

function TagRender(props: any) {
  const { label, closable, onClose } = props;
  return renderTag(label, '#c2c9f5', false, closable, onClose);
}

function handleReload(val: string | undefined) {
  if (val && val !== 'ok') {
    localFormState.style = val;
  }
}
function handleModelChange(val: string | undefined) {
  console.log(models.value);
  const model = models.value.find((item) => item.value === val);
  if (model) {
    localFormState.topP = model.topP;
    localFormState.temperature = model.temperature;
  }
}

// 生成评论
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
    emit('generate', { ...localFormState });
  }
};

// 获取选项数据
onMounted(async () => {
  try {
    models.value = await ModelApi.options();
    products.value = await GoodsApi.getSelfProduct();
  } catch (error) {
    console.error('数据加载失败', error);
  }
});
</script>

<template>
  <div class="config-panel">
    <a-form
      :model="localFormState"
      layout="vertical"
      ref="formRef"
      :rules="rules"
    >
      <div class="h-full rounded-xl border border-violet-200 bg-white p-8">
        <h3
          class="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-2xl font-bold text-transparent"
        >
          评论文案生成
        </h3>
        <a-row>
          <a-col :span="11">
            <StyleSelect
              :type="C_TYPE"
              v-model:value="localFormState.style"
              @reload="handleReload"
            />
          </a-col>
          <a-col :span="11" :offset="2">
            <a-form-item label="🤖AI模型" name="model">
              <a-select
                v-model:value="localFormState.model"
                :options="models"
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
        </a-row>

        <a-form-item label="📦选择商品" name="productId">
          <a-select
            v-model:value="localFormState.productId"
            allow-clear
            option-filter-prop="label"
            placeholder="请选择产品"
            show-search
          >
            <a-select-opt-group
              v-for="group in products"
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
          </a-select>
        </a-form-item>

        <div class="mt-8">
          <a-row>
            <a-col :span="13">
              <a-form-item label="😊情感倾向" name="sentiment">
                <a-radio-group v-model:value="localFormState.sentiment">
                  <a-radio-button value="positive">热情推荐</a-radio-button>
                  <a-radio-button value="neutral">中立测评</a-radio-button>
                  <a-radio-button value="mixed">混合</a-radio-button>
                </a-radio-group>
              </a-form-item>
            </a-col>
            <a-col :span="10">
              <a-form-item label="💡引导方式" name="guideline">
                <a-radio-group v-model:value="localFormState.guideline">
                  <a-tooltip title="『xxx效果咋样？』适合用于互动场景">
                    <a-radio-button value="question">提问式</a-radio-button>
                  </a-tooltip>
                  <a-tooltip
                    title="『刚空瓶XX精华！暗沉肌直接亮2个度，素颜敢开原相机了！』适合促进转化场景"
                  >
                    <a-radio-button value="share">分享式</a-radio-button>
                  </a-tooltip>
                  <a-tooltip title="提问式 & 分享式">
                    <a-radio-button value="mixed">混合</a-radio-button>
                  </a-tooltip>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="📏生成范围">
            <a-row>
              <a-col :span="11">
                <a-input-number
                  v-model:value="localFormState.maxWords"
                  :step="5"
                  :min="10"
                  :max="45"
                  addon-before="字数"
                  addon-after="字内"
                />
              </a-col>
              <a-col :span="11" :offset="2">
                <a-input-number
                  v-model:value="localFormState.commentCount"
                  :min="5"
                  :step="5"
                  :max="30"
                  addon-before="条数"
                  addon-after="条"
                />
              </a-col>
            </a-row>
          </a-form-item>
          <a-form-item label="🔍关键词">
            <a-select
              v-model:value="localFormState.keywords"
              :tag-render="TagRender"
              :token-separators="[' ', '\n']"
              allow-clear
              class="w-[80%] transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
              mode="tags"
              placeholder="输入的关键词会适当出现在生成的内容中；使用空格或回车输入;"
              show-search
            />
          </a-form-item>

          <a-form-item label="📝参考示例">
            <div class="flex items-start gap-2">
              <a-textarea
                v-model:value="localFormState.example"
                :auto-size="{ minRows: 2, maxRows: 3 }"
                class="modern-textarea w-full"
                :maxlength="200"
                placeholder="请输入参考评论示例;最多输入200字"
              />
            </div>
          </a-form-item>
        </div>
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
              {{ loading ? 'Stop Generate' : 'Generate Comments' }}
            </span>
            <!-- Keep the hover effect -->
            <span
              class="absolute h-0 w-0 rounded-full bg-white opacity-10 transition-all duration-300 ease-out group-hover:h-60 group-hover:w-60"
            ></span>
          </button>
        </a-col>
      </div>
    </a-form>
  </div>
</template>

<style lang="scss" scoped>
.config-panel {
  height: 100%;
  border-radius: 20px;
}
// 生成按钮
.modern-generate-btn {
  @apply relative inline-flex w-[96%] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:scale-105 hover:from-indigo-700 hover:to-purple-700 active:scale-95;
  &:hover {
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
  }
}
</style>
