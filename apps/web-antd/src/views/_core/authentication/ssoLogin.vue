<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH } from '@vben/constants';

import { useAuthStore } from '#/store';

defineOptions({ name: 'SSOLogin' });

const { push, currentRoute } = useRouter();

const authStore = useAuthStore();
const redirect = ref('');

async function init() {
  console.log('init', currentRoute.value.query);
  const data = currentRoute.value.query;
  const tokenData = data.token as string;
  const redirectPath = data.redirect as string;
  redirect.value = redirectPath ? `/${redirectPath}` : DEFAULT_HOME_PATH;
  const param = {
    code: null,
    grantType: 'sso',
    password: null,
    tenantId: '000000',
    token: tokenData,
    uuid: null,
  };
  try {
    await authStore.authLogin(param, await push(redirect.value));
  } catch (error) {
    // 登录失败，跳转到登录页
    await push('/auth/login');
    console.error(error);
  }
}

onMounted(async () => {
  await init();
});
</script>

<template>
  <div class="background">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <div class="loading">登录中...</div>
  </div>
</template>

<style lang="scss" scoped>
.loading {
  position: absolute;
  top: 65%;
  left: 47%;
}
body {
  margin: 0;
  overflow: hidden;
}

.background {
  width: 100vw;
  height: 100vh;
  background: white;
  --amount: 20;
}

$animationDuration: 3s;
$amount: 6;
$particleRadius: 4vmin;
.background span {
  width: $particleRadius * 2;
  height: $particleRadius * 2;
  border-radius: $particleRadius;
  backface-visibility: hidden;
  position: absolute;
  animation-name: move;
  animation-timing-function: cubic-bezier(0.4, 0, 1, 0.8);
  animation-iteration-count: infinite;
  animation-duration: $animationDuration;
  top: calc(50% - #{$particleRadius});
  left: 50%;
  transform-origin: ($particleRadius * -1) center;

  $colors: (#c5f0a4, #35b0ab, #226b80);

  @for $i from 1 through $amount {
    &:nth-child(#{$i}) {
      opacity: 0;
    }
  }
}

@keyframes move {
  0% {
    transform: scale(1) rotate(0deg) translate3d(0, 0, 1px);
  }
  30% {
    opacity: 1;
  }
  100% {
    z-index: 10;
    transform: scale(0) rotate(360deg) translate3d(0, 0, 1px);
  }
}
</style>
