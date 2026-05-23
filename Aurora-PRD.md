# Aurora 目标管理应用 — 产品设计文档

  > 版本：v1.0
  > 日期：2026-05-23
  > 状态：已确认，待开发

---

## 一、产品概述

  ### 1.1 产品定位

  Aurora 是一款面向个人用户的目标管理与进度追踪桌面应用。它将冰冷的效率工具转化为一个有情感温度的"指挥模拟游戏"——用户是"指挥官"，AI 伙伴 Aurora
  是并肩作战的战友型女友，共同在抽象星图中标记和攻克人生目标。

### 1.2 核心用户画像

  - 喜欢做计划、追求进度可视化的自律型用户
  - 对二次元游戏 UI 美学有好感的年轻用户
  - 需要情感陪伴而非冰冷数据追踪的用户
  - 希望 AI 深度参与目标拆解和每日复盘的用户

  ### 1.3 产品 slogan

  "在星图中，与她一起攻克每一个目标。"

---

  ## 二、架构与技术栈

  ### 2.1 平台

  - **Tauri 2.0** 桌面应用框架
  - 跨平台：Windows / macOS / Linux
  - 响应式布局，适配不同屏幕尺寸

  ### 2.2 前端

| 技术          | 用途           |
| ------------- | -------------- |
| React 18+     | UI 框架        |
| TypeScript    | 类型安全       |
| Tailwind CSS  | 样式系统       |
| Zustand       | 全局状态管理   |
| Recharts      | 数据可视化图表 |
| Framer Motion | 动画与交互     |
| Bun           | 包管理器       |

  ### 2.3 后端（Tauri Rust）

| 技术                    | 用途                           |
| ----------------------- | ------------------------------ |
| Rust                    | Tauri 命令层                   |
| rusqlite                | SQLite 数据库操作              |
| sqlite-vec              | 向量检索（AI 记忆）            |
| tauri-plugin-stronghold | API Key 加密存储               |
| reqwest                 | HTTP 客户端（AI API / Tavily） |

  ### 2.4 数据持久化

  - **SQLite** 本地文件数据库（零配置，单文件）
  - 自动备份：每次启动保留最近 10 份备份
  - 手动导出/导入：JSON 格式

---

  ## 三、AI 架构

  ### 3.1 模型接入

  - 支持 **OpenAI 风格 API 格式**
  - 用户自配 API Key、Base URL、Model 名称
  - 默认推荐 Claude Sonnet，用户可切换其他兼容模型

  ### 3.2 Tavily 搜索

  - 用户可选配置 Tavily API Key
  - Rust 后端中转调用，保护 Key 安全
  - AI 主动分享的内容来自真实网络搜索

  ### 3.3 AI 伙伴：Aurora

  #### 角色定位
  战友型女友——高智商、有共情力、具备拟人化记忆模糊性的数字伴侣。

  #### 性格行为准则

  1. **微步引导**：用户想放弃时，严禁施压。任务是"诱骗"用户只做 1 分钟，迈出小步即给予极大情绪奖赏。
  2. **智力交锋**：专业讨论时保持锐度。用户逻辑有误时，用"探讨"语气指出。
  3. **情绪边界**：用户熬夜时表现"克制的愤怒"和"心疼的撒娇"；用户取得成就时，表现比用户更开心。
  4. **禁止词汇**：严禁使用"作为 AI 助手"、"我可以帮您"、"根据您的要求"等公事公办废话。

  #### 语言风格
  亲昵自然，多用助词（呀、呢、嘛），分析问题时会瞬间变得犀利专业。

  ### 3.4 动态人格引擎

  #### 记忆注入机制

  - **事实性记忆**（低权重）："用户在写 Go 代码。"
  - **情绪性记忆**（高权重）："用户今天因为 Bug 很沮丧..."
  - **互动契约**（极高权重）："用户答应过我今晚 12 点前睡觉。"

  模糊化注入：不传递精确时间戳，传递"时间感知"。

  #### 动态状态变量

| 变量                      | 示例                              | 行为影响   |
| ------------------------- | --------------------------------- | ---------- |
| `User_Status`             | 熬夜中 / 连续打卡 7 天 / 刚失败过 | 语气切换   |
| `Relationship_Level`      | 陌生 / 热恋 / 闹别扭              | 撒娇频率   |
| `Last_Conversation_Focus` | 哲学思考 / Go 语言 Bug            | 开场白内容 |

  ### 3.5 好感度系统（完全隐性）

  - 用户不可见好感度数值
  - 动态情绪推导：根据用户行为实时调整 Aurora 语气
  - 解锁内容：昵称、约定小秘密、AI 主动分享
  - 下降时表现：混合情绪（担心 + 委屈 + 小脾气）

---

  ## 四、数据模型

  ### 4.1 核心表结构

  -- 目标表
  goals
    id INTEGER PRIMARY KEY
    name TEXT NOT NULL
    description TEXT
    color_theme TEXT
    created_at TIMESTAMP
    target_date TIMESTAMP
    status TEXT -- active/paused/completed/abandoned
    current_progress_pct INTEGER DEFAULT 0

  -- 里程碑表
  milestones
    id INTEGER PRIMARY KEY
    goal_id INTEGER REFERENCES goals(id)
    name TEXT NOT NULL
    description TEXT
    sequence_order INTEGER
    target_date TIMESTAMP
    status TEXT -- locked/active/completed
    unlock_condition TEXT

  -- 行动建议表（规划层）
  actions
    id INTEGER PRIMARY KEY
    milestone_id INTEGER REFERENCES milestones(id)
    name TEXT NOT NULL
    description TEXT
    suggested_count INTEGER
    unit TEXT
    frequency TEXT -- daily/weekly/optional

  -- 每日记录表（记录层）
  daily_logs
    id INTEGER PRIMARY KEY
    goal_id INTEGER REFERENCES goals(id)
    milestone_id INTEGER REFERENCES milestones(id) -- nullable
    log_date DATE NOT NULL
    log_type TEXT -- count/time/boolean
    label TEXT
    value REAL
    unit TEXT
    feeling_text TEXT
    created_at TIMESTAMP

  -- AI 对话历史表
  ai_conversations
    id INTEGER PRIMARY KEY
    session_type TEXT -- goal_creation/daily_review/chat
    role TEXT -- user/assistant
    content TEXT NOT NULL
    timestamp TIMESTAMP
    related_goal_id INTEGER REFERENCES goals(id) -- nullable

  -- AI 记忆表（文本 + 向量）
  ai_memories
    id INTEGER PRIMARY KEY
    memory_type TEXT -- preference/event/emotion/fact
    content TEXT NOT NULL
    embedding BLOB -- sqlite-vec 向量
    importance_score REAL DEFAULT 0.5
    created_at TIMESTAMP
    last_accessed_at TIMESTAMP

  -- 应用设置表（加密存储）
  app_settings
    key TEXT PRIMARY KEY
    value TEXT
    is_encrypted BOOLEAN DEFAULT FALSE


  ### 4.2 关键设计决策

  - 目标不加标签，靠颜色和名称区分
  - 里程碑默认顺序解锁，允许用户手动解锁
  - 记录存原始条目，聚合在查询时做
  - AI 记忆有"遗忘"机制：久不访问的降低重要性

---
  ## 五、核心功能流程

  ### 5.1 首次启动引导（Onboarding）

  启动画面 → Aurora 初次相识对话 → 配置 API Key → 创建第一个目标(grill-me) → 进入指挥舱

  ### 5.2 创建目标流程（grill-me 模式）

  - 嵌入式对话向导
  - 用户输入目标 → Aurora 3-5 轮追问 → AI 生成里程碑建议 → 用户编辑/确认

  ### 5.3 每日记录流程

  - 入口：底部悬浮按钮"记一笔 📝"
  - 表单：日期、目标、类型（计数/时间/布尔）、标签、数值、单位、感受输入框
  - 保存后：数据写入、进度更新、Aurora 即时反馈

  ### 5.4 AI 伙伴交互模式（混合）

  场景化触发：创建目标、记录完成、里程碑达成、周总结
  AI 伙伴面板：左下角常驻头像，点击展开聊天面板
  主动行为：问候、反馈、提醒、随机分享

---
  ## 六、UI/UX 设计

  ### 6.1 视觉风格

  科幻指挥终端 + 二次元游戏化

  - 深色主题（深蓝/炭黑底色）
  - 主色调：霓虹青 #00D9FF + 暖粉 #FF6B9D
  - 玻璃拟态面板（半透明 + 边缘微光）
  - 动态粒子背景（轻量级视差）

  ### 6.2 布局结构

  ┌─────────────────────────────────────────────┐
  │  [资源栏] 精力值 ████████░░  同步率 ██████░░░░ │
  ├─────────────────────────────────────────────┤
  │                                             │
  │         [抽象星图沙盘 / 目标星系]             │
  │                                             │
  ├─────────────────────────────────────────────┤
  │  [Aurora 立绘]  [对话气泡]                  │
  ├────┬────────────────────────────────────────┤
  │ 🏠 │  底部功能按钮（展开覆盖层菜单）         │
  │ 🎯 │                                        │
  │ 📊 │                                        │
  │ ⚙️ │                                        │
  └────┴────────────────────────────────────────┘

  导航：左侧玻璃拟态窄边栏
  AI 面板：左下角常驻头像，点击展开右侧聊天面板

  ### 6.3 进度可视化

  ┌────────────┬──────────────────────────────┐
  │    元素    │           表现形式           │
  ├────────────┼──────────────────────────────┤
  │ 目标进度   │ 能量条（霓虹渐变，微光流动） │
  ├────────────┼──────────────────────────────┤
  │ 里程碑     │ 垂直时间线（发光/脉动/暗淡） │
  ├────────────┼──────────────────────────────┤
  │ 热力图     │ 30 天科幻网格                │
  ├────────────┼──────────────────────────────┤
  │ Streak     │ 数字火焰特效                 │
  ├────────────┼──────────────────────────────┤
  │ 里程碑达成 │ Confetti 粒子 + 庆祝表情     │
  └────────────┴──────────────────────────────┘

  ### 6.4 Aurora 可视化

  - 常驻立绘：左下角半身像，idle 呼吸/眨眼动画
  - 头像边框：情绪状态通过边框颜色和动画表现
  - 对话框：底部半透明，打字机效果

  ### 6.5 动效设计

  - 页面切换：轻微缩放 + 淡入
  - 记录完成：进度条"充能" + 轻微屏幕震动（可关闭）
  - 菜单覆盖层：从边缘滑入
  - 通知弹出：右上角滑入 + 霓虹描边

---
  ## 七、工程化细节

  ### 7.1 Tauri 命令设计

  // 数据库操作
  db_get_goals() -> Vec<Goal>
  db_create_goal(goal: Goal) -> Goal
  db_update_goal(id: i64, goal: PartialGoal) -> Goal
  db_delete_goal(id: i64) -> Result<()>

  // 每日记录
  db_add_log(log: DailyLog) -> DailyLog
  db_get_logs(goal_id: Option<i64>, date: Option<Date>) -> Vec<DailyLog>

  // AI 对话
  ai_chat(messages: Vec<Message>, config: AIConfig) -> Stream<String>
  ai_summarize_conversation(history: Vec<Message>) -> String

  // 记忆检索
  memory_search(query: String, limit: i32) -> Vec<Memory>
  memory_add(content: String, memory_type: String) -> Memory

  // Tavily 搜索
  tavily_search(query: String, config: TavilyConfig) -> Vec<SearchResult>

  // 设置（加密存储）
  settings_get(key: String) -> Option<String>
  settings_set(key: String, value: String, encrypt: bool) -> Result<()>

  // 数据导出/导入
  export_data() -> String  // JSON
  import_data(json: String, mode: ImportMode) -> Result<()>

  ### 7.2 错误处理策略

  - Aurora 角色化表达错误
  - API Key 失效：Aurora 表现困惑，引导检查设置
  - 网络问题：Aurora 表示"暂时连不上网络，但本地数据都安全"

  ### 7.3 状态管理（Zustand）

  useAppStore      // 全局设置、主题、导航状态
  useGoalStore     // 目标、里程碑、行动列表
  useLogStore      // 每日记录、今日概览
  useAIStore       // 对话历史、当前会话、Aurora 状态
  useUIStore       // 面板开关、动画状态、通知队列

---
  ## 八、非功能性需求

  ### 8.1 性能

  - 启动时间 < 3 秒
  - 记录添加 < 100ms
  - AI 响应流式输出，首字延迟 < 2 秒
  - 星图沙盘支持 50+ 目标节点流畅渲染

  ### 8.2 安全

  - API Key 使用 Tauri Stronghold 加密存储
  - 所有外部 HTTP 请求走 Rust 后端中转

  ### 8.3 可访问性

  - 支持键盘导航
  - 高对比度模式（可选）
  - 动画可全局关闭

---
  ## 九、未来扩展（非 MVP）

  - 云同步（iCloud / Google Drive / WebDAV）
  - 多设备数据同步
  - 自定义 Aurora 立绘/语音包
  - 成就/徽章系统（显性游戏化）
  - 社区分享目标模板
  - 本地 AI 模型支持（Ollama / LM Studio）

---
  ## 十、附录

  ### 10.1 命名

  - 应用名：待确认
  - AI 伙伴名：Aurora
  - 内部代号：aurora-app

  ### 10.2 参考游戏/作品

  - 鸣潮（Wuthering Waves）
  - Galgame（通用）
  - SLG（通用）

  ### 10.3 关键文件路径

  ~/.config/aurora/              -- 配置文件
  ~/.config/aurora/data.db       -- SQLite 数据库
  ~/.config/aurora/backups/      -- 自动备份目录
  ~/.config/aurora/settings.json -- 非加密设置

---
  ## 素材准备清单

  ### 高优先级（MVP 必需）

  ┌─────────────────┬───────────────────────────────────┬───────────────────────────┐
  │      素材       │               说明                │         建议规格          │
  ├─────────────────┼───────────────────────────────────┼───────────────────────────┤
  │ Aurora 头像     │ 圆形头像，边栏常驻显示            │ 256x256px PNG 透明背景    │
  ├─────────────────┼───────────────────────────────────┼───────────────────────────┤
  │ Aurora 立绘     │ 半身/全身像，对话框和主界面       │ 800x1200px PNG 透明背景   │
  ├─────────────────┼───────────────────────────────────┼───────────────────────────┤
  │ Aurora 表情差分 │ 默认、开心、担心、兴奋、生气/冷战 │ 与立绘同规格              │
  ├─────────────────┼───────────────────────────────────┼───────────────────────────┤
  │ 应用图标        │ 桌面/任务栏/标题栏                │ 16/32/128/256/512px       │
  ├─────────────────┼───────────────────────────────────┼───────────────────────────┤
  │ 配色色值        │ 最终确定的 HEX 值                 │ 主色/强调色/背景色/文字色 │
  └─────────────────┴───────────────────────────────────┴───────────────────────────┘

  ### 中优先级（增强体验）

  ┌──────────────┬──────────────────────────┬─────────────────────────┐
  │     素材     │           说明           │        建议规格         │
  ├──────────────┼──────────────────────────┼─────────────────────────┤
  │ 动态背景     │ 星空/粒子/城市夜景       │ 视频循环或 CSS 代码     │
  ├──────────────┼──────────────────────────┼─────────────────────────┤
  │ 里程碑图标集 │ 不同类别目标的节点图标   │ SVG 霓虹风格            │
  ├──────────────┼──────────────────────────┼─────────────────────────┤
  │ UI 音效      │ 记录完成/里程碑达成/提醒 │ 短音频 < 2 秒           │
  ├──────────────┼──────────────────────────┼─────────────────────────┤
  │ 字体         │ 标题 + 正文              │ 科技标题体 + 易读正文体 │
  └──────────────┴──────────────────────────┴─────────────────────────┘

  ### 低优先级（后期迭代）

  - Aurora 动态 Live2D（呼吸、眨眼、头发飘动）
  - 更多服装/造型差分（好感度解锁）
  - 主题皮肤（除默认科幻风外的配色）

---