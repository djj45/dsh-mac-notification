# dsh-mac-notification

DSH Web GUI 插件：任务完成时弹出 macOS 系统通知。

会话停止运行时，若页面在后台标签页或窗口失焦，且浏览器已授予通知权限、偏好已开启，就通过系统通知提醒你；点击通知回到对应会话。设置 → 常规 里新增"任务完成系统通知"开关行（含权限状态提示）。

## 安装

DSH 插件通过 `dsh plugin` 安装进 profile（`dsh web` 对应 `web` profile）。

### 从 npm 安装（发布后）

```sh
dsh plugin --profile web add @djj45/dsh-mac-notification
```

### 从源码安装（本地调试）

```sh
pnpm install
pnpm build
dsh plugin --profile web add link:$(pwd)/packages/dsh-mac-notification
```

装完重启 `dsh web`，到设置 → 常规 打开开关并允许浏览器通知权限即可。

## 设置持久化

偏好优先写入 dsh Host settings 文档的 `ui-notifications.completionEnabled`。dsh 0.1.0-rc.5 / rc.6 的 settings 网关只暴露一份硬编码的 namespace 白名单，第三方 namespace 的读写会被 `settings-not-exposed` 拒绝；此时浏览器半部自动回退到 localStorage（键 `dsh-mac-notification.completion-enabled`），因此页面重载或 `dsh web` 重启后开关不会丢。dsh 开放第三方 namespace 暴露后，代码无需改动会自动继续走 Host 文档。

## 结构

- `packages/dsh-mac-notification`：插件本体。`.` 为 host 半部（注册 `ui-notifications` settings namespace），`./client` 为浏览器半部（注册 settings 行 + 监听会话完成边沿）。
- `shared/tsdown.client.ts` + `shared/web-platform.ts`：外部插件的 tsdown 构建预设（从 DSH checkout 的 `packages/client/tsdown.client.ts` 复制，浏览器半部用 `window.__ModuleLoader__.load` 注册）。

## 依赖约定

`@deepseek-ai/dsh-*`、`@deepseek-ai/cordis`、`react` 均为 peerDependencies，运行时从 dsh profile 树解析，不随本仓库安装（`autoInstallPeers: false`）。dsh 家族 peer 范围取 `^0.1.0-rc.5 || ^0.1.0-rc.6`，兼容 rc.5 源码启动与 rc.6 npm 发布；devDependencies 固定 rc.6 用于本地构建。

> 完整单元测试（含 100% 覆盖率）保留在功能最初的开发地 —— 主仓库 `packages/client/ui-notifications`。本独立包专注可构建、可安装的最小交付。

