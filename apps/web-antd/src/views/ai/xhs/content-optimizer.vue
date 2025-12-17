<!-- eslint-disable no-unused-vars -->
<script setup lang="ts">
import { computed, h, ref } from 'vue';

import {
  CopyOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';

import { CommonApi } from '../../../api/xhs/common';

// 优化状态枚举
enum OptimizeState {
  COMPLETED = 'completed', // 优化完成
  ERROR = 'error', // 优化失败
  IDLE = 'idle', // 空闲状态
  OPTIMIZING = 'optimizing', // 优化中
}

// 响应式数据
const originalContent = ref(''); // 原始文案
const optimizedContent = ref(''); // 优化后的文案
const optimizeState = ref<OptimizeState>(OptimizeState.IDLE);
const errorMessage = ref('');

// 计算属性
const isOptimizing = computed(() => {
  return optimizeState.value === OptimizeState.OPTIMIZING;
});

const hasResult = computed(() => {
  return (
    optimizeState.value === OptimizeState.COMPLETED && optimizedContent.value
  );
});

const hasError = computed(() => {
  return optimizeState.value === OptimizeState.ERROR;
});

const canOptimize = computed(() => {
  return originalContent.value.trim().length > 0 && !isOptimizing.value;
});

// 控制输入区域显示
const showInputSection = computed(() => {
  return !hasResult.value;
});

// 重置数据
const resetData = () => {
  optimizeState.value = OptimizeState.IDLE;
  optimizedContent.value = '';
  errorMessage.value = '';
};

// 控制重新编辑功能 - 添加确认对话框
const startReEdit = () => {
  Modal.confirm({
    title: '确认重新编辑',
    icon: h(ExclamationCircleOutlined),
    content: '重新编辑将清空当前的优化结果，确定要继续吗？',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      optimizeState.value = OptimizeState.IDLE;
      optimizedContent.value = '';
      errorMessage.value = '';
      message.info('已返回编辑模式');
    },
  });
};

// 状态控制函数
const updateOptimizeState = (state: OptimizeState, error?: string) => {
  optimizeState.value = state;
  if (error) {
    errorMessage.value = error;
  } else if (state !== OptimizeState.ERROR) {
    errorMessage.value = '';
  }
};

// 开始优化文案
const startOptimize = async () => {
  if (!originalContent.value.trim()) {
    message.error('请输入需要优化的文案内容');
    return;
  }

  resetData();
  updateOptimizeState(OptimizeState.OPTIMIZING);

  try {
    // 调用内容生成接口进行文案优化
    const response = await CommonApi.generateContent({
      content: originalContent.value.trim(),
    });

    if (response) {
      // 优化成功，更新结果
      optimizedContent.value = response.content || response.title || '';
      updateOptimizeState(OptimizeState.COMPLETED);
      message.success('文案优化完成！');
    } else {
      throw new Error('优化结果为空');
    }
  } catch (error: any) {
    const errorMsg = error.message || '文案优化失败，请稍后重试';
    updateOptimizeState(OptimizeState.ERROR, errorMsg);
    message.error(`优化失败: ${errorMsg}`);
  }
};

// 复制文案到剪贴板
const copyToClipboard = async (content: string, type: string) => {
  try {
    await navigator.clipboard.writeText(content);
    message.success(`${type}已复制到剪贴板`);
  } catch {
    // 降级方案：使用传统方法复制
    const textArea = document.createElement('textarea');
    textArea.value = content;
    document.body.append(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    message.success(`${type}已复制到剪贴板`);
  }
};

// 重新优化内容函数 - 确保基于原始内容
const reOptimizeContent = async () => {
  if (!originalContent.value.trim()) {
    message.error('原始文案内容为空，无法重新优化');
    return;
  }

  // 重置优化状态，但保留原始内容
  optimizedContent.value = '';
  errorMessage.value = '';
  updateOptimizeState(OptimizeState.OPTIMIZING);

  try {
    // 基于原始内容重新调用优化接口
    const response = await CommonApi.generateContent({
      content: originalContent.value.trim(),
    });

    if (response) {
      optimizedContent.value = `${response.title}\n${response.content}`;
      updateOptimizeState(OptimizeState.COMPLETED);
      message.success('文案重新优化完成！');
    } else {
      throw new Error('重新优化结果为空');
    }
  } catch (error: any) {
    const errorMsg = error.message || '重新优化失败，请稍后重试';
    updateOptimizeState(OptimizeState.ERROR, errorMsg);
    message.error(`重新优化失败: ${errorMsg}`);
  }
};

// 重新优化 - 基于原始内容重新优化，添加确认对话框
const reOptimize = () => {
  Modal.confirm({
    title: '确认重新优化',
    icon: h(ExclamationCircleOutlined),
    content: '重新优化将基于原始文案重新生成优化结果，确定要继续吗？',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      // 重新优化时，基于原始内容而不是当前优化后的内容
      reOptimizeContent();
    },
  });
};
</script>

<template>
  <div class="content-optimizer-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>AI 文案优化助手</h1>
      <p class="page-description">
        输入您的文案内容，AI 将为您提供更优质的表达方式
      </p>
    </div>

    <!-- 输入区域 - 根据优化状态动态布局 -->
    <div
      v-if="showInputSection"
      class="input-container"
      :class="[{ 'optimizing-layout': isOptimizing }]"
    >
      <!-- 输入区域 -->
      <div class="input-section">
        <a-card title="输入原始文案" class="input-card">
          <a-form layout="vertical">
            <a-form-item label="文案内容" required>
              <a-textarea
                v-model:value="originalContent"
                :disabled="isOptimizing"
                placeholder="请输入需要优化的文案内容...等"
                :auto-size="{ minRows: 10, maxRows: 20 }"
                :max-length="1000"
                show-count
                allow-clear
              />
            </a-form-item>
            <a-form-item>
              <div class="action-buttons">
                <a-button
                  type="primary"
                  size="large"
                  :loading="isOptimizing"
                  @click="startOptimize"
                  class="optimize-button"
                >
                  <template #icon>
                    <LoadingOutlined v-if="isOptimizing" />
                    <EditOutlined v-else />
                  </template>
                  {{ isOptimizing ? '正在优化中...' : '开始AI优化' }}
                </a-button>
              </div>
            </a-form-item>
          </a-form>
        </a-card>
      </div>

      <!-- 优化中提示框 - 仅在优化时显示在右侧 -->
      <div class="optimizing-section" v-if="isOptimizing">
        <a-card class="optimizing-card">
          <div class="optimizing-content">
            <div class="optimizing-icon">
              <LoadingOutlined
                :style="{ fontSize: '28px', color: '#667eea' }"
              />
            </div>
            <div class="optimizing-text">
              <h3>AI正在优化中...</h3>
              <p>请耐心等待，这可能需要一些时间</p>
              <div class="optimizing-tips">
                <div class="tip-item">
                  <span class="tip-icon">🤖</span>
                  <span>分析文案结构</span>
                </div>
                <div class="tip-item">
                  <span class="tip-icon">✨</span>
                  <span>优化表达方式</span>
                </div>
                <div class="tip-item">
                  <span class="tip-icon">🎯</span>
                  <span>生成优质内容</span>
                </div>
              </div>
            </div>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 结果对比区域 - 重新设计布局 -->
    <div class="result-section" v-if="hasResult">
      <div class="result-layout">
        <!-- 原始文案 -->
        <div class="original-content">
          <div class="content-card">
            <div class="card-header">
              <h3>📝 原始文案</h3>
              <div>
                <a-button
                  type="text"
                  size="small"
                  @click="copyToClipboard(originalContent, '原始文案')"
                  class="copy-button"
                >
                  <template #icon>
                    <CopyOutlined />
                  </template>
                  复制
                </a-button>
                <a-button @click="startReEdit" class="copy-button">
                  <template #icon>
                    <EditOutlined />
                  </template>
                  重新编辑
                </a-button>
              </div>
            </div>
            <div class="content-display">
              <div class="content-text original">{{ originalContent }}</div>
            </div>
          </div>
        </div>

        <!-- 优化后文案 -->
        <div class="optimized-content">
          <div class="content-card optimized">
            <div class="card-header">
              <h3>✨ 优化后文案</h3>
              <div>
                <a-button
                  type="primary"
                  size="small"
                  @click="copyToClipboard(optimizedContent, '优化后文案')"
                  class="copy-button primary"
                >
                  <template #icon>
                    <CopyOutlined />
                  </template>
                  复制优化文案
                </a-button>
                <a-button
                  type="primary"
                  ghost
                  @click="reOptimize"
                  :loading="isOptimizing"
                  class="copy-button primary"
                >
                  <template #icon>
                    <EditOutlined />
                  </template>
                  重新优化
                </a-button>
              </div>
            </div>
            <div class="content-display">
              <div class="content-text optimized">{{ optimizedContent }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div class="error-section" v-if="hasError">
      <a-alert
        type="error"
        :message="errorMessage"
        show-icon
        closable
        @close="resetData"
      />
      <div class="error-actions">
        <a-button
          type="primary"
          @click="startOptimize"
          :disabled="!canOptimize"
        >
          重试优化
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 主容器样式 */
.content-optimizer-page {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  min-height: 100%;
}

/* 页面标题区域 */
.page-header {
  text-align: center;
  padding: 32px 0;
}

.page-header h1 {
  font-size: clamp(28px, 5vw, 36px);
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  font-weight: 400;
}

/* 输入容器 - 动态布局 */
.input-container {
  margin-bottom: 40px;
  transition: all 0.3s ease;
}

/* 默认状态 - 居中布局 */
.input-container .input-section {
  max-width: 800px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

/* 优化中状态 - 左右布局 */
.input-container.optimizing-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto 40px;
  align-items: start;
  min-height: 500px;
}

.input-container.optimizing-layout .input-section {
  max-width: none;
  margin: 0;
  width: 100%;
}

.input-card :deep(.ant-card) {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.input-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f1f5f9;
  padding: 20px 24px 16px;
}

.input-card :deep(.ant-card-head-title) {
  font-weight: 600;
  color: #334155;
  font-size: 18px;
}

.input-card :deep(.ant-card-body) {
  padding: 24px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-buttons :deep(.ant-btn) {
  border-radius: 8px;
  font-weight: 500;
  height: 40px;
  padding: 0 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 优化按钮特殊样式 - 确保文字可见性 */
.optimize-button {
  position: relative;
  overflow: hidden;
  color: #ffffff;
}

.optimize-button:deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  font-weight: 600 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.optimize-button:deep(.ant-btn-primary):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
}

/* 优化中状态的特殊样式 - 增强文字可见性 */
.optimize-button:deep(.ant-btn-primary.ant-btn-loading) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow:
    0 4px 20px rgba(79, 70, 229, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.optimize-button:deep(.ant-btn-loading .ant-btn-loading-icon) {
  color: #ffffff !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.action-buttons :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.action-buttons :deep(.ant-btn-primary):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 确认对话框样式优化 */
:deep(.ant-modal) {
  border-radius: 12px;
}

:deep(.ant-modal-header) {
  border-radius: 12px 12px 0 0;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
}

:deep(.ant-modal-title) {
  font-weight: 600;
  color: #334155;
}

:deep(.ant-modal-confirm-title) {
  font-weight: 600;
  color: #334155;
}

:deep(.ant-modal-confirm-content) {
  color: #64748b;
  margin-top: 8px;
}

:deep(.ant-modal-confirm .ant-modal-confirm-btns) {
  margin-top: 24px;
}

:deep(.ant-modal-confirm .ant-btn-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  font-weight: 500;
}

:deep(.ant-modal-confirm .ant-btn-default) {
  border-radius: 6px;
  font-weight: 500;
}

/* 结果对比区域 */
.result-section {
  margin-top: 40px;
}

/* 工具栏样式 */
.result-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  margin-bottom: 24px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(118, 75, 162, 0.05) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  backdrop-filter: blur(10px);
}

.toolbar-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 4px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.toolbar-title p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 重新优化按钮增强样式 */
.re-optimize-button {
  background: #667eea !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  height: 36px !important;
  padding: 0 16px !important;
  border-radius: 8px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.re-optimize-button:hover {
  background: #667eea !important;
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.reset-button {
  height: 36px !important;
  border-radius: 8px !important;
  color: #64748b !important;
  border-color: #e2e8f0 !important;
}

.reset-button:hover {
  color: #334155 !important;
  border-color: #cbd5e1 !important;
}

.result-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 内容卡片样式 - 重新设计 */
.content-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.content-card.optimized {
  border: 1px solid rgba(102, 126, 234, 0.2);
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.02) 0%,
    rgba(118, 75, 162, 0.02) 100%
  );
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}

.content-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.content-card.optimized:hover {
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: rgba(248, 250, 252, 0.5);
}

.optimized .card-header {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.04) 0%,
    rgba(118, 75, 162, 0.04) 100%
  );
  border-bottom-color: rgba(102, 126, 234, 0.08);
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.optimized .card-header h3 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 复制按钮样式 */
.copy-button {
  margin-left: 10px;
  height: 32px !important;
  border-radius: 6px !important;
  font-size: 12px !important;
  padding: 0 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.copy-button.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.copy-button.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.copy-button:not(.primary) {
  color: #64748b !important;
  border-color: #e2e8f0 !important;
}

.copy-button:not(.primary):hover {
  color: #334155 !important;
  border-color: #cbd5e1 !important;
  background: #f8fafc !important;
}

/* 内容显示区域 */
.content-display {
  position: relative;
  padding: 24px;
}

.content-text {
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 160px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.content-text.original {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-color: #e2e8f0;
}

.content-text.optimized {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.04) 0%,
    rgba(118, 75, 162, 0.04) 100%
  );
  border: 1px solid rgba(102, 126, 234, 0.15);
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.08);
  font-weight: 500;
  color: #2d3748;
}

.content-text.optimized::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  z-index: -1;
  opacity: 0.05;
}

/* 优化中提示区域 - 右侧显示 */
.optimizing-section {
  width: 100%;
  margin: 0;
  position: sticky;
  top: 20px;
}

.optimizing-card :deep(.ant-card) {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
  border: 1px solid rgba(102, 126, 234, 0.2);
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.03) 0%,
    rgba(118, 75, 162, 0.03) 100%
  );
  backdrop-filter: blur(10px);
  animation: optimizingPulse 2s ease-in-out infinite;
  height: fit-content;
}

@keyframes optimizingPulse {
  0%,
  100% {
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.25);
    transform: scale(1.01);
  }
}

.optimizing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px 20px;
  text-align: center;
}

.optimizing-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  animation: optimizingRotate 2s linear infinite;
}

@keyframes optimizingRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.optimizing-icon :deep(.anticon) {
  color: #ffffff !important;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.optimizing-text {
  width: 100%;
}

.optimizing-text h3 {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.optimizing-text p {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.optimizing-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.optimizing-tips .tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  animation: optimizingTipFade 3s ease-in-out infinite;
  text-align: left;
}

@keyframes optimizingTipFade {
  0%,
  100% {
    opacity: 0.7;
    transform: translateX(0);
  }
  50% {
    opacity: 1;
    transform: translateX(2px);
  }
}

.optimizing-tips .tip-item:nth-child(2) {
  animation-delay: 1s;
}

.optimizing-tips .tip-item:nth-child(3) {
  animation-delay: 2s;
}

.optimizing-tips .tip-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.optimizing-tips .tip-item span:last-child {
  font-size: 12px;
  color: #475569;
  font-weight: 500;
  flex: 1;
}

/* 错误提示区域 */
.error-section {
  max-width: 800px;
  margin: 40px auto;
}

.error-section :deep(.ant-alert) {
  border-radius: 12px;
  margin-bottom: 16px;
}

.error-actions {
  text-align: center;
}

/* 使用提示区域 */
.tips-section {
  max-width: 800px;
  margin: 40px auto;
}

.tips-card :deep(.ant-card) {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.tips-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.tip-item h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.tip-item p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-optimizer-page {
    padding: 16px;
  }

  .page-header {
    padding: 24px 0;
  }

  .page-header h1 {
    font-size: 24px;
  }

  .result-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    text-align: center;
  }

  .toolbar-actions {
    justify-content: center;
  }

  .result-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .tips-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .copy-button {
    width: 100% !important;
    justify-content: center;
  }

  /* 输入和优化区域响应式 */
  .input-container.optimizing-layout {
    grid-template-columns: 1fr;
    gap: 20px;
    min-height: auto;
  }

  .input-container .input-section {
    max-width: none;
  }

  .optimizing-section {
    order: -1; /* 在移动端将优化提示移到上方 */
    position: static;
  }

  /* 优化中提示框响应式 */
  .optimizing-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 24px 16px;
  }

  .optimizing-icon {
    width: 60px;
    height: 60px;
  }

  .optimizing-text h3 {
    font-size: 18px;
  }

  .optimizing-tips {
    gap: 8px;
  }

  .optimizing-tips .tip-item {
    padding: 6px 10px;
    font-size: 12px;
  }

  .optimizing-tips .tip-icon {
    font-size: 14px;
  }
}

/* 输入框和按钮样式优化 */
:deep(.ant-input),
:deep(.ant-textarea) {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-input):focus,
:deep(.ant-textarea):focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

:deep(.ant-btn) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.ant-btn-primary):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}
</style>
