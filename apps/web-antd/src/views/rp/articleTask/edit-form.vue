<script setup lang="ts">
import {computed, ref, nextTick} from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { DictEnum } from '@vben/constants';

import { message } from 'ant-design-vue';

import { AccountGroupApi } from '#/api/rp/accountGroup';
import { getDictOptions } from '#/utils/dict';
import Step2 from '#/views/rp/articleTask/components/step2.vue';

import AccountSelect from './components/AccountSelect.vue';
import {ArticleTaskApi} from "#/api/rp/articleTask";

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
  deviceType: any;
}
const currentStep = ref(0);
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

    // 新增：标记是否已回填数据，避免重复执行
    let isDataFilled = false;

    try {
      let detailData = null;
      // 查看模式：获取任务详情
      if (isUpdate.value) {
        detailData = await ArticleTaskApi.getDetail(id);
        console.log('加载任务详情成功:', detailData);
      }

      // 初始化平台（优先用详情里的平台，无则取第一个）
      if (!stepParams.value.platform) {
        stepParams.value.platform = platformOptions.value?.[0]?.value;
        // 新增：抖音平台默认PC端
        if (stepParams.value.platform === '抖音') {
          stepParams.value.deviceType = '0';
        }
      }

      // 加载当前平台的分组和账号数据
      await loadGroups();

      // 查看模式：填充表单数据（适配新的详情结构）
      if (detailData) {
        // 新增：回填终端类型（优先用详情值，无则默认PC）
        stepParams.value.deviceType = detailData.deviceType || (stepParams.value.platform === '抖音' ? '0' : undefined);

        // 1. 回填选中的账号ID（从detailVos提取accountId）
        if (detailData.detailVos && Array.isArray(detailData.detailVos)) {
          const accountIds = detailData.detailVos.map(item => item.accountId);
          stepParams.value.accountIds = accountIds;

          // 2. 回填选中的分组（根据账号ID匹配所属分组）
          const accountDetails = selectedAccountDetails.value;
          const groupIds = [...new Set(accountDetails.map(account => account.groupId))];
          selectedGroupIds.value = groupIds;
        }

        // 3. 组装第二步表单数据（解析detailVos和extraInfo）
        if (detailData.detailVos && Array.isArray(detailData.detailVos)) {
          step2FormData.value = {
            taskName: detailData.taskName || '',
            contentGroups: detailData.detailVos.map((item, index) => {
              // 解析extraInfo JSON字符串（容错处理）
              let extraInfo = {};
              try {
                extraInfo = item.extraInfo ? JSON.parse(item.extraInfo) : {};
              } catch (e) {
                console.error(`解析第${index+1}条extraInfo失败:`, e);
                extraInfo = {};
              }

              return {
                mediaType: parseInt(item.type) || 0, // type: "0" -> 数字0
                video: extraInfo.video || '',
                picList: extraInfo.picList || [],
                publishTime: extraInfo.publishTime || '',
                title: item.title || '',
                content: item.content || '',
                selectedTags: extraInfo.tagList || [], // 标签列表
                tagList: extraInfo.tagList || [],
                selectedAccount: item.accountId || '', // 关联的账号ID
                url: extraInfo.url || '',
                taskId: item.taskId || 0,
                publishStatus: item.publishStatus || 0,
                ifControlEvaluation: item.ifControlEvaluation || 0,
                controlEvaluationContent:  item.controlEvaluationContent || '',
              };
            })
          };
          // 关键修改：先等数据赋值，再切换到第二步（确保props传递给Step2）
          await nextTick();
          currentStep.value = 1;

          // 兜底：props传递失败时，主动调用setFormData
          setTimeout(() => {
            if (!isDataFilled && step2.value && step2FormData.value) {
              step2.value.setFormData(step2FormData.value);
              isDataFilled = true;
              console.log('父组件兜底调用setFormData（仅一次）:', step2FormData.value);
            }
          }, 100);

          // 有内容时自动跳转到第二步（查看模式更友好）
          currentStep.value = 1;
        }
      }
    } catch (error) {
      console.error('加载任务详情失败:', error);
      message.error('加载任务详情失败，请稍后重试');
    } finally {
      drawerApi.drawerLoading(false);
    }
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
  selectedGroupIds.value = [];
  // 新增：清空第二步表单数据
  step2FormData.value = null;
  // 新增：重置步骤到第一步
  currentStep.value = 0;
  // 新增：抖音平台默认选中PC端，其他平台清空
  if (val === '抖音') {
    stepParams.value.deviceType = '0';
  } else {
    stepParams.value.deviceType = undefined;
  }
  loadGroups();
}

async function handleConfirm() {
  if (currentStep.value === 0) {
    // 第一步：选择账号
    if (stepParams.value.accountIds.length === 0) {
      message.warning('请先选择账号');
      return;
    }
    // 新增：抖音平台必须选择终端类型（兜底验证）
    if (stepParams.value.platform === '抖音' && !stepParams.value.deviceType) {
      message.warning('请选择终端类型');
      return;
    }
    currentStep.value += 1;
  } else {
    // 第二步：提交表单
    if (!step2FormData.value) {
      message.warning('请完善内容设置');
      return;
    }

    console.log('提交的数据:', {
      platform: stepParams.value.platform,
      accounts: selectedAccountDetails.value,
      content: step2FormData.value,
    });

    try {
      // 1. 组装 RpArticleTaskBo 核心数据
      const articleTaskBo = {
        // 任务名称（必填）
        taskName: step2FormData.value.taskName,
        // 平台标识（必填）
        platform: stepParams.value.platform,
        // 账号列表：映射为 RpAccount 结构
        accounts: selectedAccountDetails.value.map(account => ({
          id: account.id, // 账号ID（Long类型）
          accountName: account.name, // 账号名称
          groupId: account.groupId, // 所属分组ID
          platform: stepParams.value.platform, // 平台标识（冗余字段）
          status: 1 // 默认启用状态
        })),
        // 发布内容主体：RpContentInfo 结构
        content: {
          taskName: step2FormData.value.taskName,
          // 内容分组列表：映射为 RpContentGroupInfo 数组
          contentGroups: step2FormData.value.contentGroups.map(group => ({
            type: group.mediaType.toString(), // 媒体类型（0-图片 1-视频）
            video: group.video, // 视频地址
            picList: group.picList, // 图片地址列表
            publishTime: group.publishTime, // 发布时间
            title: group.title, // 笔记标题
            content: group.content, // 笔记正文
            selectedTags: group.selectedTags, // 选中的标签列表
            tagList: group.tagList, // 标签列表
            accountId: group.selectedAccount, // 选中的发布账号ID
            url: group.url, // 笔记链接
            taskId: 0, // 任务ID暂未生成，默认0
            ifControlEvaluation: group.ifControlEvaluation, // 是否控制评估（0-否 1-是）
            controlEvaluationContent: group.controlEvaluationContent // 控制评估内容
          }))
        },
        // 可选字段
        description: '', // 任务描述（日志无，默认空）
        totalArticles: step2FormData.value.contentGroups.length, // 文章数量（contentGroups长度）
        status: 0 // 任务状态：0-未开始
      };

      // 2. 调用创建接口
      await ArticleTaskApi.create(articleTaskBo);

      // 3. 提交成功处理
      message.success('任务创建成功');
      drawerApi.close();
      emit('reload');
    } catch (error) {
      // 4. 提交失败处理
      console.error('创建文章任务失败:', error);
      message.error('任务创建失败，请稍后重试');
    }
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
  if (!isUpdate.value) {
    step2FormData.value = null;
    // 兜底：调用Step2组件的重置方法（需子组件配合暴露）
    if (step2.value && typeof step2.value.resetForm === 'function') {
      step2.value.resetForm();
    }
  }
}

async function handleCancel() {
  drawerApi.close();
  // 2. 彻底重置所有表单相关状态（新增/查看模式通用）
  stepParams.value = {
    platform: undefined,
    groupId: undefined,
    accountIds: [],
    search: '',
  };
  groups.value = [];
  selectedGroupIds.value = [];
  step2FormData.value = null;
  currentStep.value = 0;
  isUpdate.value = false;

  // 3. 重置Step2组件内部表单（兜底）
  if (step2.value && typeof step2.value.resetForm === 'function') {
    step2.value.resetForm();
  }
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

      <!-- 新增：抖音平台的终端类型选择 -->
      <div v-if="stepParams.platform === '抖音'" class="flex w-full max-w-[760px] items-center gap-4 mt-4">
        <span class="w-20 text-left text-base font-medium text-gray-700">
          终端类型
        </span>
              <a-radio-group v-model:value="stepParams.deviceType" class="flex-1">
                <a-radio value='0'>PC端</a-radio>
                <a-radio value='1'>手机端</a-radio>
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
            v-if="!isUpdate||currentStep === 0"
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
