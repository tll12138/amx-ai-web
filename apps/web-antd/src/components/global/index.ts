import type { App } from 'vue';

import Antd from 'ant-design-vue';

import { GhostButton } from './button';

import 'ant-design-vue/dist/reset.css';

/**
 * 全局组件注册
 */
export function setupGlobalComponent(app: App) {
  // app.use(AButton);
  // app.use(ACard);
  // app.use(ARow);
  // app.use(ACol);
  // app.use(AFrom);
  app.use(Antd);
  // 表格操作列专用按钮
  app.component('GhostButton', GhostButton);
}
