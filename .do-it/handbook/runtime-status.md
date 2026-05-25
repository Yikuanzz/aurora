# Runtime Status — Aurora 当前运行状态

> 每次会话开始时更新，记录最新可运行状态。

## 最后更新时间

2026-05-24

## 构建状态

| 命令 | 状态 | 备注 |
|------|------|------|
| `bun install` | 通过 | 依赖已安装 |
| `bun tauri dev` | 未测试 | 前端 + Rust 开发模式 |
| `cargo check` (in src-tauri) | 通过 | Rust 编译检查通过 |
| `bun tauri build` | 未测试 | 生产构建 |

## 已知问题

1. **未提交代码** — 所有开发工作都在工作区，未提交到 git（只有一个 `init project` 提交）。建议提交。
2. **进度计算为启发式** — `db_recalculate_progress` 使用简单公式（总value/10 = 进度%），未来应由里程碑完成度决定。

## 本次会话完成

- LogForm 增加日期选择器 + "保存并继续"功能
- Home 指挥舱页面：今日概览、快速操作、最近记录、目标进度、Aurora 问候语
- 记一笔后自动重新计算并更新目标进度
- AI 聊天功能：后端 `ai_chat` 命令 + 前端聊天面板（消息列表、发送、情绪状态）
- 里程碑时间线：GoalCard 可展开查看里程碑列表，支持状态切换
- 创建目标向导（grill-me 模式）：勾选 "Aurora 协助规划" 后，AI 自动生成里程碑建议，弹窗确认批量创建
- AI 聊天流式输出：Rust 后端 SSE 解析 + Tauri 事件推送，前端实时逐字显示 Aurora 回复
- Tavily 搜索：Rust 客户端 + 后端中转命令 + 设置页 API Key 配置 + 聊天面板 `/search` 命令集成

## 快速启动命令

```bash
# 开发模式
bun tauri dev

# Rust 检查
cd src-tauri && cargo check

# 前端独立预览（无 Rust 功能）
bun run dev
```
