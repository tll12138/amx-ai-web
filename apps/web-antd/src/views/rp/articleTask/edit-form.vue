<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { DictEnum } from '@vben/constants';

import { message } from 'ant-design-vue';

import { AccountGroupApi } from '#/api/rp/accountGroup';
import { getDictOptions } from '#/utils/dict';
import Step2 from '#/views/rp/articleTask/components/step2.vue';

import AccountSelect from './components/AccountSelect.vue';
import { ArticleTaskApi } from '#/api/rp/articleTask';

// ========== 1. 常量定义（语义化，消除硬编码） ==========
const PLATFORM_DOUYIN = '抖音';
const DEVICE_TYPE_PC = '0';
const DEVICE_TYPE_MOBILE = '1';
const STEP_ACCOUNT_SELECT = 0;
const STEP_CONTENT_SETTING = 1;

// ========== 2. 事件定义 ==========
const emit = defineEmits<{ reload: [] }>();

// ========== 3. 类型定义 ==========
interface StepParams {
  platform: string | undefined;
  groupId?: string | undefined;
  accountIds: string[];
  search?: string;
  deviceType: string | undefined; // 终端类型：0-PC 1-手机
}

interface ArticleTaskDetail {
  taskName?: string;
  deviceType?: string;
  detailVos?: Array<{
    accountId: string;
    type: string;
    extraInfo: string;
    title?: string;
    content?: string;
    taskId?: number;
    publishStatus?: number;
    ifControlEvaluation?: number;
    controlEvaluationContent?: string;
    ifBite?: number;
    biteNo?: number;
  }>;
}

// ========== 4. 状态管理（核心优化：确保状态彻底重置） ==========
const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? '查看搬运任务' : '新增搬运任务';
});

const currentStep = ref(STEP_ACCOUNT_SELECT);
const platformOptions = ref(getDictOptions(DictEnum.RP_PLATFORMS));
const stepParams = ref<StepParams>({
  platform: undefined,
  groupId: undefined,
  accountIds: [],
  search: '',
  deviceType: undefined,
});
const groups = ref<any[]>([]);
const loading = ref(false);
const step2FormData = ref<any>(null);
const step2 = ref<any>(null);
const selectedGroupIds = ref<string[]>([]);
const isDataFilled = ref(false);

// ========== 5. 计算属性 ==========
const selectedAccountDetails = computed(() => {
  if (stepParams.value.accountIds.length === 0) return [];

  const allAccounts = groups.value.flatMap((group) =>
    group.accounts?.map((account: any) => ({
      id: account.id,
      name: account.accountName,
      groupId: group.id,
    })) || []
  );

  return allAccounts.filter((account) =>
    stepParams.value.accountIds.includes(account.id)
  );
});

// ========== 6. 工具函数 ==========
/**
 * 安全解析JSON
 */
const safeParseJson = (jsonStr: string, defaultValue = {}) => {
  try {
    return jsonStr ? JSON.parse(jsonStr) : defaultValue;
  } catch (e) {
    console.error('JSON解析失败:', e);
    return defaultValue;
  }
};

/**
 * 【核心优化】深度重置所有状态（确保无残留数据）
 */
const resetAllFormState = () => {
  // 重置基础参数
  stepParams.value = {
    platform: undefined,
    groupId: undefined,
    accountIds: [],
    search: '',
    deviceType: undefined,
  };

  // 重置关联数据
  groups.value = [];
  selectedGroupIds.value = [];
  step2FormData.value = null;
  currentStep.value = STEP_ACCOUNT_SELECT;
  isUpdate.value = false;
  isDataFilled.value = false;

  // 立即重置子组件表单（不等待nextTick）
  if (step2.value && typeof step2.value.resetForm === 'function') {
    step2.value.resetForm();
  }

  console.log('所有状态已彻底重置');
};

/**
 * 设置平台默认终端类型
 */
const setPlatformDefaultDeviceType = (platform: string | undefined) => {
  if (platform === PLATFORM_DOUYIN) {
    stepParams.value.deviceType = DEVICE_TYPE_MOBILE;
  } else {
    stepParams.value.deviceType = undefined;
  }
};

// ========== 7. 核心业务函数 ==========
/**
 * 加载平台分组数据
 */
async function loadGroups() {
  const currentPlatform = stepParams.value.platform;
  if (!currentPlatform) return;

  loading.value = true;
  try {
    const groupsWithAccounts = await AccountGroupApi.listGroupAndAccount(currentPlatform);
    groups.value = groupsWithAccounts || [];
  } catch (error) {
    console.error('加载分组数据失败:', error);
    groups.value = [];
    message.error('加载账号分组失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

/**
 * 初始化平台默认值
 */
function initPlatformDefaultValue() {
  if (!stepParams.value.platform && platformOptions.value?.length) {
    stepParams.value.platform = platformOptions.value[0].value;
    setPlatformDefaultDeviceType(stepParams.value.platform);
  }
}

/**
 * 回填任务详情数据
 */
async function fillTaskDetailData(detailData: ArticleTaskDetail) {
  stepParams.value.deviceType = detailData.deviceType || stepParams.value.deviceType;

  if (detailData.detailVos && Array.isArray(detailData.detailVos)) {
    const accountIds = detailData.detailVos.map(item => item.accountId);
    stepParams.value.accountIds = accountIds;

    const accountDetails = selectedAccountDetails.value;
    const groupIds = [...new Set(accountDetails.map(account => account.groupId))];
    selectedGroupIds.value = groupIds;

    step2FormData.value = assembleStep2FormData(detailData);

    await nextTick();
    currentStep.value = STEP_CONTENT_SETTING;

    if (!isDataFilled.value && step2.value && step2FormData.value) {
      step2.value.setFormData(step2FormData.value);
      isDataFilled.value = true;
    }
  }
}

/**
 * 组装Step2表单数据
 */
function assembleStep2FormData(detailData: ArticleTaskDetail) {
  if (!detailData.detailVos || !Array.isArray(detailData.detailVos)) return null;

  return {
    taskName: detailData.taskName || '',
    contentGroups: detailData.detailVos.map((item) => {
      const extraInfo = safeParseJson(item.extraInfo);
      return {
        mediaType: parseInt(item.type) || 0,
        video: extraInfo.video || '',
        picList: extraInfo.picList || [],
        publishTime: extraInfo.publishTime || '',
        title: item.title || '',
        content: item.content || '',
        selectedTags: extraInfo.tagList || [],
        tagList: extraInfo.tagList || [],
        selectedAccount: item.accountId || '',
        url: extraInfo.url || '',
        taskId: item.taskId || 0,
        publishStatus: item.publishStatus || 0,
        ifControlEvaluation: item.ifControlEvaluation || 0,
        controlEvaluationContent: item.controlEvaluationContent || '',
        ifBite: item.ifBite,
        biteNo: item.biteNo,
      };
    })
  };
}

/**
 * 组装提交数据
 */
function assembleArticleTaskBo() {
  return {
    taskName: step2FormData.value.taskName,
    platform: stepParams.value.platform,
    deviceType: stepParams.value.deviceType,
    accounts: selectedAccountDetails.value.map(account => ({
      id: account.id,
      accountName: account.name,
      groupId: account.groupId,
      platform: stepParams.value.platform,
      status: 1
    })),
    content: {
      taskName: step2FormData.value.taskName,
      contentGroups: step2FormData.value.contentGroups.map(group => ({
        type: group.mediaType.toString(),
        video: group.video,
        picList: group.picList,
        publishTime: group.publishTime,
        title: group.title,
        content: group.content,
        selectedTags: group.selectedTags,
        tagList: group.tagList,
        accountId: group.selectedAccount,
        url: group.url,
        taskId: 0,
        ifControlEvaluation: group.ifControlEvaluation,
        controlEvaluationContent: group.controlEvaluationContent,
        ifBite: group.ifBite,
        biteNo: group.biteNo
      }))
    },
    description: '',
    totalArticles: step2FormData.value.contentGroups.length,
    status: 0
  };
}

// ========== 8. 抽屉逻辑（修复 getVisible 报错 + 确保状态重置） ==========
const [Drawer, drawerApi] = useVbenDrawer({
  onCancel: handleCancel,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    // 抽屉关闭时立即重置所有状态（核心：替代原watch的逻辑）
    if (!isOpen) {
      resetAllFormState();
      return;
    }

    drawerApi.drawerLoading(true);
    const { id } = drawerApi.getData() as { id?: string };
    isUpdate.value = !!id;

    try {
      initPlatformDefaultValue();
      await loadGroups();

      if (isUpdate.value && id) {
        const detailData = await ArticleTaskApi.getDetail(id);
        await fillTaskDetailData(detailData);
      }
    } catch (error) {
      console.error('加载任务详情失败:', error);
      message.error('加载任务详情失败，请稍后重试');
    } finally {
      drawerApi.drawerLoading(false);
    }
  },
});

// ========== 9. 事件处理函数 ==========
function onPlatformChange(val: string) {
  stepParams.value.platform = val;
  stepParams.value.accountIds = [];
  groups.value = [];
  selectedGroupIds.value = [];
  step2FormData.value = null;
  currentStep.value = STEP_ACCOUNT_SELECT;

  setPlatformDefaultDeviceType(val);
  loadGroups();
}

async function handleConfirm() {
  if (currentStep.value === STEP_ACCOUNT_SELECT) {
    if (stepParams.value.accountIds.length === 0) {
      message.warning('请先选择账号');
      return;
    }
    if (stepParams.value.platform === PLATFORM_DOUYIN && !stepParams.value.deviceType) {
      message.warning('请选择终端类型');
      return;
    }
    currentStep.value = STEP_CONTENT_SETTING;
    return;
  }

  // 核心优化：调用step2的校验方法，校验通过才允许提交
  if (!step2.value) {
    message.warning('内容设置组件加载失败，请刷新重试');
    return;
  }

  // 调用子组件校验
  const isFormValid = await step2.value.validate();
  if (!isFormValid) {
    return;
  }

  // 校验通过后再获取表单数据（确保数据最新）
  step2FormData.value = step2.value.getFormData();

  if (!step2FormData.value) {
    message.warning('请完善内容设置');
    return;
  }

  try {
    const articleTaskBo = assembleArticleTaskBo();
    await ArticleTaskApi.create(articleTaskBo);
    message.success('任务创建成功');
    drawerApi.close();
    emit('reload');
  } catch (error) {
    console.error('创建文章任务失败:', error);
    message.error('任务创建失败，请稍后重试');
  }
}

function handleStep2DataUpdate(data: any) {
  step2FormData.value = data;
}

function handleReturn() {
  currentStep.value = STEP_ACCOUNT_SELECT;

  if (!isUpdate.value) {
    step2FormData.value = null;
    if (step2.value && typeof step2.value.resetForm === 'function') {
      step2.value.resetForm();
    }
  }
}

async function handleCancel() {
  drawerApi.close();
  // 冗余保障：再次调用重置（防止onOpenChange的重置没触发）
  resetAllFormState();
}
</script>

<template>
  <Drawer
    :draggable="true"
    :close-on-click-modal="false"
    :title="title"
    class="w-[45%]"
  >
    <div class="flex justify-center px-4">
      <div class="w-full max-w-[760px]">
        <a-steps
          :current="currentStep"
          status="process"
          size="small"
          type="navigation"
        >
          <a-step title="选择账号" />
          <a-step title="内容设置" />
        </a-steps>
      </div>
    </div>
    <a-divider class="!my-2" />
    <div class="space-y-6 px-6 py-4" v-if="currentStep === 0">
      <!-- 平台选择区域 -->
      <div class="flex items-center">
        <div class="flex w-full max-w-[760px] items-center gap-4">
          <span class="w-20 text-left text-base font-medium text-gray-700">
            选择平台
          </span>
          <a-segmented
            block
            v-model:value="stepParams.platform"
            :options="platformOptions"
            @change="onPlatformChange"
            class="flex-1"
          />
        </div>
      </div>

      <!-- 抖音平台的终端类型选择 -->
      <div v-if="stepParams.platform === '抖音'" class="flex w-full max-w-[760px] items-center gap-4 mt-4">
        <span class="w-20 text-left text-base font-medium text-gray-700">
          终端类型
        </span>
        <a-radio-group v-model:value="stepParams.deviceType" class="flex-1">
          <a-radio :value="DEVICE_TYPE_PC">PC端</a-radio>
          <a-radio :value="DEVICE_TYPE_MOBILE">手机端</a-radio>
        </a-radio-group>
      </div>

      <!-- 账号选择区域 -->
      <div>
        <div class="mb-3">
          <span class="text-base font-medium text-gray-700">选择账号</span>
        </div>
        <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <AccountSelect
            v-model="stepParams.accountIds"
            :selected-group-ids="selectedGroupIds"
            @update:selected-group-ids="(val) => (selectedGroupIds = val)"
            :platform="stepParams.platform"
            :groups="groups"
            :loading="loading"
          />
        </div>
      </div>

      <!-- 提示信息 -->
      <div>
        <a-alert
          type="warning"
          show-icon
          message="因渠道平台要求，请勿发布违规、搬运及低质内容，矩阵内容发布仅支持分发企业或商家内容。"
          class="rounded-lg"
        />
      </div>
    </div>
    <div class="space-y-6 px-6 py-4" v-if="currentStep === 1">
      <Step2
        :platform="stepParams.platform"
        ref="step2"
        :selected-accounts="selectedAccountDetails"
        :default-task-name="step2FormData?.taskName"
        :default-content-groups="step2FormData?.contentGroups"
        @update:form-data="handleStep2DataUpdate"
      />
    </div>
    <template #footer>
      <div class="flex w-full items-center justify-end px-4">
        <a-space :size="12">
          <a-button v-if="currentStep > 0" @click="handleReturn">
            上一步
          </a-button>
          <a-button
            v-if="!isUpdate || currentStep === 0"
            type="primary"
            @click="handleConfirm"
            :loading="loading"
          >
            {{ currentStep === 0 ? '下一步' : '提交' }}
          </a-button>
          <a-button
            v-else
            type="primary"
            disabled
          >
            仅查看，不可编辑
          </a-button>
        </a-space>
      </div>
    </template>
  </Drawer>
</template>
