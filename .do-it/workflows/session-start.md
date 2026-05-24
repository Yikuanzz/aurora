# Workflow: Session Start — Aurora 会话启动流程

## 每次会话开始时执行

1. **阅读 handbook**
   - `.do-it/handbook/invariants.md` — 复习项目不变量
   - `.do-it/handbook/runtime-status.md` — 了解上次遗留状态
   - `.do-it/handbook/backlog.md` — 了解当前待办优先级

2. **同步代码状态**
   - `git status` — 查看未提交更改
   - 如有未提交工作，优先处理或记录到 `runtime-status.md`

3. **确认任务**
   - 用户是否有明确的任务指令？
   - 如果没有，从 `backlog.md` 高优先级项中取任务

4. **执行中更新**
   - 遇到新问题时更新 `backlog.md`
   - 完成阶段性工作时更新 `runtime-status.md`
   - 新增/修改文件时更新 `code-map.md`

5. **会话结束**
   - 更新 `runtime-status.md` 记录遗留问题
   - 更新 `backlog.md` 标记已完成项
