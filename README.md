# Aurora — 目标管理与 AI 伙伴

> "在星图中，与她一起攻克每一个目标。"

Aurora 是一款面向个人用户的目标管理与进度追踪桌面应用。它将冰冷的效率工具转化为一个有情感温度的"指挥模拟游戏"——你是"指挥官"，AI 伙伴 Aurora 是并肩作战的战友型女友，共同在抽象星图中标记和攻克人生目标。

---

## 功能特性

### 核心功能


| 功能               | 描述                                    |
| ---------------- | ------------------------------------- |
| **目标管理**         | 创建、编辑、删除目标；列表/星图双视图；自定义主题色            |
| **里程碑追踪**        | 每个目标可设置里程碑，支持状态切换（未解锁 → 进行中 → 已完成）    |
| **每日记录**         | 悬浮按钮"记一笔"，支持计数/时间/布尔三种类型，可选日期和感受      |
| **数据统计**         | 今日/本周概览、30 天活动热力图、7 天趋势图、目标进度追踪       |
| **AI 伙伴 Aurora** | 基于 OpenAI 风格 API 的 AI 对话，具备情绪感知和角色化回复 |
| **数据安全**         | 完全本地存储，自动备份（保留最近 10 份），支持 JSON 导出/导入  |


### 视觉风格

- 科幻指挥终端 + 二次元游戏化设计
- 深色主题，霓虹青 `#00D9FF` + 暖粉 `#FF6B9D` 主色调
- 玻璃拟态面板、动态粒子背景、Aurora 立绘交互

---

## 技术栈

### 前端


| 技术            | 版本   | 用途     |
| ------------- | ---- | ------ |
| React         | 18+  | UI 框架  |
| TypeScript    | 5.x  | 类型安全   |
| Tailwind CSS  | 4.x  | 样式系统   |
| Zustand       | 4.x  | 全局状态管理 |
| Framer Motion | 11.x | 动画与交互  |
| Recharts      | 2.x  | 数据可视化  |
| Lucide React  | 0.x  | 图标库    |


### 后端（Tauri Rust）


| 技术        | 用途               |
| --------- | ---------------- |
| Tauri 2.0 | 桌面应用框架           |
| Rusqlite  | SQLite 数据库操作     |
| Reqwest   | HTTP 客户端（AI API） |
| Chrono    | 日期时间处理           |


### 工具链

- **Bun** — 包管理器与脚本运行
- **Vite** — 前端构建工具
- **Cargo** — Rust 构建工具

---

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18+（或 [Bun](https://bun.sh/) 1.0+）
- [Rust](https://rustup.rs/) 1.70+
- Windows: [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)

### 安装依赖

```bash
# 前端依赖
bun install

# Rust 依赖（自动）
cd src-tauri && cargo fetch
```

### 开发模式

```bash
# 同时启动前端 dev server 和 Rust 编译
bun tauri dev
```

### 生产构建

```bash
# 构建安装包
bun tauri build

# 输出位置
# Windows: src-tauri/target/release/bundle/msi/*.msi
# macOS:   src-tauri/target/release/bundle/dmg/*.dmg
# Linux:   src-tauri/target/release/bundle/deb/*.deb
```

---

## 项目结构

```
.
├── src/                          # 前端源码
│   ├── components/               # 可复用组件
│   │   ├── AuroraChatPanel.tsx   # AI 聊天面板
│   │   ├── LogForm.tsx           # 记一笔表单
│   │   └── StarMap.tsx           # 星图可视化
│   ├── pages/                    # 页面级组件
│   │   ├── HomePage.tsx          # 指挥舱首页
│   │   ├── GoalsPage.tsx         # 目标/星图管理
│   │   ├── StatsPage.tsx         # 数据统计
│   │   └── SettingsPage.tsx      # 系统设置
│   ├── stores/                   # Zustand 状态管理
│   ├── types/                    # TypeScript 类型定义
│   ├── App.tsx                   # 根组件
│   └── App.css                   # 全局样式 + Tailwind 主题
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── main.rs               # 入口
│   │   ├── lib.rs                # 命令注册
│   │   ├── commands.rs           # 所有 Tauri 命令
│   │   ├── db.rs                 # 数据库初始化 + 自动备份
│   │   └── ai.rs                 # AI API 客户端
│   ├── Cargo.toml                # Rust 依赖
│   └── tauri.conf.json           # Tauri 配置
├── public/                       # 静态资源（Aurora 立绘/表情）
├── .do-it/                       # 项目文档（handbook + workflows）
├── Aurora-PRD.md                 # 产品设计文档
└── package.json                  # Node 依赖
```

---

## 数据存储


| 路径                          | 说明                |
| --------------------------- | ----------------- |
| `~/.config/aurora/data.db`  | SQLite 主数据库       |
| `~/.config/aurora/backups/` | 自动备份目录（保留最近 10 份） |


---

## 开发指南

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/commands.rs` 中实现命令函数
2. 在 `src-tauri/src/lib.rs` 的 `generate_handler!` 宏中注册
3. 前端通过 `invoke("command_name", { args })` 调用

### 前端调用示例

```typescript
import { invoke } from "@tauri-apps/api/core";

const goals = await invoke<Goal[]>("db_get_goals");
```

### Rust 命令示例

```rust
#[command]
pub fn db_get_goals() -> Result<Vec<Goal>, String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    // ... 查询逻辑
}
```

---

## 配置 AI API

1. 打开应用 → 设置 → API 配置
2. 填入 API Key（支持 OpenAI 风格 API，如 Anthropic、OpenRouter 等）
3. 可选：修改 Base URL 和模型名称
4. 保存后点击左下角 Aurora 立绘即可开始对话

---

## License

MIT License

---

## 致谢

- [Tauri](https://tauri.app/) — 跨平台桌面应用框架
- [React](https://react.dev/) — UI 库
- [Tailwind CSS](https://tailwindcss.com/) — 样式系统
- [Framer Motion](https://www.framer.com/motion/) — 动画引擎

