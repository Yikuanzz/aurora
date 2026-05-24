# Workflow: Planning — Aurora 需求规划流程

## 触发条件

- 新增功能需求
- 修改现有功能
- 技术方案需要评审

## 步骤

1. **阅读上下文**
   - 查看 `.do-it/handbook/invariants.md` — 确认需求是否违反不变量
   - 查看 `.do-it/handbook/backlog.md` — 确认是否已有类似任务
   - 查看 `.do-it/handbook/architecture.md` — 确认技术方案符合架构

2. **使用 grill-me（如需）**
   - 如果需求模糊或边界不清，运行 grill-me 澄清
   - 输出到 `.do-it/grill/YYYY-MM-DD-topic.md`

3. **编写计划**
   - 使用任务卡片模板（见 `.do-it/handbook/task-card-template.md`）
   - 将计划写入 `.do-it/plans/YYYY-MM-DD-feature-name.md`
   - 包含：背景、验收标准、涉及文件、估计工作量

4. **更新 backlog**
   - 将新任务加入 `.do-it/handbook/backlog.md`
   - 标注依赖关系

5. **执行**
   - 按优先级从 backlog 中取任务
   - 完成后更新 backlog 状态
