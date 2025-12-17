<script lang="ts" setup>
import type { AiRespContainer } from '#/views/ai/generationTask/data';

import { nextTick, ref, watch } from 'vue';
import { Thinking, Typewriter } from 'vue-element-plus-x';

import { CopyIcon, RefreshIcon } from '@vben/icons';

import {
  DeleteOutlined,
  EditOutlined,
  RollbackOutlined,
} from '@ant-design/icons-vue';
import { notification } from 'ant-design-vue';

import { GenerationTaskApi } from '#/api/ai/generationTask';
import { copyToClipboard } from '#/utils/copy';

interface Props {
  container: AiRespContainer; // 生成内容
  generateStatus: string; // 字符串
  formState: {
    required: true;
    type: Object;
  };
}

const props = defineProps<Props>();
const emit = defineEmits(['regenerate', 'saveModify']);

const markdownText = ref(props.container.content);
const activeKeys = ref(props.container.think ? ['1'] : []);

// 段落相关状态
const paragraphs = ref<
  Array<{
    aiEditing: boolean;
    editing: boolean;
    editingText: string;
    text: string;
  }>
>([]);
const editingIndex = ref(-1);
const aiPrompt = ref('');
const showAiPromptModal = ref(false);
const currentParagraphIndex = ref(-1);

// 历史版本记录
const contentHistory = ref<string[]>([]);
const currentVersion = ref(0);

// 标记是否有AI修改正在进行中
const isAiModifying = ref(false);

// 将内容分割为段落
const splitContentIntoParagraphs = (content: string) => {
  if (!content) return [];

  // 按照段落分割内容（空行分隔）
  const parts = content.split(/\n\s*\n/);
  // 过滤掉空段落
  return parts
    .filter((text) => text.trim() !== '')
    .map((text) => ({
      text: text.trim(),
      editing: false,
      aiEditing: false,
      editingText: text.trim(), // 为每个段落添加独立的编辑文本
    }));
};

// 合并段落为完整内容
const combineParagraphs = () => {
  return paragraphs.value
    .filter((p) => p.text.trim() !== '')
    .map((p) => p.text)
    .join('\n\n');
};

// 监听容器内容变化
watch(
  () => props.container,
  (newContent: AiRespContainer) => {
    activeKeys.value = newContent.thinkContent && newContent.think ? ['1'] : [];
    markdownText.value = `${newContent.content}`;
    paragraphs.value = splitContentIntoParagraphs(newContent.content);
  },
  { immediate: true, deep: true },
);

// 处理复制功能
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

// 处理刷新功能
const handleRefresh = () => {
  emit('regenerate');
};

// 保存当前内容到历史记录
const saveToHistory = () => {
  // 如果当前版本不是最新版本，删除当前版本之后的所有版本
  if (currentVersion.value < contentHistory.value.length - 1) {
    contentHistory.value = contentHistory.value.slice(
      0,
      currentVersion.value + 1,
    );
  }

  // 添加新版本
  contentHistory.value.push(markdownText.value);
  currentVersion.value = contentHistory.value.length - 1;
  emit('saveModify', markdownText.value);
};

// 编辑段落
const handleEditParagraph = (index: number) => {
  console.log('handleEditParagraph', index);

  // 如果AI修改正在进行中，不允许编辑任何段落
  if (isAiModifying.value) {
    notification.warning({
      message: '系统通知',
      description: 'AI正在修改内容，请等待完成后再进行编辑',
      duration: 2,
      placement: 'topRight',
    });
    return;
  }

  // 如果有其他段落正在编辑，先取消它们的编辑状态
  if (editingIndex.value !== -1 && editingIndex.value !== index) {
    paragraphs.value[editingIndex.value].editing = false;
  }

  editingIndex.value = index;
  paragraphs.value[index].editingText = paragraphs.value[index].text; // 使用段落自己的编辑文本
  paragraphs.value[index].editing = true;
};

// 保存编辑的段落
const handleSaveParagraph = (index: number) => {
  const editedText = paragraphs.value[index].editingText.trim();

  // 如果编辑后的内容为空，则删除此段落
  if (editedText === '') {
    paragraphs.value.splice(index, 1);
    notification.info({
      message: '系统通知',
      description: '空段落已被删除',
      duration: 2,
      placement: 'topRight',
    });
  } else {
    paragraphs.value[index].text = editedText;
    paragraphs.value[index].editing = false;
  }

  editingIndex.value = -1;

  // 更新完整内容
  markdownText.value = combineParagraphs();

  // 保存到历史记录
  saveToHistory();
};

// 回退到上一个版本
const revertToPreviousVersion = () => {
  if (currentVersion.value > 0) {
    currentVersion.value--;
    markdownText.value = contentHistory.value[currentVersion.value];
    paragraphs.value = splitContentIntoParagraphs(markdownText.value);
    // 更新修改
    emit('saveModify', markdownText.value);
    notification.success({
      message: '系统通知',
      description: '已回退到上一个版本',
      duration: 2,
      placement: 'topRight',
    });
  } else {
    notification.info({
      message: '系统通知',
      description: '已经是最早的版本',
      duration: 2,
      placement: 'topRight',
    });
  }
};

// 前进到下一个版本
const advanceToNextVersion = () => {
  if (currentVersion.value < contentHistory.value.length - 1) {
    currentVersion.value++;
    markdownText.value = contentHistory.value[currentVersion.value];
    paragraphs.value = splitContentIntoParagraphs(markdownText.value);
    // 更新修改
    emit('saveModify', markdownText.value);
    notification.success({
      message: '系统通知',
      description: '已前进到下一个版本',
      duration: 2,
      placement: 'topRight',
    });
  } else {
    notification.info({
      message: '系统通知',
      description: '已经是最新的版本',
      duration: 2,
      placement: 'topRight',
    });
  }
};

// 取消编辑
const handleCancelEdit = (index: number) => {
  paragraphs.value[index].editing = false;
  editingIndex.value = -1;
};

// 删除段落
const handleDeleteParagraph = (index: number) => {
  // 如果AI修改正在进行中，不允许删除任何段落
  if (isAiModifying.value) {
    notification.warning({
      message: '系统通知',
      description: 'AI正在修改内容，请等待完成后再进行删除',
      duration: 2,
      placement: 'topRight',
    });
    return;
  }

  // 确认删除
  if (paragraphs.value.length > 1) {
    // 删除段落
    paragraphs.value.splice(index, 1);

    // 如果正在编辑的是被删除的段落，重置编辑状态
    if (editingIndex.value === index) {
      editingIndex.value = -1;
    } else if (editingIndex.value > index) {
      // 如果正在编辑的段落在被删除段落之后，调整索引
      editingIndex.value--;
    }

    // 更新完整内容
    markdownText.value = combineParagraphs();

    // 保存到历史记录
    saveToHistory();

    notification.success({
      message: '系统通知',
      description: '段落已删除',
      duration: 2,
      placement: 'topRight',
    });
  } else {
    // 如果只有一个段落，提示用户不能删除
    notification.warning({
      message: '系统通知',
      description: '至少保留一个段落，无法删除',
      duration: 2,
      placement: 'topRight',
    });
  }
};

// 打开AI编辑提示框
const openAiEditModal = (index: number) => {
  currentParagraphIndex.value = index;
  aiPrompt.value = '';
  showAiPromptModal.value = true;
};

// 使用AI修改段落
const handleAiEditParagraph = async () => {
  if (currentParagraphIndex.value >= 0 && aiPrompt.value.trim()) {
    // 关闭模态框
    showAiPromptModal.value = false;
    // 设置全局修改状态，防止用户同时修改其他段落
    isAiModifying.value = true;
    // 设置当前段落为修改中状态
    paragraphs.value[currentParagraphIndex.value].aiEditing = true;

    try {
      const limit = `根据要求【${aiPrompt.value}】修改此段内容：【${
        paragraphs.value[currentParagraphIndex.value].text
      }】`;

      // 构建请求参数
      const param = {
        id: props.formState.id,
        type: 'zc',
        style: props.formState.style,
        model: props.formState.model,
        aiContent: contentHistory.value[currentVersion.value],
        productId: props.formState.productId,
        operationType: 'modify',
        otherLimit: limit,
        topP: props.formState.topP,
        temperature: props.formState.temperature,
      };

      // 调用接口
      const res = await GenerationTaskApi.modify(param);
      console.log(res);

      // 检查AI返回的内容是否为空
      if (res && res.trim() !== '') {
        // 更新段落内容
        paragraphs.value[currentParagraphIndex.value].text = res;
      } else {
        // 如果AI返回的内容为空，删除此段落
        paragraphs.value.splice(currentParagraphIndex.value, 1);
        notification.info({
          message: '系统通知',
          description: 'AI修改后内容为空，已删除此段落',
          duration: 2,
          placement: 'topRight',
        });
      }

      // 更新完整内容
      markdownText.value = combineParagraphs();

      // 保存到历史记录
      saveToHistory();

      notification.success({
        message: '系统通知',
        description: 'AI修改完成',
        duration: 2,
        placement: 'topRight',
      });
    } catch (error) {
      console.error('AI修改失败:', error);
      notification.error({
        message: '系统通知',
        description: 'AI修改失败，请重试',
        duration: 2,
        placement: 'topRight',
      });
    } finally {
      // 无论成功或失败，都重置状态
      if (
        currentParagraphIndex.value >= 0 &&
        currentParagraphIndex.value < paragraphs.value.length
      ) {
        paragraphs.value[currentParagraphIndex.value].aiEditing = false;
      }
      isAiModifying.value = false;
    }
  } else {
    showAiPromptModal.value = false;
  }
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
    if (props.generateStatus !== 'done') {
      scrollToBottom();
    }
  },
  { immediate: true },
);

watch(
  () => props.generateStatus,
  (newVal) => {
    if (newVal === 'done') {
      scrollToBottom();
      // 当生成完成时，确保内容被分割为段落
      nextTick(() => {
        if (paragraphs.value.length === 0 && markdownText.value) {
          paragraphs.value = splitContentIntoParagraphs(markdownText.value);
        }
      });
      // 保存初始版本到历史记录
      if (markdownText.value && contentHistory.value.length === 0) {
        contentHistory.value = [markdownText.value];
        currentVersion.value = 0;
      } else {
        saveToHistory();
      }
    }
  },
  { immediate: true, deep: true },
);
</script>
<template>
  <a-card class="generation-panel overflow-hidden overflow-y-scroll">
    <div
      v-if="container.content || container.thinkContent"
      class="content-box"
      style="background-color: transparent"
    >
      <div style="background-color: transparent">
        <div class="ml-[8px]">
          <Thinking
            v-if="container.thinkContent"
            :content="container.thinkContent"
            :status="container.think ? 'thinking' : 'end'"
            auto-collapse
            background-color="#e7e7e7"
            button-width="300px"
            color="#4b4b4b"
            max-width="100%"
          />
        </div>

        <!-- 使用段落编辑模式 -->
        <div
          v-if="generateStatus === 'done' && paragraphs.length > 0"
          class="paragraphs-container"
        >
          <div
            v-for="(paragraph, index) in paragraphs"
            :key="index"
            class="paragraph-item"
          >
            <!-- 编辑模式 -->
            <div v-if="paragraph.editing" class="paragraph-edit-container">
              <a-textarea
                v-model:value="paragraph.editingText"
                :auto-size="{ minRows: 3, maxRows: 10 }"
                :rows="4"
                class="paragraph-edit-textarea"
              />
              <div class="paragraph-edit-actions">
                <a-button
                  size="small"
                  type="primary"
                  @click="handleSaveParagraph(index)"
                >
                  保存
                </a-button>
                <a-button size="small" @click="handleCancelEdit(index)">
                  取消
                </a-button>
              </div>
            </div>

            <!-- AI编辑中 -->
            <div v-else-if="paragraph.aiEditing" class="paragraph-ai-editing">
              <a-spin tip="AI正在修改中...">
                <div class="paragraph-content">{{ paragraph.text }}</div>
              </a-spin>
            </div>

            <!-- 正常显示模式 -->
            <div
              v-else
              v-tippy="{ theme: 'dark', content: '双击段落进行内容修改', duration: 100 }"
              class="paragraph-display"
              @dblclick="handleEditParagraph(index)"
            >
              <Typewriter
                :content="paragraph.text"
                :is-markdown="true"
                :typing="false"
                class="paragraph-content"
              />
              <div class="paragraph-actions">
                <button
                  v-tippy="{
                    theme: 'dark',
                    content: '删除此段落',
                    duration: 200,
                  }"
                  :class="{ 'paragraph-action-btn-disabled': isAiModifying }"
                  :disabled="isAiModifying"
                  class="paragraph-action-btn action-button"
                  @click="handleDeleteParagraph(index)"
                >
                  <DeleteOutlined class="text-red-600"/>
                </button>
                <button
                  v-tippy="{ theme: 'dark', content: 'AI修改', duration: 200 }"
                  :class="{ 'paragraph-action-btn-disabled': isAiModifying }"
                  :disabled="isAiModifying"
                  class="paragraph-action-btn action-button"
                  @click="openAiEditModal(index)"
                >
                  AI
                </button>
              </div>
            </div>
          </div>

          <div class="action-buttons-container">
            <a-divider class="m-2" dashed />
            <div class="action-buttons">
              <button
                v-tippy="{ theme: 'dark', content: '复制', duration: 200 }"
                class="action-button"
                @click="handleCopy"
              >
                <CopyIcon class="action-icon" />
                <span class="action-text">复制</span>
              </button>
              <button
                v-tippy="{ theme: 'dark', content: '重新生成', duration: 200 }"
                class="action-button"
                @click="handleRefresh"
              >
                <RefreshIcon class="action-icon" />
                <span class="action-text">重新生成</span>
              </button>
              <!-- 版本控制按钮 -->
              <button
                v-tippy="{ theme: 'dark', content: '回退', duration: 200 }"
                :class="{ 'action-button-disabled': currentVersion <= 0 }"
                :disabled="currentVersion <= 0"
                class="action-button"
                @click="revertToPreviousVersion"
              >
                <RollbackOutlined class="action-icon" />
                <span class="action-text">回退</span>
              </button>
              <button
                v-tippy="{ theme: 'dark', content: '前进', duration: 200 }"
                :class="{
                  'action-button-disabled':
                    currentVersion >= contentHistory.length - 1,
                }"
                :disabled="currentVersion >= contentHistory.length - 1"
                class="action-button"
                @click="advanceToNextVersion"
              >
                <RollbackOutlined :rotate="180" class="action-icon" />
                <span class="action-text">前进</span>
              </button>
            </div>
          </div>
        </div>
        <!-- 原始显示模式（生成中或未分段） -->
        <Typewriter
          v-else
          :content="markdownText"
          :is-markdown="true"
          :typing="false"
          style="padding: 16px; background-color: transparent"
        />
      </div>
    </div>
    <a-empty
      v-else-if="
        !container.content && !container.thinkContent && !container.loading
      "
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform"
      description="暂未生成种草内容"
    />
    <a-skeleton v-else :paragraph="{ rows: 21 }" active class="h-full" />
    <!-- AI编辑提示框 -->
    <a-modal
      v-model:open="showAiPromptModal"
      :keyboard="false"
      :mask-closable="false"
      cancel-text="取消"
      centered
      ok-text="确认"
      title="AI修改提示"
      @ok="handleAiEditParagraph"
    >
      <div class="ai-edit-modal-content">
        <p>请输入修改提示，告诉AI如何修改这段内容：</p>
        <div class="original-content-preview">
          <div class="original-content-label">原始内容：</div>
          <div v-if="currentParagraphIndex >= 0" class="original-content-text">
            {{ paragraphs[currentParagraphIndex]?.text }}
          </div>
        </div>
        <a-textarea
          v-model:value="aiPrompt"
          :rows="4"
          placeholder="例如：使语言更生动、添加更多细节、简化表达等"
        />
      </div>
    </a-modal>
  </a-card>
</template>

<style scoped>
.generation-panel {
  height: 100%;
  background: white;
  border-radius: 24px;
  box-shadow:
    0 12px 32px rgba(99, 102, 241, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.8);

  &:hover {
    box-shadow:
      0 16px 40px rgba(99, 102, 241, 0.12),
      inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  }

  background: linear-gradient(180deg, #f6fdf7 0%, #fafbff 90%);
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
  color: #e7e7e7;
  background-color: #e5e5e5;
}

/* 段落编辑相关样式 */
.paragraphs-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.paragraph-item {
  position: relative;
  border-radius: 8px;
  transition: all 0.3s ease;
  padding: 8px;
}

.paragraph-item:hover {
  background-color: rgba(99, 102, 241, 0.05);
}

.paragraph-display {
  position: relative;
  padding-right: 40px; /* 为操作按钮留出空间 */
}

.paragraph-actions {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.paragraph-item:hover .paragraph-actions {
  opacity: 1;
}

.paragraph-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background-color: #f0f0f0;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.paragraph-action-btn:hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}

.action-icon {
  width: 16px;
  height: 16px;
  color: #666;
}

.paragraph-edit-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(99, 102, 241, 0.05);
}

.paragraph-edit-textarea {
  border-radius: 4px;
  resize: vertical;
}

.paragraph-edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.paragraph-ai-editing {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(99, 102, 241, 0.05);
}

.paragraph-content {
  line-height: 1.6;
}

/* AI编辑模态框样式 */
.ai-edit-modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.original-content-preview {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}

.original-content-label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.original-content-text {
  white-space: pre-wrap;
  line-height: 1.5;
  color: #333;
  max-height: 150px;
  overflow-y: auto;
}

.paragraph-action-btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.paragraph-action-btn-disabled:hover {
  background-color: #f5f5f5;
  transform: none;
}

/* 底部操作按钮样式 */
.action-buttons-container {
  position: sticky;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(246, 253, 247, 0.8) 0%,
    rgba(250, 251, 255, 0.95) 100%
  );
  backdrop-filter: blur(5px);
  padding-bottom: 12px;
  z-index: 10;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0 8px;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: #f0f2ff;
  border: 1px solid #e0e3ff;
  color: #6366f1;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
}

.action-button:hover {
  background-color: #e0e3ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.15);
}

.action-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(99, 102, 241, 0.1);
}

.action-button-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button-disabled:hover {
  transform: none;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
  background-color: #f0f2ff;
}

.action-icon {
  font-size: 14px;
  color: #6366f1;
}

.action-text {
  white-space: nowrap;
}

:deep(.markdown-body) {
  background-color: transparent;
}
</style>
