## 目标
- 美化顶部流程指示，居中显示、当前步骤更明显。
- 平台选择改为 a-segmented，统一视觉并展示平台标签/图标。
- 三栏布局改为 a-row/a-col + a-card，收紧留白、统一密度与滚动高度。
- 封装表单参数为单对象 `stepParams`，其它 UI-only 状态保留为内部属性。

## 变更点
- 顶部步骤：
  - 在抽屉内部包裹居中容器：`<div class="mx-auto max-w-[760px] px-4 py-3">`。
  - `a-steps` 设置 `status="process"`，并添加局部样式：当前步骤标题加粗和主题色、步骤圆圈略放大。
  - 步骤与内容区间增加小号 `a-divider` 控制上下间距。
- 平台选择：
  - 使用 `a-segmented block`，`options` 由字典映射出的 `{ label, value, payload }`；`label` 内自定义图标/文案；与 `stepParams.platform` 双向绑定。
  - 切换平台后重置分组与账号选择，并重新加载数据。
- 三栏主内容：
  - 改为 `a-row`/`a-col`（比例约 6/10/8），每栏使用 `a-card size="small"`，`headStyle/bodyStyle` 收紧 padding。
  - 列表统一高度（如 360~400px），`overflow:auto`，空时用 `a-empty`；加载用 `a-spin`。
  - 左栏分组：支持高亮当前分组与数量；底部“全选”作用于当前可见账号。
  - 中栏账号：顶部右侧搜索；列表项左侧勾选、右侧设备编号；底部“全选”。
  - 右栏已选：展示总数与移除按钮、支持“一键清空”按钮。
- 抽屉底部：
  - 保持自定义 `#footer`：右侧“下一步/取消”，按示例图的间距与顺序。

## 参数封装
- 新增单一参数对象：
  - `interface StepParams { platform: string | number; groupId?: number; accountIds: number[]; search?: string }`
- 状态分层：
  - 组件内部 UI-only：`currentStep, loading, groups, accounts, selectedAccounts` 等。
  - `stepParams` 作为业务参数源：加载分组/账号与“下一步”校验均从该对象读取。
- 数据流：
  - `onOpenChange` 支持从 `drawerApi.getData()` 读取 `initialParams?: Partial<StepParams>`。
  - 账号勾选时同步维护 `selectedAccounts` 与 `stepParams.accountIds`。
  - 点击“下一步”时校验 `stepParams.accountIds.length > 0`，并将 `stepParams` 通过 `drawerApi.setData({ stepParams })` 暂存供第二步使用（或 `emit('next', stepParams)`）。

## 接口与性能
- 分组：`AccountGroupApi.getList({ pageNum: 1, pageSize: 1000, platform })`。
- 账号：`AccountApi.getList({ pageNum: 1, pageSize: 1000, platform, groupId })`。
- 搜索暂采用前端过滤，后续如后端支持关键词检索可改为接口参数。

## 验证
- 平台无分组/无账号时显示空状态与提示。
- 多次切换平台时清理旧选择，保持一致性。
- 全选仅作用于当前可见账号（受搜索影响）。

## 交付
- 完成抽屉第一步的样式与布局优化、`a-segmented` 平台选择实现。
- 引入 `stepParams` 单对象并打通加载/选择/下一步的数据流。

## 后续可选增强
- 分组支持折叠/树状、账号项增加状态标签，第二步内容设置实现与预览区。