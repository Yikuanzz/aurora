# Architecture — Aurora 架构文档

## 1. 分层架构

```
┌─────────────────────────────────────────────┐
│  前端 (React + TypeScript)                   │
│  ├── Pages (GoalsPage, StatsPage, Settings)  │
│  ├── Components (StarMap, LogForm, ...)      │
│  ├── Stores (Zustand × 5)                    │
│  └── Types (共享 TypeScript 类型)            │
├─────────────────────────────────────────────┤
│  Tauri Bridge (IPC invoke)                   │
├─────────────────────────────────────────────┤
│  后端 (Rust)                                 │
│  ├── Commands (暴露给前端的 API)              │
│  ├── DB (SQLite 连接 + 表初始化)              │
│  └── 未来: AI Client, Tavily, Vector Search  │
├─────────────────────────────────────────────┤
│  数据层 (SQLite 本地文件)                     │
│  ~/.config/aurora/data.db                    │
└─────────────────────────────────────────────┘
```

## 2. 前端架构

### 2.1 状态管理 (Zustand)

| Store | 职责 |
|-------|------|
| `useAppStore` | 全局设置、主题、导航状态 |
| `useGoalStore` | 目标列表、CRUD 操作 |
| `useLogStore` | 每日记录、今日概览 |
| `useAIStore` | 对话历史、当前会话、Aurora 情绪状态 |
| `useUIStore` | 面板开关、动画状态、通知队列 |

### 2.2 页面路由

无路由库，使用 `App.tsx` 中的 `currentView` 状态切换：
- `home` — 指挥舱（当前为占位欢迎页）
- `goals` — 星图/目标管理
- `stats` — 数据统计
- `settings` — 系统设置

### 2.3 组件层级

```
App
├── Sidebar (导航)
├── Main Content
│   ├── Home (欢迎页)
│   ├── GoalsPage
│   │   ├── GoalCard (列表项)
│   │   └── StarMap (可视化)
│   ├── StatsPage
│   │   ├── SummaryCard
│   │   ├── HeatMap
│   │   ├── WeeklyTrend (Recharts)
│   │   ├── GoalProgressList
│   │   └── RecentLogs
│   └── SettingsPage
├── Aurora Character (左下角立绘)
├── Aurora Chat Panel (右侧抽屉)
├── FAB (记一笔)
└── LogForm (弹窗)
```

## 3. 后端架构 (Rust)

### 3.1 模块划分

| 模块 | 文件 | 职责 |
|------|------|------|
| `db` | `src/db.rs` | SQLite 连接管理、表初始化 |
| `commands` | `src/commands.rs` | 所有 Tauri 命令实现 |

### 3.2 命令分类

```
数据库操作
  ├── db_get_goals / db_create_goal / db_update_goal / db_delete_goal
  ├── db_add_log / db_get_logs
  └── db_get_stats

设置管理
  ├── settings_get
  └── settings_set (支持加密标记)

数据导出/导入
  ├── export_data (JSON)
  └── import_data (JSON)

AI 相关 (待实现)
  ├── ai_chat (流式)
  ├── ai_summarize_conversation
  ├── memory_search / memory_add
  └── tavily_search
```

### 3.3 数据库 Schema

见 `Aurora-PRD.md` 第 4.1 节。核心表：
- `goals` — 目标
- `milestones` — 里程碑（当前未实现命令层）
- `actions` — 行动建议（当前未实现命令层）
- `daily_logs` — 每日记录
- `ai_conversations` — AI 对话历史
- `ai_memories` — AI 记忆（文本，未来加向量）
- `app_settings` — 应用设置

## 4. 关键技术决策

### 4.1 为什么选 SQLite 而非其他本地数据库？

- 零配置，单文件，适合桌面应用。
- Rust 生态 `rusqlite` 成熟稳定。
- 未来 `sqlite-vec` 扩展向量检索无需换数据库。

### 4.2 为什么前端状态走 Zustand 而非 React Context？

- 避免 Context 的 Provider 嵌套地狱。
- Zustand 支持订阅切片更新，性能更好。
- 代码更简洁，适合中小型应用。

### 4.3 为什么 AI API 走 Rust 中转？

- 保护 API Key 不被前端暴露。
- 统一错误处理，可降级为 Aurora 角色化表达。
- 方便未来接入本地模型（Ollama）。

## 5. 依赖关系图

```
前端 stores ──invoke──→ Rust commands
    │                        │
    ↓                        ↓
React components          SQLite (rusqlite)
    │                        │
    └── Tailwind CSS ────────┘
```

## 6. 待填补的架构空白

- [ ] AI 流式对话后端命令 (`ai_chat`)
- [ ] Tavily 搜索 Rust 客户端
- [ ] sqlite-vec 向量检索集成
- [ ] 自动备份机制（启动时保留最近 10 份备份）
- [ ] 里程碑/行动的完整 CRUD
