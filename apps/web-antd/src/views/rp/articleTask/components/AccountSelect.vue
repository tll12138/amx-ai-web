<script setup lang="ts">
import type { Account, Group } from '../types/form';

import { computed, ref, watch } from 'vue';

interface Props {
  modelValue: Account[];
  selectedGroupIds?: string[]; // 新增 prop 用于接收选中的分组 ID
  platform?: string;
  groups: any[]; // 新的接口格式：包含accounts数组的分组数据
  loading?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: Account[]): void;
  (e: 'update:selectedGroupIds', value: string[]): void; // 新增事件用于更新选中的分组 ID
}

const props = withDefaults(defineProps<Props>(), {
  platform: '',
  groups: () => [],
  loading: false,
  selectedGroupIds: () => [], // 默认值为空数组
});

const emit = defineEmits<Emits>();

const groupSearchText = ref('');
const accountSearchText = ref('');
// 使用 prop 作为默认值，如果未提供则使用本地 ref
const localSelectedGroupIds = ref<string[]>([]);

// 使用计算属性来决定使用 prop 还是本地状态
const effectiveSelectedGroupIds = computed(() => {
  return props.selectedGroupIds && props.selectedGroupIds.length > 0
    ? props.selectedGroupIds
    : localSelectedGroupIds.value;
});

// 修改更新函数以 emit 事件而不是直接修改本地状态
const updateSelectedGroupIds = (newIds: string[]) => {
  if (props.selectedGroupIds !== undefined) {
    // 如果提供了 prop，则 emit 更新事件
    emit('update:selectedGroupIds', newIds);
  } else {
    // 否则更新本地状态
    localSelectedGroupIds.value = newIds;
  }
};

// 转换 API 数据为组件需要的格式
const formatGroups = computed((): Group[] => {
  return props.groups.map((group) => ({
    id: group.id,
    name: group.groupName,
    count: group.accounts?.length || 0,
  }));
});

// 从所有分组中提取所有账号
const formatAccounts = computed((): Account[] => {
  const allAccounts: Account[] = [];
  props.groups.forEach((group) => {
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
  return allAccounts;
});

// 监听平台变化，只在平台真正变化时重置相关数据
watch(
  () => props.platform,
  (newPlatform, oldPlatform) => {
    console.log('平台变化:', {
      oldPlatform,
      newPlatform,
      selectedGroupIds: effectiveSelectedGroupIds.value,
    });
    // 只有当平台真正发生变化时才重置（从有值到不同值）
    if (oldPlatform && newPlatform !== oldPlatform) {
      updateSelectedGroupIds([]);
      groupSearchText.value = '';
      accountSearchText.value = '';
      console.log('平台变化导致重置选择状态');
    }
  },
  { immediate: true },
);

const filteredGroups = computed(() => {
  if (!groupSearchText.value) return formatGroups.value;
  return formatGroups.value.filter((group) =>
    group.name.toLowerCase().includes(groupSearchText.value.toLowerCase()),
  );
});

const groupAccounts = computed(() => {
  if (effectiveSelectedGroupIds.value.length === 0) return [];

  let accounts = formatAccounts.value.filter((acc) =>
    effectiveSelectedGroupIds.value.includes(acc.groupId),
  );

  if (accountSearchText.value) {
    accounts = accounts.filter((acc) =>
      acc.name.toLowerCase().includes(accountSearchText.value.toLowerCase()),
    );
  }

  return accounts;
});

const selectedAccounts = computed({
  get: () => {
    // 将 accountIds 转换为 Account 对象数组
    return props.modelValue.map((id) => {
      const account = formatAccounts.value.find((acc) => acc.id === id);
      return account || { id, name: `账号${id}`, groupId: '' };
    });
  },
  set: (value) => {
    // 将 Account 对象数组转换为 accountIds 数组
    const ids = value.map((account) => account.id);
    emit('update:modelValue', ids);
  },
});

const isAccountSelected = (accountId: string) => {
  return selectedAccounts.value.some((acc) => acc.id === accountId);
};

const toggleAccount = (account: Account) => {
  const index = selectedAccounts.value.findIndex(
    (acc) => acc.id === account.id,
  );
  selectedAccounts.value =
    index === -1
      ? [...selectedAccounts.value, account]
      : selectedAccounts.value.filter((acc) => acc.id !== account.id);
};

const removeFromSelected = (accountId: string) => {
  selectedAccounts.value = selectedAccounts.value.filter(
    (acc) => acc.id !== accountId,
  );
};

const toggleGroup = (groupId: string) => {
  const index = effectiveSelectedGroupIds.value.indexOf(groupId);
  const newIds =
    index === -1
      ? [...effectiveSelectedGroupIds.value, groupId]
      : effectiveSelectedGroupIds.value.filter((id) => id !== groupId);
  updateSelectedGroupIds(newIds);
};

const isGroupSelected = (groupId: string) => {
  return effectiveSelectedGroupIds.value.includes(groupId);
};
</script>

<template>
  <div class="account-selector">
    <div class="selector-panel groups-panel">
      <input
        v-model="groupSearchText"
        type="text"
        placeholder="分组名称"
        class="search-input"
      />
      <div class="groups-list">
        <div v-if="props.loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
        <div v-else-if="filteredGroups.length === 0" class="empty-state">
          <span>暂无分组数据</span>
        </div>
        <div
          v-for="group in filteredGroups"
          :key="group.id"
          v-else
          class="group-item"
          :class="{ selected: isGroupSelected(group.id) }"
          @click="toggleGroup(group.id)"
        >
          <input
            type="checkbox"
            class="group-checkbox"
            :checked="isGroupSelected(group.id)"
          />
          <span class="group-name">{{ group.name }}</span>
          <span class="group-count">{{ group.count }}</span>
          <span class="group-arrow">›</span>
        </div>
      </div>
    </div>

    <div class="selector-panel accounts-panel">
      <input
        v-model="accountSearchText"
        type="text"
        placeholder="搜索名称"
        class="search-input"
      />
      <div class="accounts-list">
        <div v-if="effectiveSelectedGroupIds.length === 0" class="empty-state">
          <span>请先选择分组</span>
        </div>
        <div v-else-if="groupAccounts.length === 0" class="empty-state">
          <span>所选分组暂无账号</span>
        </div>
        <div
          v-for="account in groupAccounts"
          :key="account.id"
          v-else
          class="account-item"
          :class="{ selected: isAccountSelected(account.id) }"
          @click="toggleAccount(account)"
        >
          <input
            type="checkbox"
            class="account-checkbox"
            :checked="isAccountSelected(account.id)"
          />
          <span class="account-name">{{ account.name }}</span>
        </div>
      </div>
    </div>

    <div class="selector-panel selected-panel">
      <div class="selected-header">
        <span>已选择: {{ selectedAccounts.length }}项</span>
      </div>
      <div class="selected-list">
        <div v-if="selectedAccounts.length === 0" class="empty-state">
          <span>暂无选择账号</span>
        </div>
        <div
          v-for="account in selectedAccounts"
          :key="account.id"
          v-else
          class="selected-item"
        >
          <span class="selected-name">{{ account.name }}</span>
          <a-button
            type="text"
            size="small"
            danger
            @click="removeFromSelected(account.id)"
          >
            移除
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-selector {
  display: flex;
  background: #f8fafc;
  overflow: hidden;
  height: 480px;
}

.accounts-panel {
  border-left: 1px solid rgba(226, 232, 240, 0.6);
  border-right: 1px solid rgba(226, 232, 240, 0.6);
}

.selector-panel {
  flex: 1;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  outline: none;
  background: #ffffff;
}

.search-input::placeholder {
  color: #9ca3af;
}

.groups-list,
.accounts-list,
.selected-list {
  flex: 1;
  overflow-y: auto;
}

.group-item,
.account-item,
.selected-item {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.group-item:hover,
.account-item:hover {
  background-color: #f9fafb;
}

.group-item.selected {
  background-color: #f8fafc;
}

.account-item.selected {
  background-color: #f8fafc;
}

.group-checkbox,
.account-checkbox {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.group-name,
.account-name,
.selected-name {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.group-count {
  font-size: 14px;
  color: #9ca3af;
  margin-left: auto;
}

.group-arrow {
  font-size: 18px;
  color: #9ca3af;
  margin-left: 8px;
}

.selected-header {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.selected-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f3f4f6;
}

.select-all input[type='checkbox'] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(241, 245, 249, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  font-size: 14px;
  padding: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(226, 232, 240, 0.5);
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  margin-bottom: 12px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
