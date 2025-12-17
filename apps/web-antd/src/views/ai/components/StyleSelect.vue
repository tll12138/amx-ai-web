<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  CheckOutlined,
  CopyOutlined,
  EditOutlined,
} from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';

// 移除ExtraModal组件导入
import { PromptStyleApi } from '#/api/ai/promptStyle';

const props = defineProps<{
  disabled?: boolean;
  type?: string;
  value?: string;
}>();

const emit = defineEmits<{
  (e: 'update:value', val: string): void;
  (e: 'reload', val: string): void;
}>();

/** 获取风格选项列表 */
const searchKeyword = ref('');
const promptStyleOptions = ref([] as any[]);
// 新增模态框打开状态
const modalVisible = ref(false);
const currentPreviewStyle = ref<any>(null);
// 新增临时选中的风格ID
const selectedStyle = ref<null | string>(null);
// 新增编辑模式状态
const editMode = ref(false);
const isDirty = ref(false); // 跟踪表单脏数据状态
const currentEditId = ref('');
// 新增表单状态管理
const formState = ref({
  id: '',
  name: '',
  description: '',
  prompt: '',
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入风格名称' },
    { max: 10, message: '最多10个字符' },
    { min: 1, message: '至少1个字符' },
  ],
  prompt: [{ required: true, message: '请输入提示词模板' }],
};

// 过滤后的风格选项
const filteredOptions = computed(() => {
  return promptStyleOptions.value.filter((option) => {
    const keyword = searchKeyword.value.toLowerCase();
    return option.name.toLowerCase().includes(keyword);
  });
});

/** 重新加载风格列表 */
const reloadStyle = async () => {
  const res = await PromptStyleApi.options(props.type);
  promptStyleOptions.value = res;
};

// 修改选择处理逻辑
const handleSelectStyle = (value: string) => {
  if (currentPreviewStyle.value && currentPreviewStyle.value.id === value) {
    return;
  }
  if (editMode.value && isDirty.value) {
    Modal.confirm({
      title: '未保存修改',
      content: '当前编辑内容尚未保存，确定要切换吗？',
      okText: '保存并切换',
      cancelText: '取消并切换',
      centered: true,
      closable: true,
      onOk: () => {
        editMode.value = false;
        isDirty.value = false;
        // 保存
        saveEdit();
        selectedStyle.value = value;
        currentPreviewStyle.value = promptStyleOptions.value.find(
          (item) => item.id === value,
        );
      },
      onCancel: () => {
        editMode.value = false;
        isDirty.value = false;
        selectedStyle.value = value;
        currentPreviewStyle.value = promptStyleOptions.value.find(
          (item) => item.id === value,
        );
      },
    });
  } else {
    editMode.value = false;
    selectedStyle.value = value;
    currentPreviewStyle.value = promptStyleOptions.value.find(
      (item) => item.id === value,
    );
  }
};

/** 保存编辑 */
function saveEdit() {
  const params = {
    id: formState.value.id,
    name: formState.value.name,
    prompt: formState.value.prompt,
    description: formState.value.description,
  };
  PromptStyleApi.update(params).then(() => {
    reloadStyle();
  });
}

/** 保存修改 */
const handleUpdate = () => {
  if (isDirty.value) {
    // 保存
    saveEdit();
  }
  editMode.value = false;
};

// 新增确认处理
const handleConfirm = () => {
  if (selectedStyle.value) {
    emit('update:value', selectedStyle.value);
    emit('reload', selectedStyle.value);
  }
  modalVisible.value = false;
  selectedStyle.value = null;
};

const handleCopyStyle = async (id: string) => {
  const style = promptStyleOptions.value.find((item) => item.id === id);
  const res = await PromptStyleApi.create({
    name: `${style.name}_副本`,
    description: style.description,
    prompt: style.prompt,
    orders: style.orders,
    type: style.type,
  });
  await reloadStyle();
  selectedStyle.value = res;
  currentPreviewStyle.value = promptStyleOptions.value.find(
    (item) => item.id === res,
  );
};

// 新增表单值变化处理
const doubleClick = (value: string) => {
  selectedStyle.value = value;
  currentPreviewStyle.value = promptStyleOptions.value.find(
    (item) => item.id === value,
  );
  handleConfirm();
};

// 新增取消处理
const handleReset = () => {
  selectedStyle.value = null;
  formState.value = {
    id: '',
    name: '',
    description: '',
    prompt: '',
  };
  isDirty.value = false;
  currentPreviewStyle.value = null;
};

// 加载编辑数据
const loadEditData = async (id: string) => {
  const data = await PromptStyleApi.getDetail(id);
  formState.value = { ...data };
};

// 修改handleEdit方法
const handleEdit = (id: string) => {
  currentEditId.value = id;
  editMode.value = true;
  if (id) {
    loadEditData(id);
  } else {
    formState.value = {
      id: '',
      name: '',
      description: '',
      prompt: '',
    };
  }
};

watch(
  () => modalVisible.value,
  (value) => {
    if (!value) {
      handleReset();
    }
    if (modalVisible.value && !!promptStyleOptions.value) {
      reloadStyle();
    }
  },
);
</script>

<template>
  <a-form-item label="🎨内容风格" name="style">
    <a-button
      :class="{
        'border-dashed text-gray-400 hover:border-blue-300': !props.value,
        'border-solid border-blue-200 bg-blue-50 hover:bg-blue-100':
          props.value,
      }"
      class="h-9 w-full text-left transition-colors"
      @click="modalVisible = true"
    >
      {{
        props.value
          ? promptStyleOptions.find((i) => i.id === props.value)?.name
          : '+ 点击选择内容风格'
      }}
    </a-button>

    <a-modal
      v-model:open="modalVisible"
      :footer="null"
      width="1000px"
      wrap-class-name="style-select-modal"
    >
      <template #title>
        <div class="mt-4 flex justify-between">
          <span>请选择内容风格</span>
          <div class="mr-10">
            <a-button v-if="!editMode" class="mr-2 text-[14px]" disabled text>
              预览中
            </a-button>
            <a-button
              type="primary"
              v-if="editMode"
              class="mr-2 text-[14px]"
              @click="handleUpdate"
            >
              保存
            </a-button>
          </div>
        </div>
      </template>
      <div class="flex h-[640px] overflow-hidden rounded-lg bg-white">
        <div
          class="w-1/4 overflow-y-scroll border-r border-gray-100 bg-gradient-to-b from-blue-50/50 to-white"
        >
          <div class="space-y-1 p-3">
            <div
              class="sticky top-0 z-10 -mx-3 -mt-3 border-b border-gray-100 bg-white/95 px-3 pt-3 backdrop-blur-sm"
            >
              <a-input
                v-model:value="searchKeyword"
                placeholder="搜索风格名称"
                class="mb-2 w-full"
                allow-clear
              />
            </div>
            <div
              v-for="item in filteredOptions"
              :key="item.id"
              :class="{
                'z-10 border-2 border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200':
                  item.id === selectedStyle,
                'border-transparent transition-all hover:shadow-sm':
                  item.id !== selectedStyle,
              }"
              class="cursor-pointer rounded-lg bg-white/80 p-3 backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-white"
              @click="handleSelectStyle(item.id)"
              @dblclick="doubleClick(item.id)"
            >
              <div class="flex items-center gap-2">
                <svg
                  class="h-4 w-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
                  class="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-gray-900"
                  >{{ item.name }}
                </span>
              </div>
              <div
                class="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-500"
              >
                {{ item.description }}
              </div>
            </div>
          </div>
        </div>
        <div class="relative w-3/4 px-6 py-2">
          <transition name="fade-mode" mode="out-in">
            <div
              v-if="!editMode"
              key="preview"
              class="preview-card overflow-y-scroll"
            >
              <div v-if="currentPreviewStyle">
                <!-- 在预览标题右侧添加编辑按钮 -->
                <div class="preview-header">
                  <h2 class="preview-title">{{ currentPreviewStyle.name }}</h2>

                  <div class="preview-actions">
                    <button
                      class="custom-btn edit-btn"
                      @click="handleEdit(currentPreviewStyle.id)"
                    >
                      <EditOutlined class="mr-2" />
                      编辑
                    </button>
                    <button class="custom-btn use-btn" @click="handleConfirm">
                      <CheckOutlined class="mr-2" />
                      应用
                    </button>
                    <a-popconfirm
                      title="确定要复制该风格吗？"
                      trigger="click"
                      ok-text="确认"
                      cancel-text="取消"
                      @confirm="handleCopyStyle(currentPreviewStyle.id)"
                    >
                      <button class="custom-btn copy-btn">
                        <CopyOutlined class="mr-2" />
                        复制
                      </button>
                    </a-popconfirm>
                  </div>
                </div>

                <p class="preview-description">
                  {{ currentPreviewStyle.description }}
                </p>

                <div class="preview-section">
                  <h3 class="preview-section-title">提示词:</h3>
                  <p
                    class="preview-keywords max-h-[360px] overflow-y-scroll rounded border p-4"
                  >
                    {{ currentPreviewStyle.prompt }}
                  </p>
                </div>

                <div class="preview-section">
                  <h3 class="preview-section-title">类型:</h3>
                  <div class="preview-actions">
                    <span
                      v-for="item in currentPreviewStyle.type.split(',')"
                      :key="item"
                      class="preview-tag"
                    >
                      {{ item }}
                    </span>
                  </div>
                </div>
              </div>
              <div
                class="align-center flex justify-center"
                v-if="!currentPreviewStyle && !editMode"
              >
                <a-empty
                  description="请选择内容风格"
                  class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform"
                />
              </div>
            </div>
            <div
              v-else
              key="edit"
              class="edit-card preview-card overflow-y-scroll"
            >
              <div class="edit-form">
                <a-form
                  :model="formState"
                  :rules="rules"
                  layout="vertical"
                  :foot="null"
                  @change="isDirty = true"
                >
                  <a-form-item label="风格名称" name="name">
                    <a-input
                      v-model:value="formState.name"
                      :maxlength="10"
                      :minlength="1"
                      placeholder="请输入风格名称"
                    />
                  </a-form-item>
                  <a-form-item label="风格描述" name="description">
                    <a-textarea
                      v-model:value="formState.description"
                      :maxlength="100"
                      placeholder="请输入风格描述"
                    />
                  </a-form-item>
                  <a-form-item label="提示词模板" name="prompt">
                    <a-textarea
                      v-model:value="formState.prompt"
                      placeholder="请输入提示词模板"
                      :auto-size="{ minRows: 14, maxRows: 14 }"
                      :maxlength="1000"
                    />
                  </a-form-item>
                </a-form>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </a-modal>
  </a-form-item>
</template>

<style lang="scss" scoped>
.edit-form {
  padding: 24px 24px 6px 24px;
  background: white;
  border-radius: 8px;

  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }
}

.fade-mode-enter-active,
.fade-mode-leave-active {
  transition: all 0.3s ease;
}
.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}
.preview-card {
  height: 100%;
  grid-column: 2;
  background: linear-gradient(135deg, #ffffff, #f5f3ff);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.1);
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  animation: fadeIn 0.3s ease-in-out;
  border-left: 4px solid #6366f1;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #4338ca;
  margin: 0;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 12px;

  .custom-btn {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(99, 102, 241, 0.15);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(99, 102, 241, 0.25);
    }

    svg {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
  }

  .edit-btn {
    background: linear-gradient(135deg, #a5b4fc, #818cf8);
    color: #fff;

    &:hover {
      background: linear-gradient(135deg, #818cf8, #6366f1);
    }
  }

  .use-btn {
    background: linear-gradient(135deg, #67e8f9, #50c4d5);
    color: #fff;

    &:hover {
      background: linear-gradient(135deg, #22d3ee, #06b6d4);
    }
  }

  .copy-btn {
    background: linear-gradient(135deg, #fbcfe8, #f472b6);
    color: #fff;
    &:hover {
      background: linear-gradient(135deg, #f472b6, #f43f5e);
    }
  }
}

.preview-tag {
  background-color: #e0e7ff;
  color: #4338ca;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.preview-description {
  color: #4a4a68;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.preview-section {
  margin-bottom: 0.25rem;
}

.preview-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a4a68;
  margin: 1rem 0 0.5rem 0;
}

.preview-keywords {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
  font-style: italic;
  white-space: pre-line;
}

.preview-examples {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.example-tag {
  background-color: #e0e7ff;
  border: none;
  color: #4338ca;
  font-size: 0.8rem;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.example-tag:hover {
  background-color: #c7d2fe;
  transform: translateY(-2px);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .style-selector-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .preview-card {
    grid-column: 1;
  }
}

.fade-mode-enter-active,
.fade-mode-leave-active {
  transition: all 0.3s ease;
}

.fade-mode-enter-from,
.fade-mode-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

// 调整编辑表单容器样式
:deep(.ant-modal-body) {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

:deep(.ant-modal-content) {
  background: transparent;
  box-shadow: none;
}
</style>
