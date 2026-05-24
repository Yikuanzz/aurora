# Invariants — Aurora 项目不变量

> 修改这些规则需要与项目所有者面对面讨论。以下事实是整个代码库的基石。

## 1. 技术栈锁定

- **Tauri 2.0** — 唯一桌面应用框架，不迁移到 Electron。
- **React 18+ + TypeScript** — 前端唯一 UI 框架。
- **Tailwind CSS** — 唯一样式方案，不使用 CSS-in-JS。
- **Zustand** — 唯一状态管理，不使用 Redux / Context。
- **SQLite (rusqlite)** — 唯一本地数据库，不引入 PostgreSQL / MongoDB。
- **Bun** — 唯一包管理器，不使用 npm / yarn / pnpm。

## 2. 数据模型不变量

- 目标 (`goals`) 不加标签，靠 `color_theme` 和 `name` 区分。
- 记录 (`daily_logs`) 存原始条目，**聚合在查询时做**，不在写入时预计算。
- AI 记忆 (`ai_memories`) 有"遗忘"机制：久不访问的降低 `importance_score`。
- API Key 使用 Tauri Stronghold 加密存储（当前 MVP 阶段使用 `app_settings` 表 + `is_encrypted` 标记，未来迁移到 Stronghold）。

## 3. AI 行为不变量

- Aurora 是**战友型女友**，不是客服/助手。
- 严禁使用"作为 AI 助手"、"我可以帮您"等公事公办废话。
- 亲昵自然，多用助词（呀、呢、嘛），分析问题时瞬间变得犀利专业。
- 用户想放弃时，**严禁施压**，任务是"诱骗"用户只做 1 分钟。
- 好感度系统**完全隐性**，用户不可见数值。

## 4. UI/UX 不变量

- 深色主题为默认且主要模式。
- 主色调：`#00D9FF`（霓虹青）+ `#FF6B9D`（暖粉）。
- 玻璃拟态面板（半透明 + 边缘微光）为默认容器样式。
- 所有动画必须可全局关闭（`animations_enabled` 设置）。

## 5. 安全与隐私

- 所有外部 HTTP 请求走 Rust 后端中转，**前端不直接调 AI API**。
- Tavily API Key 可选配置，Rust 后端中转调用。
- 数据完全本地存储，无云服务（未来扩展除外）。

## 6. 性能底线

- 启动时间 < 3 秒。
- 记录添加 < 100ms。
- AI 响应流式输出，首字延迟 < 2 秒。
- 星图沙盘支持 50+ 目标节点流畅渲染。
