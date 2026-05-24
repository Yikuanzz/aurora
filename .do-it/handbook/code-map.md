# Code Map — Aurora 代码地图

> 记录关键实现位置，方便快速导航。由开发者和 code-mapper 子代理维护。

## 前端 (Frontend)

### 入口与框架

| 功能 | 文件 |
|------|------|
| 应用入口 | `src/main.tsx` |
| 根组件 | `src/App.tsx` |
| 类型定义 | `src/types/index.ts` |
| Vite 配置 | `vite.config.ts` |
| Tailwind 配置 | `tailwind.config.js` (待创建) |
| 全局样式 | `src/App.css` |

### 页面 (Pages)

| 页面 | 文件 | 状态 |
|------|------|------|
| 指挥舱(Home) | `src/App.tsx` 内联 | 占位，仅欢迎文字 |
| 星图/目标 | `src/pages/GoalsPage.tsx` | 功能完整：列表/星图视图、CRUD |
| 数据统计 | `src/pages/StatsPage.tsx` | 功能完整：汇总、热力图、趋势、进度 |
| 系统设置 | `src/pages/SettingsPage.tsx` | 功能完整：API、外观、数据管理 |

### 组件 (Components)

| 组件 | 文件 | 状态 |
|------|------|------|
| 星图可视化 | `src/components/StarMap.tsx` | 存在，实现待确认 |
| 记一笔表单 | `src/components/LogForm.tsx` | 存在，实现待确认 |

### 状态管理 (Stores)

| Store | 文件 |
|-------|------|
| App Store | `src/stores/appStore.ts` |
| Goal Store | `src/stores/goalStore.ts` |
| Log Store | `src/stores/logStore.ts` |
| AI Store | `src/stores/aiStore.ts` |
| UI Store | `src/stores/uiStore.ts` |
| Store 汇总导出 | `src/stores/index.ts` |

## 后端 (Backend — Rust)

### 入口

| 功能 | 文件 |
|------|------|
| Tauri 应用入口 | `src-tauri/src/main.rs` |
| 库入口/命令注册 | `src-tauri/src/lib.rs` |

### 模块

| 模块 | 文件 | 职责 |
|------|------|------|
| DB | `src-tauri/src/db.rs` | SQLite 连接、表初始化 |
| Commands | `src-tauri/src/commands.rs` | 所有 Tauri 命令 |

### Cargo 配置

| 文件 | 说明 |
|------|------|
| `src-tauri/Cargo.toml` | Rust 依赖：tauri, rusqlite, chrono, dirs, once_cell |
| `src-tauri/Capability` | `src-tauri/capabilities/default.json` |

## 资源文件

| 文件 | 说明 |
|------|------|
| `public/aurora_立绘.png` | Aurora 默认立绘 |
| `public/aurora_开心.png` | 开心表情差分 |
| `public/aurora_担心.png` | 担心表情差分 |
| `public/aurora_兴奋.png` | 兴奋表情差分 |
| `public/aurora_生气.png` | 生气表情差分 |

## 配置与文档

| 文件 | 说明 |
|------|------|
| `Aurora-PRD.md` | 产品设计文档 |
| `package.json` | Node 依赖 |
| `tsconfig.json` | TypeScript 配置 |
| `.gitignore` | Git 忽略规则 |

## 已知技术债务 / TODO

- `StarMap.tsx` — 需要确认是否实现了完整的星图可视化
- `LogForm.tsx` — 需要确认是否完整实现了记一笔表单
- `src-tauri/src/commands.rs` — 缺少 AI 聊天、Tavily、记忆检索命令
- `src-tauri/Cargo.toml` — 缺少 reqwest、sqlite-vec、tauri-plugin-stronghold
- 自动备份机制未实现
- 里程碑/行动的命令层未实现
