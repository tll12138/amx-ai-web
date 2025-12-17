<script lang="ts" setup>
import { ref, watch } from 'vue';

import { formatDate } from '@vben/utils';

import { DeleteOutlined, ImportOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const props = defineProps({
  formState: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['clearNote', 'updateNote']);

const isEdited = ref(false);
const editedContent = ref('');
const noteTitle = ref('');
const noteContent = ref('');
// 使用 watch 监听 props.formState 的变化
watch(
  () => props.formState,
  (newVal) => {
    if (newVal) {
      const text = newVal.noteContent || '';
      const index = text.indexOf('\n');
      if (index === -1) {
        noteTitle.value = '';
        noteContent.value = text?.trim() || '';
      } else {
        // 分割为两部分
        const title = text.slice(0, index)?.trim(); // 第一个换行符之前的内容
        console.log('title', title);
        const content = text.slice(index + 1)?.trim(); // 第一个换行符之后的内容
        console.log('content', content);
        noteTitle.value = title || '';
        noteContent.value = content || '';
      }
    }
  },
  { immediate: true, deep: true }, // 确保组件初始化时触发一次
);
const importModalVisible = ref(false);
const importContent = ref('');

const handleImport = () => {
  importContent.value = '';
  importModalVisible.value = true;
};

const handleImportConfirm = () => {
  if (importContent.value) {
    emit('updateNote', importContent.value);
    importModalVisible.value = false;
    message.success('导入成功');
  } else {
    message.warning('请输入要导入的内容');
  }
};

const handleSave = () => {
  if (editedContent.value && isEdited.value) {
    emit('updateNote', editedContent.value);
    isEdited.value = false;
    message.success('保存成功');
  }
};

const handleClear = () => {
  editedContent.value = '';
  emit('clearNote');
  message.success('已清空内容');
};
const hadnleCancel = () => {
  importModalVisible.value = false;
  importContent.value = '';
};

const handleInput = (event: Event) => {
  isEdited.value = true;
  editedContent.value = event?.target?.innerText;
};
</script>

<template>
  <a-modal
    v-model:open="importModalVisible"
    title="导入笔记内容"
    @ok="handleImportConfirm"
    @cancel="hadnleCancel"
  >
    <a-textarea
      v-model:value="importContent"
      placeholder="请输入要导入的笔记内容；标题和内容用换行符分隔；"
      :rows="10"
    />
  </a-modal>

  <div
    class="flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow"
  >
    <!-- 标题 -->
    <div
      class="relative flex items-center justify-between bg-white p-[24px] pb-4"
    >
      <div class="flex items-center">
        <svg
          class="mr-3 h-6 w-6 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M17 2v2m-5-2v2M7 2v2M3.5 16V9c0-2.828 0-4.243.879-5.121C5.257 3 6.672 3 9.5 3h5c2.828 0 4.243 0 5.121.879c.879.878.879 2.293.879 5.121v3c0 4.714 0 7.071-1.465 8.535C17.572 22 15.215 22 10.5 22h-1c-2.828 0-4.243 0-5.121-.879C3.5 20.243 3.5 18.828 3.5 16M8 15h4m-4-5h8"
          />
          <path
            d="M20.5 14.5A2.5 2.5 0 0 1 18 17c-.5 0-1.088-.087-1.573.043a1.25 1.25 0 0 0-.884.884c-.13.485-.043 1.074-.043 1.573A2.5 2.5 0 0 1 13 22"
          />
        </svg>
        <h2
          class="bg-gradient-to-r from-pink-500 to-red-600 bg-clip-text text-2xl font-bold text-transparent"
        >
          参考文章
        </h2>
      </div>
      <div class="flex items-center gap-2">
        <a-button
          v-tippy="{ theme: 'dark', content: '导入内容', duration: 200 }"
          size="small"
          type="text"
          @click="handleImport"
        >
          <template #icon>
            <ImportOutlined />
          </template>
        </a-button>
        <a-button
          v-tippy="{ theme: 'dark', content: '清除笔记内容', duration: 200 }"
          size="small"
          type="text"
          @click="handleClear"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 内容 -->
    <div class="reference-panel flex-1 overflow-y-auto">
      <div v-if="formState.noteContent" class="mx-auto max-w-[439px] p-[24px]">
        <div
          v-if="formState.avatar && formState.nickname"
          class="mb-6 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <div
              class="h-[40px] w-[40px] overflow-hidden rounded-[50%] border border-gray-200"
            >
              <img
                :alt="formState.nickname"
                :src="formState.avatar"
                class="h-full w-full object-cover"
              />
            </div>
            <span class="text-[15px] font-medium leading-[40px] text-gray-800">
              {{ formState.nickname }}
            </span>
          </div>
        </div>

        <div class="space-y-3 text-[16px] leading-relaxed text-gray-800">
          <div
            class="whitespace-pre-wrap"
            contenteditable="true"
            @blur="handleSave"
            @input="handleInput"
          >
            <h1 class="mb-4 text-[18px] font-bold leading-6">
              {{ noteTitle }}
            </h1>
            {{ noteContent }}
          </div>
        </div>
        <div class="ml-3 mt-3 flex items-center text-[13px] text-gray-500">
          <span>
            {{
              formatDate(formState.publishTime, 'MM-DD HH:mm') || '05-20 13:14'
            }}
          </span>
          <span class="mx-2">中国</span>
        </div>
      </div>
      <a-empty
        v-else
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform"
        description="暂未解析小红书笔记内容"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 卡片容器
.reference-panel {
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #fdf2f2 100%);
  box-shadow:
    0 12px 32px rgba(99, 102, 241, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.8);

  &:hover {
    box-shadow:
      0 16px 40px rgba(99, 102, 241, 0.12),
      inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  }

  // 编辑区域样式
  [contenteditable] {
    outline: none;
    min-height: 1em;
    padding: 10px;
    border-radius: 8px;
    transition: all 0.4s ease;

    &:focus {
      background-color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 0 2px rgba(241, 99, 153, 0.3);
    }
  }
}

// 用户头像区域
.user-header {
  @apply flex items-center bg-gradient-to-r from-indigo-50 to-purple-50 p-6;
  border-radius: 24px 24px 0 0;

  .avatar-wrapper {
    @apply relative h-12 w-12;
    .avatar-ring {
      @apply absolute inset-0 rounded-full border-2 border-white shadow-lg;
    }

    .user-avatar {
      @apply z-10 h-full w-full rounded-full object-cover;
    }
  }
}

// 标题样式
.note-title {
  @apply mb-4 flex items-center text-2xl font-bold text-gray-900;
  &::before {
    content: '';
    @apply mr-3 h-6 w-1.5 rounded-full bg-gradient-to-b from-purple-400 to-indigo-600;
  }
}

// 内容排版
.content-text {
  @apply leading-relaxed text-gray-700;
  letter-spacing: 0.02em;

  &::first-letter {
    @apply float-left pr-1 text-3xl font-bold text-indigo-600;
  }
}

// 元信息样式
.meta-item {
  @apply flex items-center text-gray-500;
  svg {
    @apply mr-1.5 h-4 w-4 opacity-75;
  }
}

// 空状态优化
.enhanced-empty {
  ::v-deep(.ant-empty-image) {
    @apply mb-6;
    svg {
      @apply h-32 w-32 text-indigo-100;
    }
  }

  ::v-deep(.ant-empty-description) {
    @apply text-sm text-gray-400;
  }
}

// 微交互动画
.user-avatar,
.meta-icon {
  @apply transition-transform duration-300 hover:scale-110;
}

// 深度样式覆盖
::v-deep(.ant-card-body) {
  @apply h-full;
}
</style>
