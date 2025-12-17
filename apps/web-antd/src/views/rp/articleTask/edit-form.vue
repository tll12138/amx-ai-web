<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { DictEnum } from '@vben/constants';

import { message } from 'ant-design-vue';

import { AccountGroupApi } from '#/api/rp/accountGroup';
import { getDictOptions } from '#/utils/dict';
import Step2 from '#/views/rp/articleTask/components/step2.vue';

import AccountSelect from './components/AccountSelect.vue';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? '查看搬运任务' : '新增搬运任务';
});

interface StepParams {
  platform: any;
  groupId?: any;
  accountIds: any[];
  search?: string;
}
const currentStep = ref(0);
const platformOptions = ref(getDictOptions(DictEnum.RP_PLATFORMS));
const stepParams = ref<StepParams>({
  platform: undefined,
  groupId: undefined,
  accountIds: [],
  search: '',
});
const groups = ref<any[]>([]);
const loading = ref(false);
const step2FormData = ref<any>(null);
const step2 = ref<any>(null);
const selectedGroupIds = ref<string[]>([]); // 新增状态用于跟踪选中的分组

// 获取选中的账号详细信息
const selectedAccountDetails = computed(() => {
  const selectedIds = stepParams.value.accountIds;
  const allAccounts: any[] = [];

  // 从所有分组中提取账号数据
  groups.value.forEach((group) => {
    if (group.accounts && Array.isArray(group.accounts)) {
      group.accounts.forEach((account: any) => {
        allAccounts.push({
          id: account.id,
          name: account.accountName,
          groupId: group.id,
        });
      });
    }
  });

  // 返回选中的账号
  return allAccounts.filter((account) => selectedIds.includes(account.id));
});

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel: handleCancel,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return null;
    }
    drawerApi.drawerLoading(true);
    const { id } = drawerApi.getData() as { id?: string };
    isUpdate.value = !!id;

    // 只在第一次打开时初始化平台，避免在 step 切换时重复初始化
    if (!stepParams.value.platform) {
      stepParams.value.platform = platformOptions.value?.[0]?.value;
    }

    await loadGroups();
    drawerApi.drawerLoading(false);
  },
});

async function loadGroups() {
  // 只在平台真正变化时重新加载数据
  const currentPlatform = stepParams.value.platform;

  loading.value = true;
  try {
    // 使用新的接口获取分组和账号数据
    const groupsWithAccounts =
      await AccountGroupApi.listGroupAndAccount(currentPlatform);
    groups.value = groupsWithAccounts || [];
    console.log('加载平台数据成功:', currentPlatform, groupsWithAccounts);
  } catch (error) {
    console.error('加载分组数据失败:', error);
    groups.value = [];
  }
  loading.value = false;
}

function onPlatformChange(val: any) {
  console.log('平台变化事件触发:', {
    oldPlatform: stepParams.value.platform,
    newPlatform: val,
  });
  stepParams.value.platform = val;
  stepParams.value.accountIds = [];
  groups.value = [];
  selectedGroupIds.value = []; // 平台变化时也重置选中的分组
  loadGroups();
}

async function handleConfirm() {
  if (currentStep.value === 0) {
    // 第一步：选择账号
    if (stepParams.value.accountIds.length === 0) {
      message.warning('请先选择账号');
      return;
    }
    currentStep.value += 1;
  } else {
    // 第二步：提交表单
    if (!step2FormData.value) {
      message.warning('请完善内容设置');
      return;
    }
    console.log('提交表单数据:', step2.value.validate());

    // 这里可以添加最终的提交逻辑
    console.log('提交的数据:', {
      platform: stepParams.value.platform,
      accounts: selectedAccountDetails.value,
      content: step2FormData.value,
    });

    return;
    message.success('任务创建成功');
    drawerApi.close();
    emit('reload');
  }
}

// 处理step2表单数据更新
function handleStep2DataUpdate(data: any) {
  step2FormData.value = data;
}

function handleReturn() {
  console.log('返回上一步，当前平台:', stepParams.value.platform);
  console.log('当前选中的账号:', stepParams.value.accountIds);
  currentStep.value -= 1;
  // 返回上一步时不应该重置任何数据，保持原有选择状态
}

async function handleCancel() {
  drawerApi.close();
  stepParams.value.platform = undefined;
  groups.value = [];
  stepParams.value.groupId = undefined;
  stepParams.value.search = '';
  stepParams.value.accountIds = [];
  selectedGroupIds.value = []; // 关闭时也重置选中的分组
  currentStep.value = 0;
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
        @update:form-data="handleStep2DataUpdate"
      />
    </div>
    <template #footer>
      <div class="flex w-full items-center justify-end px-4">
        <a-space :size="12">
          <a-button v-if="currentStep > 0" @click="handleReturn">
            上一步
          </a-button>
          <a-button type="primary" @click="handleConfirm">
            {{ currentStep === 0 ? '下一步' : '提交' }}
          </a-button>
        </a-space>
      </div>
    </template>
  </Drawer>
</template>
