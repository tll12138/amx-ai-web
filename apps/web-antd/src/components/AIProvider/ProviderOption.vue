<script setup lang="ts">
import {
  DeepseekIcon,
  DouBaoIcon,
  OpenAiIcon,
  QFanIcon,
  QWenIcon,
} from '@vben/icons';

defineProps<{
  label: string;
  value: string;
}>();
</script>

<template>
  <div class="flex items-center font-semibold">
    <div
      v-if="['deepseek', 'doubao', 'openai', 'q_fan', 'q_wen'].includes(value)"
      class="flex items-center"
    >
      <DeepseekIcon v-if="value === 'deepseek'" class="text-[16px]" />
      <DouBaoIcon v-else-if="value === 'doubao'" class="text-[16px]" />
      <OpenAiIcon v-else-if="value === 'openai'" class="text-[16px]" />
      <QFanIcon v-else-if="value === 'q_fan'" class="text-[16px]" />
      <QWenIcon v-else-if="value === 'q_wen'" class="text-[16px] font-bold" />
      <span class="ml-2">{{ label }}</span>
    </div>
    <div v-else class="text-gray-400">{{ label }}</div>
  </div>
</template>
