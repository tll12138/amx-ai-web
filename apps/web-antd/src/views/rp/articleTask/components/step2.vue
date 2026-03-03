<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, nextTick } from 'vue';

import { DictEnum } from '@vben/constants';

import { PlusOutlined } from '@ant-design/icons-vue';
import message from 'ant-design-vue/es/message';
import { Modal, Space } from 'ant-design-vue';

import { CommonApi } from '#/api/xhs/common';
import { ImageUpload, VideoUpload } from '#/components/upload';
import { getDictOptions } from '#/utils/dict';
import { GeneratedContentApi } from '#/api/ai/generatedContent'; // 引入AI内容API
import { useVbenVxeGrid, type VxeGridProps } from '#/adapter/vxe-table'; // 引入表格适配器

// 定义接口类型
interface Account {
  id: string;
  name: string;
  groupId: string;
}

interface ContentGroup {
  mediaType: 0 | 1;
  video: string | string[];
  picList: any[]; // 允许接收图片URL列表
  publishTime: string;
  title: string;
  content: string;
  selectedTags: string[];
  tagList: string[];
  selectedAccount: string;
  url: string;
  ifControlEvaluation: 0 | 1;
  controlEvaluationContent: string;
}

interface CreateForm {
  taskName: string;
  contentGroups: ContentGroup[];
}

// Props定义
interface Props {
  platform: string;
  selectedAccounts: Account[];
  defaultTaskName?: string;
  defaultContentGroups?: ContentGroup[];
}

const props = withDefaults(defineProps<Props>(), {
  platform: '',
  selectedAccounts: () => [],
  defaultTaskName: '',
  defaultContentGroups: () => [],
});

// Emits定义
const emit = defineEmits<{
  accountChange: [accountId: string];
  'update:formData': [data: CreateForm];
  validate: [valid: boolean];
}>();

// 响应式数据
const formState = reactive<CreateForm>({
  taskName: '',
  contentGroups: [],
});

// Loading states for parsing
const parsingLoading = ref<boolean[]>([]);

// 用于存储每个内容组的视频链接输入
const videoUrlInputs = ref<string[]>([]);

// 文案优化相关状态
const optimizeLoading = ref<boolean[]>([]); // 每个内容组的优化加载状态
const originalContentMap = ref<Record<number, string>>({}); // 存储每个内容组的原始正文（用于回退）

// AI内容选择弹窗相关
const selectContentModalVisible = ref(false); // 选择弹窗是否显示
const currentGroupIndex = ref(-1); // 当前操作的内容组索引
const selectContentGridLoading = ref(false); // 选择列表加载状态

// 标记是否已初始化，避免重复覆盖
const isInitialized = ref(false);
// 标记是否已设置表单数据
const isFormDataSet = ref(false);

// 解析keywordAnalysis为干净的标签列表（处理#、逗号、顿号、空格分隔）
const parseKeywordAnalysis = (keywordAnalysis: any): string[] => {
  if (!keywordAnalysis) return [];

  // 统一转成数组处理（兼容字符串/数组格式）
  const keywordList = Array.isArray(keywordAnalysis) ? keywordAnalysis : [keywordAnalysis];

  // 使用Set自动去重
  const tagSet = new Set<string>();

  // 遍历每个关键词字符串，解析标签
  keywordList.forEach(keywordStr => {
    if (typeof keywordStr !== 'string' || !keywordStr.trim()) return;

    // 步骤1：移除所有#号
    let cleanStr = keywordStr.replace(/#/g, '').trim();
    // 步骤2：按 逗号(中英文)、顿号、空格 分割成单个标签
    const tags = cleanStr.split(/[,，、\s]+/);
    // 步骤3：过滤空标签并去重
    tags.forEach(tag => {
      const trimTag = tag.trim();
      if (trimTag) {
        tagSet.add(trimTag);
      }
    });
  });

  // 转数组返回（保证顺序且去重）
  return Array.from(tagSet);
};

// 选择列表表格配置
const selectContentGridOptions: VxeGridProps = {
  checkboxConfig: {
    highlight: true,
    reserve: true,
    trigger: 'cell',
  },
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
        selectContentGridLoading.value = true;
        try {
          const res = await GeneratedContentApi.getList({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            orderByColumn: 'generateTime',
            isAsc: 'desc',
            isUsed: '0'
          });
          return res;
        } finally {
          selectContentGridLoading.value = false;
        }
      },
    },
  },
  rowConfig: { keyField: 'id' },
  toolbarConfig: { refresh: true },
};

// 初始化选择列表表格
const [SelectContentTable, selectContentTableApi] = useVbenVxeGrid({
  gridOptions: selectContentGridOptions,
});

// 计算属性
const selectedAccountObjList = computed<Account[]>(() => {
  return props.selectedAccounts || [];
});

const selectedAccountList = computed<string[]>(() => {
  return selectedAccountObjList.value.map((acc) => acc.id);
});

const maxTagCount = computed(() => {
  // 平台标识符: 小红书，抖音
  if (props.platform === '小红书') {
    return 10;
  }
  if (props.platform === '抖音') {
    return 5;
  }
  return undefined; // 其他平台无限制
});

// 方法定义
const generateTaskName = (): string => {
  if (!props.platform) {
    return '';
  }

  const platformOptions = getDictOptions(DictEnum.RP_PLATFORMS);
  const platformName =
    platformOptions.find((opt) => opt.value === props.platform)?.label ||
    props.platform;

  return `${platformName}-发布任务_${new Date()
    .toISOString()
    .replaceAll(/[-T:Z.]/g, '')
    .slice(0, 14)}`;
};

const addContentGroup = (): void => {
  const newGroup: ContentGroup = {
    mediaType: 0,
    video: '',
    picList: [],
    publishTime: '',
    title: '',
    content: '',
    selectedTags: [],
    tagList: [],
    selectedAccount: '',
    url: '',
    ifControlEvaluation: 0,
    controlEvaluationContent: '',
  };

  formState.contentGroups.push(newGroup);
  parsingLoading.value.push(false);
  videoUrlInputs.value.push('');
  optimizeLoading.value.push(false); // 初始化优化加载状态
};

const removeContentGroup = (index: number): void => {
  if (formState.contentGroups.length > 1) {
    formState.contentGroups.splice(index, 1);
    // Remove the corresponding loading state
    parsingLoading.value.splice(index, 1);
    videoUrlInputs.value.splice(index, 1);
    optimizeLoading.value.splice(index, 1); // 移除对应优化加载状态

    // 清理原始内容映射并重新索引
    delete originalContentMap.value[index];
    const newMap: Record<number, string> = {};
    Object.keys(originalContentMap.value).forEach(key => {
      const numKey = Number(key);
      if (numKey > index) {
        newMap[numKey - 1] = originalContentMap.value[numKey];
      } else if (numKey < index) {
        newMap[numKey] = originalContentMap.value[numKey];
      }
    });
    originalContentMap.value = newMap;
  }
};

// 文案优化方法
const optimizeContent = async (groupIndex: number) => {
  const group = formState.contentGroups[groupIndex];
  console.log('optimizeContent', group.content);
  if (!group || !group.content.trim() || '') {
    message.warn('请输入需要优化的文案内容');
    return;
  }

  // 保存原始内容（仅第一次优化时保存）
  if (!originalContentMap.value[groupIndex]) {
    originalContentMap.value[groupIndex] = group.content;
  }

  try {
    optimizeLoading.value[groupIndex] = true;
    // 调用AI文案优化API（需根据实际接口调整参数）
    const res = await CommonApi.generateContent({
      content: group.content.trim(),
    });

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
    optimizeLoading.value[groupIndex] = false;
  }
};

// 文案回退方法
const revertContent = (groupIndex: number) => {
  const group = formState.contentGroups[groupIndex];
  const originalContent = originalContentMap.value[groupIndex];

  if (originalContent) {
    group.content = originalContent;
    // 可选：回退后清空该索引的原始内容（下次优化重新保存）
    // delete originalContentMap.value[groupIndex];
    message.success('文案已回退到优化前版本');
  } else {
    message.warn('暂无可回退的原始文案');
  }
};

const handleChangeMediaType = (value: 0 | 1, groupIndex: number): void => {
  const group = formState.contentGroups[groupIndex];
  console.log('切换媒体类型:', value, '内容组索引:', groupIndex);
  if (group) {
    group.mediaType = value;
  }
};

const isAccountUsed = (
  accountId: string,
  excludeGroupIndex: number,
): boolean => {
  return formState.contentGroups.some(
    (group, index) =>
      index !== excludeGroupIndex && group.selectedAccount === accountId,
  );
};

const HandleXHSUrl = async (groupIndex: number): Promise<void> => {
  const group = formState.contentGroups[groupIndex];
  if (!group || !group.url) {
    console.warn('请输入待解析的链接');
    return;
  }

  try {
    // Set loading state
    parsingLoading.value[groupIndex] = true;

    console.log('解析链接:', group.url, '内容组索引:', groupIndex);
    // 这里可以调用相应的API进行内容解析
    const response = await CommonApi.handleXhsUrl({ url: group.url });

    // 模拟解析结果填充
    if (response) {
      // 优先填充标题和内容
      group.title = response.title || '';
      group.content = response.desc || '';

      // 处理媒体内容
      if (response.videoUrl) {
        group.mediaType = 1; // 切换到视频
        group.video = response.videoUrl; // VideoUpload需要数组
        group.picList = []; // 清空图片
        console.log('视频解析结果:', response.videoUrl);
      } else if (response.imageList && response.imageList.length > 0) {
        group.mediaType = 0; // 切换到图片
        group.picList = response.imageList;
        group.video = ''; // 清空视频
        console.log('图片解析结果:', response.imageList);
      }
      console.log(group);

      // 处理标签
      if (response.tags && Array.isArray(response.tags)) {
        // 将返回的所有标签作为下拉选项
        group.tagList = response.tags;
        // 默认选中标签，数量根据平台限制
        const limit = maxTagCount.value;
        if (limit === undefined) {
          // 对于没有特定限制的平台，默认选中5个
          group.selectedTags = response.tags.slice(0, 5);
        } else {
          group.selectedTags = response.tags.slice(0, limit);
        }
      }
    }

    console.log('解析完成');
  } catch (error) {
    console.error('解析失败:', error);
  } finally {
    // Reset loading state
    parsingLoading.value[groupIndex] = false;
  }
};

const applyVideoUrl = (groupIndex: number) => {
  const group = formState.contentGroups[groupIndex];
  const url = videoUrlInputs.value[groupIndex];
  if (group && url && (url.startsWith('http') || url.startsWith('blob:'))) {
    group.video = url;
  } else {
    message.warn('请输入有效的视频链接');
  }
};

const handleTagsChange = (newTags: string[], groupIndex: number) => {
  const limit = maxTagCount.value;
  if (limit !== undefined && newTags.length > limit) {
    const group = formState.contentGroups[groupIndex];
    // 截断数组，并发出警告
    group.selectedTags = newTags.slice(0, limit);
    message.warn(`最多只能选择 ${limit} 个标签`);
  }
};

// 表单验证
const validate = async (): Promise<boolean> => {
  try {
    // 基础验证
    if (!formState.taskName) {
      console.warn('请输入任务名称');
      return false;
    }

    // 验证内容组
    for (let i = 0; i < formState.contentGroups.length; i++) {
      const group = formState.contentGroups[i];
      if (!group) {
        return false;
      }

      if (!group.selectedAccount) {
        message.warn(`内容组 ${i + 1} 请选择分发账号`);
        return false;
      }

      if (!group.content) {
        message.warn(`内容组 ${i + 1} 请输入正文内容`);
        return false;
      }

      // 验证媒体文件
      if (group.mediaType === 0 && group.picList.length === 0) {
        message.warn(`内容组 ${i + 1} 请上传图片`);
        return false;
      }

      if (group.mediaType === 1 && group.video.length === 0) {
        message.warn(`内容组 ${i + 1} 请上传视频`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('表单验证失败:', error);
    return false;
  }
};

function initializeContentGroups() {
  const selectedAccounts = props.selectedAccounts;
  const contentGroups = [] as ContentGroup[];

  // 为每个选中的账号创建一个内容组
  selectedAccounts.forEach((account, _) => {
    contentGroups.push({
      mediaType: 1, // 默认视频类型
      video: '',
      picList: [],
      publishTime: '',
      title: '',
      content: '',
      selectedTags: [],
      tagList: [],
      selectedAccount: account.id,
      url: '',
      controlEvaluationContent: '',
      ifControlEvaluation: 0,
    });
  });

  // 更新内容组列表
  formState.contentGroups = contentGroups;

  // 同步初始化辅助数组
  parsingLoading.value = Array.from({ length: contentGroups.length }, () => false);
  videoUrlInputs.value = Array.from({ length: contentGroups.length }, () => '');
  optimizeLoading.value = Array.from({ length: contentGroups.length }, () => false); // 新增
}

// 初始化默认内容组（从props获取）
function initDefaultContentGroups() {
  // 有父组件传递的初始数据 → 不执行默认初始化
  if (props.defaultContentGroups && props.defaultContentGroups.length > 0) return;

  const selectedAccounts = props.selectedAccounts;
  const contentGroups = [] as ContentGroup[];
  selectedAccounts.forEach((account) => {
    contentGroups.push({
      mediaType: 1,
      video: '',
      picList: [],
      publishTime: '',
      title: '',
      content: '',
      selectedTags: [],
      tagList: [],
      selectedAccount: account.id,
      url: '',
      controlEvaluationContent: '',
      ifControlEvaluation: 0,
    });
  });
  formState.contentGroups = contentGroups;
  parsingLoading.value = Array.from({ length: contentGroups.length }, () => false);
  videoUrlInputs.value = Array.from({ length: contentGroups.length }, () => '');
  optimizeLoading.value = Array.from({ length: contentGroups.length }, () => false); // 新增
}

// 打开AI内容选择弹窗
const openSelectContentModal = (index: number) => {
  currentGroupIndex.value = index;
  selectContentModalVisible.value = true;
  // 刷新表格数据
  selectContentTableApi.reload();
};

// 确认选择AI内容并填充
const handleSelectContentConfirm = async () => {
  const selectedRows = selectContentTableApi.grid.getCheckboxRecords();
  if (selectedRows.length === 0) {
    message.warn('请选择至少一条AI生成内容');
    return;
  }

  const selectedRow = selectedRows[0]; // 只取第一条
  const targetGroup = formState.contentGroups[currentGroupIndex.value];

  try {
    // 填充基础字段
    targetGroup.title = selectedRow.parsedTitle || '';
    targetGroup.content = selectedRow.parsedParagraphs || '';

    // 解析关键词为干净的标签列表
    const tagList = parseKeywordAnalysis(selectedRow.keywordAnalysis);
    targetGroup.tagList = tagList;

    // 根据平台限制选择默认标签数量
    const limit = maxTagCount.value;
    if (limit !== undefined) {
      // 按平台限制截取（小红书10个，抖音5个）
      targetGroup.selectedTags = tagList.slice(0, limit);
    } else {
      // 无限制时默认选前5个
      targetGroup.selectedTags = tagList.slice(0, 5);
    }

    message.success('AI生成内容填充成功');
    selectContentModalVisible.value = false;
  } catch (e) {
    console.error('解析AI内容失败:', e);
    message.error('解析AI内容失败，请检查数据格式');
  }
};

// 监听数据变化
watch(
  () => formState,
  (newValue) => {
    emit('update:formData', newValue);
  },
  { deep: true },
);

// 当平台变化时，重新生成任务名称（仅当无默认任务名时）
watch(
  () => props.platform,
  (newVal, oldVal) => {
    if (newVal !== oldVal && !props.defaultTaskName) {
      formState.taskName = generateTaskName();
    }
  },
  { immediate: true },
);

// 优化：监听默认数据变化，同步更新表单（不覆盖已有数据）
watch(
  [() => props.defaultContentGroups, () => props.defaultTaskName],
  ([newContentGroups, newTaskName]) => {
    // 核心：仅当未设置过数据、且有有效数据时执行，避免循环
    if (isFormDataSet.value || !newContentGroups || newContentGroups.length === 0) return;

    console.log('Step2接收父组件初始数据（仅一次）:', { newContentGroups, newTaskName });
    // 仅赋值，不触发 @update:form-data（避免反哺父组件）
    if (newTaskName && newTaskName.trim()) {
      formState.taskName = newTaskName;
    }
    if (newContentGroups && newContentGroups.length > 0) {
      formState.contentGroups = JSON.parse(JSON.stringify(newContentGroups)).map(group => ({
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
        taskId: group.taskId || 0,
        publishStatus: group.publishStatus || 0,
        controlEvaluationContent: group.controlEvaluationContent || '',
        ifControlEvaluation: group.ifControlEvaluation || 0,
      }));
      parsingLoading.value = Array.from({ length: newContentGroups.length }, () => false);
      videoUrlInputs.value = Array.from({ length: newContentGroups.length }, () => '');
      optimizeLoading.value = Array.from({ length: newContentGroups.length }, () => false); // 新增
      isFormDataSet.value = true; // 标记已设置，不再执行
      console.log('Step2同步父组件初始数据完成（仅一次）:', formState.contentGroups);
    }
  },
  { immediate: true } // 移除 deep: true，避免监听内部字段变化触发循环
);

// 监听选中账号+默认数据，仅初始化一次
watch(
  () => props.selectedAccounts,
  async (newSelectedAccounts) => {
    if (isInitialized.value) return;
    await nextTick();
    initDefaultContentGroups();
    optimizeLoading.value = Array.from({ length: formState.contentGroups.length }, () => false); // 新增
    isInitialized.value = true;
    console.log('Step2首次初始化完成（仅一次）:', formState);
  },
  { immediate: true } // 移除 deep: true（selectedAccounts 是数组，浅监听即可）
);

// 生命周期
onMounted(() => {
  // 初始化数据：优先使用父组件传递的默认值
  initDefaultContentGroups();
  console.log('Step2初始化完成:', formState);
});

// 暴露给父组件的方法
defineExpose({
  validate,
  getFormData: () => formState,
  // 允许父组件主动设置表单数据
  setFormData: (data: CreateForm) => {
    formState.taskName = data.taskName || '';
    formState.contentGroups = data.contentGroups || [];
    // 同步更新辅助数组
    parsingLoading.value = Array.from({ length: formState.contentGroups.length }, () => false);
    videoUrlInputs.value = Array.from({ length: formState.contentGroups.length }, () => '');
    optimizeLoading.value = Array.from({ length: formState.contentGroups.length }, () => false); // 新增
    originalContentMap.value = {}; // 清空原始内容映射
    isFormDataSet.value = true; // 标记已设置
  }
});
</script>

<template>
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
                  :loading="parsingLoading[groupIndex]"
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
              v-model:value="videoUrlInputs[groupIndex]"
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
                :loading="optimizeLoading[groupIndex]"
                @click="optimizeContent(groupIndex)"
                style="margin-right: 8px"
              >
                文案优化
              </a-button>
              <a-button
                size="small"
                @click="revertContent(groupIndex)"
                :disabled="!originalContentMap[groupIndex]"
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
      v-model:open="selectContentModalVisible"
      title="选择AI生成内容"
      width="80%"
      destroyOnClose
      @ok="handleSelectContentConfirm"
      @cancel="selectContentModalVisible = false"
    >
      <div style="height: 400px; margin-bottom: 16px">
        <SelectContentTable :table-loading="selectContentGridLoading" />
      </div>
      <template #footer>
        <Space>
          <a-button @click="selectContentModalVisible = false">取消</a-button>
          <a-button type="primary" @click="handleSelectContentConfirm">确认选择</a-button>
        </Space>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
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
