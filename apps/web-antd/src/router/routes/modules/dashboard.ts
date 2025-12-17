import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.analytics'),
        },
      },
      // {
      //   name: 'Workspace',
      //   path: '/workspace',
      //   component: () => import('#/views/dashboard/workspace/index.vue'),
      //   meta: {
      //     icon: 'carbon:workspace',
      //     title: $t('page.dashboard.workspace'),
      //   },
      // },
      {
        name: 'XhsMobileShare',
        path: '/xhs/mobile/:shareId',
        component: () => import('#/views/_core/h5/share.vue'),
        meta: {
          title: '小红书分享',
          hideInMenu: true,
          hideInTab: true,
          hideInBreadcrumb: true,
          // 不使用基础布局（仅在顶级生效）
          noBasicLayout: true,
          // 忽略权限访问
          ignoreAccess: true,
        },
      },
    ],
  },
];

export default routes;
