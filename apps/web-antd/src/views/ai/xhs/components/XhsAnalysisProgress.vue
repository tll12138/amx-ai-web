<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { CheckOutlined, LoadingOutlined } from '@ant-design/icons-vue';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'error' | 'pending';
  duration?: number; // 预计耗时（毫秒）
}

interface Props {
  currentStep: number; // 当前步骤索引 (0-4)
  isAnalyzing: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentStep: 0,
  isAnalyzing: false,
  hasError: false,
  errorMessage: '',
});

// 定义分析步骤
const steps = ref<ProgressStep[]>([
  {
    id: 'parse-url',
    title: '解析链接',
    description: '正在解析小红书链接...',
    status: 'pending',
    duration: 1000,
  },
  {
    id: 'fetch-content',
    title: '获取笔记内容',
    description: '正在获取笔记详细信息...',
    status: 'pending',
    duration: 1500,
  },
  {
    id: 'analyze-note',
    title: '分析笔记',
    description: '正在分析笔记内容和结构...',
    status: 'pending',
    duration: 2000,
  },
  {
    id: 'process-images',
    title: '图片处理',
    description: '正在处理和优化图片资源...',
    status: 'pending',
    duration: 2500,
  },
  {
    id: 'optimize-content',
    title: '优化内容',
    description: '正在优化内容格式和质量...',
    status: 'pending',
    duration: 1800,
  },
]);

// 计算当前进度百分比
const progressPercent = computed(() => {
  if (props.hasError) return 0;
  if (!props.isAnalyzing) return 0;

  const totalSteps = steps.value.length;
  const currentIndex = props.currentStep;
  console.log('currentIndex', currentIndex);
  console.log('totalSteps', totalSteps);
  console.log('currentStepIndex', currentIndex / totalSteps);
  // 前3步是顺序执行，后2步是并行执行
  return (currentIndex / totalSteps) * 100;
});

// 监听当前步骤变化，更新步骤状态
watch(
  () => [props.currentStep, props.isAnalyzing, props.hasError],
  ([currentStep, isAnalyzing, hasError]) => {
    steps.value.forEach((step, index) => {
      if (hasError) {
        if (index <= (currentStep as number)) {
          step.status = index === currentStep ? 'error' : 'completed';
        } else {
          step.status = 'pending';
        }
      } else if (isAnalyzing) {
        if (index < (currentStep as number)) {
          step.status = 'completed';
        } else if (index === currentStep) {
          step.status = 'active';
        } else if (index === 3 && currentStep === 3) {
          // 步骤4和5并行执行
          step.status = 'active';
        } else if (index === 4 && currentStep === 3) {
          // 步骤4和5并行执行
          step.status = 'active';
        } else {
          step.status = 'pending';
        }
      } else {
        step.status = 'pending';
      }
    });
  },
  { immediate: true },
);

// 获取步骤样式类
const getStepClass = (step: ProgressStep) => {
  return {
    'step-item': true,
    'step-pending': step.status === 'pending',
    'step-active': step.status === 'active',
    'step-completed': step.status === 'completed',
    'step-error': step.status === 'error',
  };
};

// 获取连接线样式类
const getConnectorClass = (index: number) => {
  const currentStep = props.currentStep;
  const isCompleted = index < currentStep || (index === 2 && currentStep >= 3);
  const isActive =
    index === currentStep - 1 || (index === 2 && currentStep === 3);

  return {
    'step-connector': true,
    'connector-completed': isCompleted,
    'connector-active': isActive,
    'connector-pending': !isCompleted && !isActive,
  };
};
</script>

<template>
  <div class="xhs-analysis-progress">
    <!-- 整体进度条 -->
    <div class="overall-progress">
      <div class="progress-header">
        <h3 class="progress-title">分析进度</h3>
        <div class="progress-percent">{{ progressPercent }}%</div>
      </div>
      <a-progress
        :percent="progressPercent"
        :status="hasError ? 'exception' : 'active'"
        :stroke-color="{
          '0%': '#ecf5ff',
          '20%': '#d9ecff',
          '40%': '#c6e2ff',
          '60%': '#a0cfff',
          '80%': '#79bbff',
          '100%': '#1677ff',
        }"
        trail-color="#f1f5f9"
        :stroke-width="5"
        :show-info="false"
      />
    </div>

    <!-- 步骤时间线 - 横向布局 -->
    <div class="steps-timeline">
      <div class="steps-container">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          :class="getStepClass(step)"
        >
          <!-- 步骤图标 -->
          <div class="step-icon-wrapper">
            <div class="step-icon">
              <CheckOutlined
                v-if="step.status === 'completed'"
                class="icon-check"
              />
              <LoadingOutlined
                v-else-if="step.status === 'active'"
                class="icon-loading"
              />
              <div v-else-if="step.status === 'error'" class="icon-error">
                !
              </div>
              <span v-else class="icon-number">{{ index + 1 }}</span>
            </div>
          </div>

          <!-- 步骤内容 -->
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-description">{{ step.description }}</div>

            <!-- 活动状态的进度动画 -->
            <div v-if="step.status === 'active'" class="step-progress">
              <div class="progress-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>

          <!-- 连接线 -->
          <div
            v-if="index < steps.length - 1"
            :class="getConnectorClass(index)"
          >
            <div class="connector-line"></div>
          </div>
        </div>
      </div>

      <!-- 错误信息显示区域 -->
      <div v-if="hasError && errorMessage" class="error-display">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <div class="error-text">{{ errorMessage }}</div>
        </div>
      </div>
    </div>

    <!-- 并行处理提示 -->
    <div v-if="currentStep === 3 && isAnalyzing" class="parallel-hint">
      <div class="hint-content">
        <div class="hint-icon">
          <LoadingOutlined />
        </div>
        <div class="hint-text">
          <span class="hint-title">并行处理中</span>
          <span class="hint-desc">图片处理和内容优化正在同时进行...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.xhs-analysis-progress {
  padding: 24px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  margin-top: 20px;
}

/* 整体进度条 */
.overall-progress {
  margin-bottom: 32px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #334155;
}

.progress-percent {
  font-size: 16px;
  font-weight: 600;
  color: #1677ff;
}

/* 步骤时间线 - 横向布局 */
.steps-timeline {
  position: relative;
}

.steps-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 0;
  overflow-x: auto;
  min-height: 120px;
}

.step-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 140px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 步骤图标 */
.step-icon-wrapper {
  position: relative;
  z-index: 2;
  margin-bottom: 12px;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

/* 步骤状态样式 */
.step-pending .step-icon {
  background: #f1f5f9;
  color: #94a3b8;
  border: 2px solid #e2e8f0;
}

.step-active .step-icon {
  background: linear-gradient(135deg, #1677ff 0%, #6bc9ff 100%);
  color: white;
  border: 2px solid #1677ff;
  box-shadow: 0 0 20px rgba(22, 119, 255, 0.3);
  animation: pulse 2s infinite;
}

.step-completed .step-icon {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: 2px solid #10b981;
  transform: scale(1.05);
}

.step-error .step-icon {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  color: white;
  border: 2px solid #ef4444;
}

/* 图标动画 */
.icon-loading {
  animation: spin 1s linear infinite;
}

.icon-check {
  animation: checkmark 0.5s ease-in-out;
}

.icon-error {
  font-weight: bold;
  font-size: 18px;
}

.icon-number {
  font-size: 14px;
  font-weight: 600;
}

/* 步骤内容 */
.step-content {
  text-align: center;
  width: 100%;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
  transition: color 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-description {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 32px;
}

/* 活动状态样式 */
.step-active .step-title {
  color: #1677ff;
}

.step-active .step-description {
  color: #475569;
}

.step-completed .step-title {
  color: #10b981;
}

/* 进度点动画 */
.step-progress {
  margin-top: 12px;
}

.progress-dots {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1677ff;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* 连接线 - 横向布局 */
.step-connector {
  position: absolute;
  top: 20px;
  right: -30px;
  width: 40px;
  height: 2px;
  z-index: 1;
  transition: all 0.3s ease;
}

.connector-line {
  width: 100%;
  height: 100%;
  border-radius: 1px;
}

.connector-pending .connector-line {
  background: #e2e8f0;
}

.connector-active .connector-line {
  background: linear-gradient(to right, #1677ff 0%, #6bc9ff 100%);
  animation: flowRight 2s infinite;
}

.connector-completed .connector-line {
  background: linear-gradient(to right, #10b981 0%, #34d399 100%);
}

/* 错误显示区域 */
.error-display {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.05) 0%,
    rgba(248, 113, 113, 0.05) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.1);
  border-radius: 12px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.error-icon {
  font-size: 18px;
}

.error-text {
  font-size: 14px;
  color: #ef4444;
  font-weight: 500;
}

/* 并行处理提示 */
.parallel-hint {
  margin-top: 24px;
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(22, 119, 255, 0.05) 0%,
    rgba(22, 119, 255, 0.05) 100%
  );
  border: 1px solid rgba(22, 119, 255, 0.1);
  border-radius: 12px;
}

.hint-content {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.hint-icon {
  color: #1677ff;
  font-size: 16px;
}

.hint-title {
  font-size: 14px;
  font-weight: 600;
  color: #1677ff;
  margin-bottom: 2px;
}

.hint-desc {
  font-size: 13px;
  margin-left: 20px;
  color: #64748b;
}

/* 动画定义 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(22, 119, 255, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(22, 119, 255, 0.5);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes checkmark {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes dotPulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes flowRight {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 0%;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .xhs-analysis-progress {
    padding: 16px;
    margin-top: 16px;
  }

  .progress-title {
    font-size: 16px;
  }

  .progress-percent {
    font-size: 14px;
  }

  .steps-container {
    gap: 10px;
    padding: 16px 0;
    min-height: 100px;
  }

  .step-item {
    min-width: 100px;
  }

  .step-icon {
    width: 32px;
    height: 32px;
  }

  .step-connector {
    right: -20px;
    width: 30px;
  }

  .step-title {
    font-size: 12px;
  }

  .step-description {
    font-size: 11px;
    height: 28px;
  }

  .fork-line {
    width: 15px;
  }
}
</style>
