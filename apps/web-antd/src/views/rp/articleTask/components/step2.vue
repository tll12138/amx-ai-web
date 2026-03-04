<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, nextTick } from 'vue';

import { DictEnum } from '@vben/constants';

import { PlusOutlined } from '@ant-design/icons-vue';
import message from 'ant-design-vue/es/message';
import { Modal, Space, Empty } from 'ant-design-vue'; // 新增：导入Empty空数据组件

import { CommonApi } from '#/api/xhs/common';
import { ImageUpload, VideoUpload } from '#/components/upload';
import { getDictOptions } from '#/utils/dict';
import { GeneratedContentApi } from '#/api/ai/generatedContent';
import { BitAccountApi } from '#/api/rp/bitAccount';
import { useVbenVxeGrid, type VxeGridProps } from '#/adapter/vxe-table';

// ========================== 类型定义（集中管理）==========================
interface Account {
  id: string;
  name: string;
  groupId: string;
}

// 新增：比特账号类型定义
interface BitAccount {
  id: number;
  accountName: string;
  accountCode: string;
  status: number;
}

interface ContentGroup {
  mediaType: 0 | 1;
  video: string | string[];
  picList: any[];
  publishTime: string;
  title: string;
  content: string;
  selectedTags: string[];
  tagList: string[];
  selectedAccount: string;
  url: string;
  ifControlEvaluation: 0 | 1;
  controlEvaluationContent: string;
  ifBit: 0 | 1;
  selectedBitAccount: number | ''; // 修正：支持number（接口返回id是number）和空字符串
  taskId?: number;
  publishStatus?: number;
}

interface CreateForm {
  taskName: string;
  contentGroups: ContentGroup[];
}

interface Props {
  platform: string;
  selectedAccounts: Account[];
  defaultTaskName?: string;
  defaultContentGroups?: ContentGroup[];
}

// ========================== Props & Emits ==========================
const props = withDefaults(defineProps<Props>(), {
  platform: '',
  selectedAccounts: () => [],
  defaultTaskName: '',
  defaultContentGroups: () => [],
});

const emit = defineEmits<{
  accountChange: [accountId: string];
  'update:formData': [data: CreateForm];
  validate: [valid: boolean];
}>();

// ========================== 响应式数据（按功能分类）=========================
// 核心表单数据
const formState = reactive<CreateForm>({
  taskName: '',
  contentGroups: [],
});

// 加载状态
const loadingStates = reactive({
  parsing: [] as boolean[], // 解析链接加载
  optimize: [] as boolean[], // 文案优化加载
  selectContentGrid: false, // AI内容选择表格加载
  bitAccountLoading: false, // 新增：比特账号列表加载
});

// 存储比特账号列表（修正：指定BitAccount类型）
const bitAccountList = ref<BitAccount[]>([]);

// 辅助输入/存储
const assistState = reactive({
  videoUrlInputs: [] as string[], // 视频链接输入框
  originalContentMap: {} as Record<number, string>, // 原始文案映射
});

// 弹窗相关
const modalState = reactive({
  selectContentVisible: false,
  currentGroupIndex: -1,
});

// 初始化标记（避免重复执行）
const initFlags = reactive({
  isInitialized: false,
  isFormDataSet: false,
});

// ========================== 计算属性 ==========================
const selectedAccountObjList = computed<Account[]>(() => props.selectedAccounts || []);
const selectedAccountList = computed<string[]>(() => selectedAccountObjList.value.map(acc => acc.id));

// 平台标签数量限制
const maxTagCount = computed(() => {
  const platformLimitMap = {
    小红书: 10,
    抖音: 5,
  };
  return platformLimitMap[props.platform as keyof typeof platformLimitMap];
});

// 新增：比特账号列表空数据判断
const isBitAccountEmpty = computed(() => bitAccountList.value.length === 0);

// ========================== 通用工具方法（抽离重复逻辑）=========================
/**
 * 初始化内容组辅助数组（解析加载、视频输入、优化加载）
 * @param length 内容组数量
 */
const initContentGroupAssistArrays = (length: number) => {
  loadingStates.parsing = Array.from({ length }, () => false);
  loadingStates.optimize = Array.from({ length }, () => false);
  assistState.videoUrlInputs = Array.from({ length }, () => '');
};

/**
 * 解析关键词为标签列表（去重、清理分隔符）
 * @param keywordAnalysis 原始关键词数据
 * @returns 标准化标签列表
 */
const parseKeywordAnalysis = (keywordAnalysis: any): string[] => {
  if (!keywordAnalysis) return [];

  const keywordList = Array.isArray(keywordAnalysis) ? keywordAnalysis : [keywordAnalysis];
  const tagSet = new Set<string>();

  keywordList.forEach(keywordStr => {
    if (typeof keywordStr !== 'string' || !keywordStr.trim()) return;

    // 清理#号 + 按多分隔符拆分 + 去重
    keywordStr.replace(/#/g, '').trim()
      .split(/[,，、\s]+/)
      .forEach(tag => {
        const trimTag = tag.trim();
        if (trimTag) tagSet.add(trimTag);
      });
  });

  return Array.from(tagSet);
};

/**
 * 生成默认任务名称
 */
const generateTaskName = (): string => {
  if (!props.platform) return '';

  const platformName = getDictOptions(DictEnum.RP_PLATFORMS).find(opt => opt.value === props.platform)?.label || props.platform;
  const timeStr = new Date().toISOString().replaceAll(/[-T:Z.]/g, '').slice(0, 14);

  return `${platformName}-发布任务_${timeStr}`;
};

/**
 * 创建空的内容组
 * @param accountId 可选-默认选中的账号ID
 * @returns 空内容组
 */
const createEmptyContentGroup = (accountId = ''): ContentGroup => ({
  mediaType: 1, // 默认视频类型
  video: '',
  picList: [],
  publishTime: '',
  title: '',
  content: '',
  selectedTags: [],
  tagList: [],
  selectedAccount: accountId,
  url: '',
  ifControlEvaluation: 0,
  controlEvaluationContent: '',
  ifBit: 0,
  selectedBitAccount: '', // 初始值为空字符串
  taskId: undefined,
  publishStatus: undefined,
});

// ========================== 内容组操作方法 ==========================
/**
 * 添加内容组
 */
const addContentGroup = (): void => {
  formState.contentGroups.push(createEmptyContentGroup());
  initContentGroupAssistArrays(formState.contentGroups.length);
};

/**
 * 移除内容组
 * @param index 要移除的索引
 */
const removeContentGroup = (index: number): void => {
  if (formState.contentGroups.length <= 1) return;

  // 移除内容组
  formState.contentGroups.splice(index, 1);
  // 同步更新辅助数组
  loadingStates.parsing.splice(index, 1);
  loadingStates.optimize.splice(index, 1);
  assistState.videoUrlInputs.splice(index, 1);

  // 重新映射原始文案（修正索引）
  const newOriginalContentMap: Record<number, string> = {};
  Object.entries(assistState.originalContentMap).forEach(([key, value]) => {
    const numKey = Number(key);
    if (numKey < index) newOriginalContentMap[numKey] = value;
    if (numKey > index) newOriginalContentMap[numKey - 1] = value;
  });
  assistState.originalContentMap = newOriginalContentMap;
};

/**
 * 初始化默认内容组（统一入口）
 */
const initDefaultContentGroups = () => {
  // 优先使用父组件传入的默认值
  if (props.defaultContentGroups?.length) {
    formState.contentGroups = props.defaultContentGroups.map(group => ({
      mediaType: group.mediaType || 0,
      video: group.video || '',
      picList: group.picList || [],
      publishTime: group.publishTime || '',
      title: group.title || '',
      content: group.content || '',
      selectedTags: group.selectedTags || [],
      tagList: group.tagList || [],
      selectedAccount: group.selectedAccount || '',
      url: group.url || '',
      ifControlEvaluation: group.ifControlEvaluation || 0,
      controlEvaluationContent: group.controlEvaluationContent || '',
      ifBit: group.ifBit || 0,
      selectedBitAccount: group.selectedBitAccount || '', // 兼容空值
      taskId: group.taskId || undefined,
      publishStatus: group.publishStatus || undefined,
    }));
    initFlags.isFormDataSet = true;
  } else {
    // 无默认值时，为每个选中账号创建内容组
    formState.contentGroups = props.selectedAccounts.map(account => createEmptyContentGroup(account.id));
  }

  // 初始化辅助数组
  initContentGroupAssistArrays(formState.contentGroups.length);
};

// ========================== 文案优化/回退 ==========================
/**
 * 优化文案
 * @param groupIndex 内容组索引
 */
const optimizeContent = async (groupIndex: number) => {
  const group = formState.contentGroups[groupIndex];
  if (!group?.content.trim()) {
    message.warn('请输入需要优化的文案内容');
    return;
  }

  // 首次优化时保存原始内容
  if (!assistState.originalContentMap[groupIndex]) {
    assistState.originalContentMap[groupIndex] = group.content;
  }

  try {
    loadingStates.optimize[groupIndex] = true;
    const res = await CommonApi.generateContent({ content: group.content.trim() });

    if (res) {
      group.content = res.content || res.title || '';
      message.success('文案优化成功');
    } else {
      message.warn('未获取到优化后的文案');
    }
  } catch (error) {
    console.error('文案优化失败:', error);
    message.error('文案优化失败，请稍后重试');
  } finally {
    loadingStates.optimize[groupIndex] = false;
  }
};

/**
 * 回退文案到优化前
 * @param groupIndex 内容组索引
 */
const revertContent = (groupIndex: number) => {
  const originalContent = assistState.originalContentMap[groupIndex];
  if (!originalContent) {
    message.warn('暂无可回退的原始文案');
    return;
  }

  formState.contentGroups[groupIndex].content = originalContent;
  message.success('文案已回退到优化前版本');
};

// ========================== 链接解析/媒体处理 ==========================
/**
 * 切换媒体类型
 * @param value 媒体类型 0-图片 1-视频
 * @param groupIndex 内容组索引
 */
const handleChangeMediaType = (value: 0 | 1, groupIndex: number): void => {
  formState.contentGroups[groupIndex].mediaType = value;
};

/**
 * 解析小红书链接
 * @param groupIndex 内容组索引
 */
const HandleXHSUrl = async (groupIndex: number): Promise<void> => {
  const group = formState.contentGroups[groupIndex];
  if (!group?.url) {
    message.warn('请输入待解析的链接');
    return;
  }

  try {
    loadingStates.parsing[groupIndex] = true;
    const response = await CommonApi.handleXhsUrl({ url: group.url });
    if (!response) return;

    // 填充基础信息
    group.title = response.title || '';
    group.content = response.desc || '';

    // 处理媒体内容
    if (response.videoUrl) {
      group.mediaType = 1;
      group.video = response.videoUrl;
      group.picList = [];
    } else if (response.imageList?.length) {
      group.mediaType = 0;
      group.picList = response.imageList;
      group.video = '';
    }

    // 处理标签（按平台限制）
    if (response.tags && Array.isArray(response.tags)) {
      group.tagList = response.tags;
      const limit = maxTagCount.value ?? 5; // 无限制时默认5个
      group.selectedTags = response.tags.slice(0, limit);
    }

    message.success('链接解析成功');
  } catch (error) {
    console.error('解析失败:', error);
    message.error('链接解析失败，请检查链接有效性');
  } finally {
    loadingStates.parsing[groupIndex] = false;
  }
};

/**
 * 应用视频链接
 * @param groupIndex 内容组索引
 */
const applyVideoUrl = (groupIndex: number) => {
  const url = assistState.videoUrlInputs[groupIndex];
  if (!url || (!url.startsWith('http') && !url.startsWith('blob:'))) {
    message.warn('请输入有效的视频链接');
    return;
  }

  formState.contentGroups[groupIndex].video = url;
};

// ========================== 标签/账号验证 ==========================
/**
 * 检查账号是否已被使用
 * @param accountId 账号ID
 * @param excludeGroupIndex 排除的索引（当前编辑的内容组）
 * @returns 是否已使用
 */
const isAccountUsed = (accountId: string, excludeGroupIndex: number): boolean => {
  return formState.contentGroups.some(
    (group, index) => index !== excludeGroupIndex && group.selectedAccount === accountId
  );
};

/**
 * 标签变化处理（限制数量）
 * @param newTags 新标签列表
 * @param groupIndex 内容组索引
 */
const handleTagsChange = (newTags: string[], groupIndex: number) => {
  const limit = maxTagCount.value;
  if (limit === undefined || newTags.length <= limit) {
    formState.contentGroups[groupIndex].selectedTags = newTags;
    return;
  }

  // 超出限制时截断并提示
  formState.contentGroups[groupIndex].selectedTags = newTags.slice(0, limit);
  message.warn(`最多只能选择 ${limit} 个标签`);
};

// ========================== 表单验证 ==========================
/**
 * 验证单个内容组
 * @param group 内容组
 * @param index 索引（用于提示）
 * @returns 是否验证通过
 */
const validateContentGroup = (group: ContentGroup, index: number): boolean => {
  if (!group.selectedAccount) {
    message.warn(`内容组 ${index + 1} 请选择分发账号`);
    return false;
  }

  if (!group.content) {
    message.warn(`内容组 ${index + 1} 请输入正文内容`);
    return false;
  }

  // 媒体验证
  if (group.mediaType === 0 && group.picList.length === 0) {
    message.warn(`内容组 ${index + 1} 请上传图片`);
    return false;
  }
  if (group.mediaType === 1 && !group.video) {
    message.warn(`内容组 ${index + 1} 请上传视频`);
    return false;
  }

  // 新增：比特账号验证（开启比特时必填）
  if (group.ifBit === 1 && !group.selectedBitAccount) {
    message.warn(`内容组 ${index + 1} 开启比特后请选择比特账号`);
    return false;
  }

  return true;
};

/**
 * 整体表单验证
 * @returns 是否验证通过
 */
const validate = async (): Promise<boolean> => {
  try {
    // 基础验证
    if (!formState.taskName) {
      message.warn('请输入任务名称');
      return false;
    }

    // 验证所有内容组
    for (let i = 0; i < formState.contentGroups.length; i++) {
      const group = formState.contentGroups[i];
      if (!group || !validateContentGroup(group, i)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('表单验证失败:', error);
    return false;
  }
};

// ========================== AI内容选择 ==========================
// 表格配置
const selectContentGridOptions: VxeGridProps = {
  checkboxConfig: { highlight: true, reserve: true, trigger: 'cell' },
  columns: [
    { type: 'checkbox', width: 60 },
    { title: '生成时间', field: 'generateTime', width: 200 },
    { title: '解析标题', field: 'parsedTitle', minWidth: 180 },
    { title: '解析正文', field: 'parsedParagraphs', minWidth: 300, showOverflow: 'tooltip' },
    { title: '解析标签', field: 'keywordAnalysis', width: 200 },
  ],
  height: 400,
  keepSource: true,
  pagerConfig: { pageSize: 10 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        loadingStates.selectContentGrid = true;
        try {
          return await GeneratedContentApi.getList({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            orderByColumn: 'generateTime',
            isAsc: 'desc',
            isUsed: '0'
          });
        } finally {
          loadingStates.selectContentGrid = false;
        }
      },
    },
  },
  rowConfig: { keyField: 'id' },
  toolbarConfig: { refresh: true },
};

// 初始化表格
const [SelectContentTable, selectContentTableApi] = useVbenVxeGrid({
  gridOptions: selectContentGridOptions,
});

/**
 * 打开AI内容选择弹窗
 * @param index 内容组索引
 */
const openSelectContentModal = (index: number) => {
  modalState.currentGroupIndex = index;
  modalState.selectContentVisible = true;
  selectContentTableApi.reload();
};

/**
 * 确认选择AI内容并填充
 */
const handleSelectContentConfirm = async () => {
  const selectedRows = selectContentTableApi.grid.getCheckboxRecords();
  if (selectedRows.length === 0) {
    message.warn('请选择至少一条AI生成内容');
    return;
  }

  const targetGroup = formState.contentGroups[modalState.currentGroupIndex];
  const selectedRow = selectedRows[0]; // 仅取第一条

  try {
    // 填充基础字段
    targetGroup.title = selectedRow.parsedTitle || '';
    targetGroup.content = selectedRow.parsedParagraphs || '';

    // 解析标签并按平台限制选择
    const tagList = parseKeywordAnalysis(selectedRow.keywordAnalysis);
    targetGroup.tagList = tagList;
    const limit = maxTagCount.value ?? 5;
    targetGroup.selectedTags = tagList.slice(0, limit);

    message.success('AI生成内容填充成功');
    modalState.selectContentVisible = false;
  } catch (e) {
    console.error('解析AI内容失败:', e);
    message.error('解析AI内容失败，请检查数据格式');
  }
};

/**
 * 获取比特账号列表（核心优化：解析rows数组）
 */
const fetchBitAccountList = async () => {
  if (props.platform !== '抖音') {
    bitAccountList.value = []; // 非抖音平台清空列表
    return;
  }

  try {
    loadingStates.bitAccountLoading = true;
    const res = await BitAccountApi.getList(); // 调用比特账号列表接口

    bitAccountList.value = res?.rows || [];
  } catch (error) {
    console.error('获取比特账号列表失败:', error);
    message.error('获取比特账号列表失败，请稍后重试');
    bitAccountList.value = []; // 出错时清空列表
  } finally {
    loadingStates.bitAccountLoading = false;
  }
};

// ========================== 监听逻辑 ==========================
// 表单数据变化时通知父组件
watch(
  () => formState,
  (newValue) => emit('update:formData', newValue),
  { deep: true }
);

// 平台变化时生成任务名称（仅无默认名称时）
watch(
  () => props.platform,
  (newVal) => {
    if (newVal && !props.defaultTaskName) {
      formState.taskName = generateTaskName();
    }
    // 新增：平台切换时重新加载比特账号列表
    fetchBitAccountList();
  },
  { immediate: true }
);

// 监听默认数据变化（仅初始化一次）
watch(
  [() => props.defaultContentGroups, () => props.defaultTaskName],
  ([newContentGroups, newTaskName]) => {
    if (initFlags.isFormDataSet || !newContentGroups?.length) return;

    // 填充默认任务名称
    if (newTaskName?.trim()) {
      formState.taskName = newTaskName;
    }
    // 初始化内容组（已封装到initDefaultContentGroups）
    initDefaultContentGroups();
  },
  { immediate: true }
);

// 监听选中账号变化（仅初始化一次）
watch(
  () => props.selectedAccounts,
  async (newSelectedAccounts) => {
    if (initFlags.isInitialized || props.defaultContentGroups?.length) return;
    await nextTick();
    initDefaultContentGroups();
    initFlags.isInitialized = true;
  },
  { immediate: true }
);

// ========================== 生命周期 & 暴露方法 ==========================
onMounted(() => {
  // 初始化任务名称（无默认值时）
  if (!props.defaultTaskName) {
    formState.taskName = generateTaskName();
  }
  // 初始化内容组（防止watch未触发的兜底）
  if (!initFlags.isInitialized && !props.defaultContentGroups?.length) {
    initDefaultContentGroups();
    initFlags.isInitialized = true;
  }
  // 加载比特账号列表
  fetchBitAccountList();
});

// 暴露给父组件的方法
defineExpose({
  validate,
  getFormData: () => formState,
  setFormData: (data: CreateForm) => {
    formState.taskName = data.taskName || '';
    formState.contentGroups = data.contentGroups || [];
    // 同步更新辅助数组
    initContentGroupAssistArrays(formState.contentGroups.length);
    assistState.originalContentMap = {}; // 清空原始文案映射
    initFlags.isFormDataSet = true;
  }
});
</script>

<template>
  <!-- 模板部分完全保留原有逻辑，仅优化比特账号选择器 -->
  <div class="step2-container">
    <!-- 已选择账号展示 -->
    <a-form-item label="已选择账号">
      <div style="display: flex">
        <span
          style="
            max-width: 580px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-right: 10px;
          "
        >
          {{
            Array.from(
              selectedAccountObjList,
              (account) => account.name,
            ).toString()
          }}
        </span>
        <span v-if="selectedAccountObjList.length > 1">
          等 {{ selectedAccountList.length }} 个账号
        </span>
      </div>
    </a-form-item>

    <!-- 任务名称 -->
    <a-form-item label="任务名称" prop="taskName" style="margin-bottom: 30px">
      <div class="flex justify-between">
        <a-input
          v-model:value="formState.taskName"
          clearable
          placeholder="当前任务名称，方便任务间区别"
          style="width: 360px"
        />
        <a-button type="primary" @click="addContentGroup">
          <PlusOutlined />
          添加内容组
        </a-button>
      </div>
    </a-form-item>

    <a-divider content-position="center" content="123">
      内容设置区域
    </a-divider>

    <!-- 内容组列表 -->
    <div class="content-groups">
      <div
        v-for="(contentGroup, groupIndex) in formState.contentGroups"
        :key="groupIndex"
        class="content-group-card"
      >
        <!-- 内容组头部 -->
        <div class="content-group-header">
          <div class="header-left">
            <div class="group-title">
              <i class="a-icon-document"></i>
              <span>内容组 {{ groupIndex + 1 }}</span>
            </div>
          </div>
          <div class="header-actions">
            <!-- 选择AI生成内容按钮 -->
            <a-button
              type="default"
              style="margin-right: 8px"
              @click="openSelectContentModal(groupIndex)"
            >
              选择AI生成内容
            </a-button>
            <a-input-search
              v-model:value="contentGroup.url"
              allow-clear
              placeholder="请输入待解析链接"
            >
              <template #enterButton>
                <a-button
                  :loading="loadingStates.parsing[groupIndex]"
                  pre-icon="ant-design:search-outlined"
                  type="primary"
                  @click="HandleXHSUrl(groupIndex)"
                >
                  一键解析
                </a-button>
              </template>
            </a-input-search>
          </div>
        </div>

        <!-- 内容组主体 -->
        <div class="content-group-body">
          <!-- 分发账号选择 -->
          <div class="form-section account-section">
            <a-row>
              <a-col :span="12">
                <div class="section-title">
                  <i class="a-icon-user"></i>
                  <span>分发账号</span>
                  <span class="required">*</span>
                </div>
                <a-select
                  v-model:value="contentGroup.selectedAccount"
                  class="account-select"
                  clearable
                  placeholder="请选择要分发的账号"
                >
                  <a-select-option
                    v-for="account in selectedAccountObjList"
                    :key="account.id"
                    :disabled="isAccountUsed(account.id, groupIndex)"
                    :label="account.name"
                    :value="account.id"
                  >
                    <div class="account-option">
                      <span class="account-name">{{ account.name }}</span>
                      <span
                        v-if="isAccountUsed(account.id, groupIndex)"
                        class="account-used"
                      >
                        -[已使用]
                      </span>
                    </div>
                  </a-select-option>
                </a-select>
              </a-col>
              <a-col :offset="2" :span="10">
                <!-- 媒体类型选择 -->
                <div class="form-section media-section">
                  <div class="section-title">
                    <i class="a-icon-picture-outline"></i>
                    <span>媒体类型</span>
                  </div>
                  <a-segmented
                    v-model:value="contentGroup.mediaType"
                    :options="[
                      { label: '视频', value: 1 },
                      { label: '图片', value: 0 },
                    ]"
                  />
                </div>
              </a-col>
            </a-row>
          </div>

          <!-- 视频上传 -->
          <div
            v-if="contentGroup.mediaType === 1"
            class="form-section upload-section"
          >
            <div class="section-title">
              <i class="a-icon-video-camera"></i>
              <span>视频</span>
              <span class="required">*</span>
            </div>
            <VideoUpload
              v-model:value="contentGroup.video"
              :max-size="100"
              :accept="['mp4', 'avi', 'mov', 'webm']"
              help-text="最大100MB"
              :width="120"
              :height="160"
            />
            <a-input-search
              v-model:value="assistState.videoUrlInputs[groupIndex]"
              placeholder="如果有视频链接也可以直接放入视频链接"
              enter-button="确定"
              allow-clear
              @search="applyVideoUrl(groupIndex)"
              style="margin-top: 12px"
            />
          </div>

          <!-- 图片上传 -->
          <div
            v-if="contentGroup.mediaType === 0"
            class="form-section upload-section"
          >
            <div class="section-title">
              <i class="a-icon-picture"></i>
              <span>图片列表</span>
              <span class="required">*</span>
            </div>
            <ImageUpload
              v-model:value="contentGroup.picList"
              :max-number="9"
              :multiple="true"
              :show-description="false"
              list-type="picture-card"
            />
          </div>

          <a-row>
            <a-col :span="12">
              <!-- 标题 -->
              <div class="form-section content-section">
                <div class="section-title">
                  <i class="a-icon-edit-outline"></i>
                  <span>标题</span>
                </div>
                <a-input
                  v-model:value="contentGroup.title"
                  :maxlength="20"
                  placeholder="标题内容，不超过20个字"
                  class="content-input"
                  show-count
                />
              </div>
            </a-col>
            <a-col :offset="2" :span="10">
              <!-- 发布时间 -->
              <div class="form-section time-section">
                <div class="section-title">
                  <i class="a-icon-time"></i>
                  <span>发布时间</span>
                </div>
                <a-date-picker
                  v-model="contentGroup.publishTime"
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择发布时间"
                  style="width: 100%"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm"
                />
              </div>
            </a-col>
          </a-row>

          <!-- 正文 -->
          <div class="form-section content-section">
            <div class="section-title">
              <i class="a-icon-document"></i>
              <span>正文</span>
              <span class="required">*</span>
            </div>
            <a-textarea
              v-model:value="contentGroup.content"
              placeholder="正文内容，不超过900个字"
              :rows="5"
              class="content-textarea"
              :maxlength="900"
              show-count
            />
            <!-- 小红书专属：文案优化和回退按钮 -->
            <div v-if="props.platform === '小红书'" class="optimize-btn-group" style="margin-top: 8px;">
              <a-button
                type="primary"
                size="small"
                :loading="loadingStates.optimize[groupIndex]"
                @click="optimizeContent(groupIndex)"
                style="margin-right: 8px"
              >
                文案优化
              </a-button>
              <a-button
                size="small"
                @click="revertContent(groupIndex)"
                :disabled="!assistState.originalContentMap[groupIndex]"
              >
                回退
              </a-button>
            </div>
          </div>

          <!-- 标签选择 -->
          <div class="form-section tag-section">
            <div class="section-title">
              <i class="a-icon-collection-tag"></i>
              <span>标签</span>
            </div>
            <a-select
              v-model:value="contentGroup.selectedTags"
              show-search
              allow-clear
              default-active-first-option
              mode="tags"
              placeholder="请选择标签"
              style="width: 100%"
              @change="(newTags) => handleTagsChange(newTags, groupIndex)"
            >
              <a-select-option
                v-for="tag in contentGroup.tagList"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </a-select>
          </div>

          <!-- 抖音专属：控评设置 -->
          <div v-if="props.platform === '抖音'" class="form-section control-evaluation-section" style="margin-top: 24px;">
            <div class="section-title">
              <i class="a-icon-message"></i>
              <span>控评设置</span>
            </div>
            <a-space direction="vertical" style="width: 100%">
              <a-space>
                <span>是否控评：</span>
                <a-switch
                  v-model:checked="contentGroup.ifControlEvaluation"
                  :checked-value="1"
                  :unchecked-value="0"
                />
              </a-space>
              <a-textarea
                v-if="contentGroup.ifControlEvaluation === 1"
                v-model:value="contentGroup.controlEvaluationContent"
                placeholder="请输入控评内容，例如：置顶评论、引导关注等"
                :rows="3"
                :maxlength="500"
                show-count
              />
            </a-space>
          </div>

          <!-- 抖音专属：比特设置（优化后） -->
          <div v-if="props.platform === '抖音'" class="form-section control-evaluation-section" style="margin-top: 24px;">
            <div class="section-title">
              <i class="a-icon-message"></i>
              <span>比特设置</span>
            </div>
            <a-space direction="vertical" style="width: 100%">
              <a-space>
                <span>是否比特：</span>
                <a-switch
                  v-model:checked="contentGroup.ifBit"
                  :checked-value="1"
                  :unchecked-value="0"
                />
              </a-space>

              <!-- 比特账号选择器 -->
              <div v-if="contentGroup.ifBit === 1" style="width: 100%; margin-top: 8px;">
                <a-select
                  v-model:value="contentGroup.selectedBitAccount"
                  :loading="loadingStates.bitAccountLoading"
                  placeholder="请选择比特账号"
                  style="width: 100%"
                  allow-clear
                  :disabled="isBitAccountEmpty && !loadingStates.bitAccountLoading"
                >
                  <!-- 空数据提示 -->
                  <template v-if="isBitAccountEmpty && !loadingStates.bitAccountLoading">
                    <a-select-option value="" disabled>
                      <Empty description="暂无可用的比特账号" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
                    </a-select-option>
                  </template>

                  <!-- 比特账号选项 -->
                  <a-select-option
                    v-for="item in bitAccountList"
                    :key="item.id"
                    :label="item.accountName"
                    :value="item.id"
                  >
                    {{ item.accountName }}（{{ item.accountCode }}）
                  </a-select-option>
                </a-select>

                <!-- 空数据提示文本 -->
                <div v-if="isBitAccountEmpty && !loadingStates.bitAccountLoading" style="margin-top: 8px; color: #999; font-size: 12px;">
                  暂无比特账号数据，请联系管理员添加
                </div>
              </div>
            </a-space>
          </div>

          <!-- 删除按钮 -->
          <div
            v-if="formState.contentGroups.length > 1"
            class="group-remove-btn"
          >
            <a-button
              pre-icon="ant-design:delete-outlined"
              size="small"
              type="text"
              danger
              @click="removeContentGroup(groupIndex)"
            >
              删除内容组
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- AI生成内容选择弹窗 -->
    <Modal
      v-model:open="modalState.selectContentVisible"
      title="选择AI生成内容"
      width="80%"
      destroyOnClose
      @ok="handleSelectContentConfirm"
      @cancel="modalState.selectContentVisible = false"
    >
      <div style="height: 400px; margin-bottom: 16px">
        <SelectContentTable :table-loading="loadingStates.selectContentGrid" />
      </div>
      <template #footer>
        <Space>
          <a-button @click="modalState.selectContentVisible = false">取消</a-button>
          <a-button type="primary" @click="handleSelectContentConfirm">确认选择</a-button>
        </Space>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
/* 样式部分完全保留 */
.step2-container {
  padding: 20px;
}

.content-groups {
  margin-top: 20px;
}

.content-group-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.content-group-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.group-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.status-dot.active {
  background: #52c41a;
}

.status-text {
  font-size: 14px;
  color: #8c8c8c;
}

.status-text:has(+ .status-dot.active) {
  color: #52c41a;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  margin-left: 20px;
}

.header-actions .a-input {
  flex: 1;
}

.content-group-body {
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.required {
  color: #ff4d4f;
  margin-left: 4px;
}

.account-select {
  width: 100%;
}

.account-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-used {
  color: grey;
  font-size: 12px;
}

.media-switch {
  transform: scale(1.1);
}

.upload-tips {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
  font-size: 12px;
  color: #fa8c16;
  line-height: 1.5;
}

.content-input {
  width: 100%;
}

.content-textarea {
  width: 100%;
}

.group-remove-btn {
  text-align: right;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.add-group-section {
  text-align: center;
  margin-top: 20px;
  margin-bottom: 20px;
}

.add-group-section .a-button {
  width: 200px;
  height: 40px;
  font-size: 14px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .content-group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    margin-left: 0;
  }

  .header-actions .a-input {
    width: 100%;
  }

  .content-group-body {
    padding: 16px;
  }
}
</style>
