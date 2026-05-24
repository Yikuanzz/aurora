# Backlog — Aurora 开发待办

> 按优先级排序。已完成项保留用于追踪进度。

## 已完成

- [x] 项目初始化（Tauri 2.0 + React + TypeScript + Tailwind）
- [x] 数据库 Schema 设计与初始化
- [x] 目标 CRUD（Rust 命令 + 前端页面）
- [x] 每日记录 CRUD（Rust 命令）
- [x] 统计查询（今日/本周/30天/目标进度）
- [x] 设置管理（API Key、主题、动画开关）
- [x] 数据导出/导入（JSON）
- [x] 基础 UI 框架（侧边栏、Aurora 立绘、聊天面板、FAB）
- [x] 目标列表页（列表视图 + 星图视图切换）
- [x] 统计页（汇总卡片、热力图、7天趋势、进度条、最近记录）
- [x] 设置页（API、外观、数据管理、关于）
- [x] Zustand stores 框架
- [x] 类型定义（TypeScript + Rust DTO）

## 高优先级（MVP  blocker）

- [x] **记一笔表单** (`LogForm.tsx`) — 完整表单 + 日期选择 + 保存并继续 + 自动更新进度
- [x] **星图可视化** (`StarMap.tsx`) — 抽象星系节点图，轨道环、进度环、脉冲动画
- [x] **AI 聊天后端** — Rust `ai_chat` 命令，接入 OpenAI 风格 API（同步版，流式待优化）
- [x] **AI 聊天前端** — Aurora 聊天面板：消息列表、输入框、发送、情绪状态显示
- [x] **Home 页内容** — 指挥舱：今日概览、快速操作、Aurora 问候语、最近记录、目标进度

## 中优先级

- [ ] **里程碑管理** — Rust 命令层（CRUD）、前端里程碑列表/编辑
- [ ] **行动建议管理** — Rust 命令层（CRUD）
- [ ] **AI 记忆系统** — sqlite-vec 向量检索、记忆注入、遗忘机制
- [ ] **Tavily 搜索** — Rust reqwest 客户端、后端中转命令
- [ ] **自动备份** — 启动时保留最近 10 份数据库备份到 `~/.config/aurora/backups/`
- [ ] **Aurora 情绪系统** — 根据用户行为/时间动态切换情绪状态
- [ ] **创建目标向导** — grill-me 模式：Aurora 3-5 轮追问生成里程碑建议

## 低优先级（未来扩展）

- [ ] **音效系统** — 记录完成/里程碑达成/提醒音效
- [ ] **本地 AI 模型支持** — Ollama / LM Studio 接入
- [ ] **云同步** — iCloud / Google Drive / WebDAV
- [ ] **成就/徽章系统** — 显性游戏化
- [ ] **社区分享目标模板**
- [ ] **自定义 Aurora 立绘/语音包**

## 技术债务

- [ ] Cargo.toml 缺少 reqwest、sqlite-vec、tauri-plugin-stronghold 依赖
- [ ] 设置中的 `is_encrypted` 标记需升级为 Stronghold 实际加密
- [ ] StarMap/LogForm 组件实现待验证
- [ ] 清理数据功能（SettingsPage 中的 TODO）
