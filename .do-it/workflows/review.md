# Workflow: Review — Aurora 代码评审流程

## 触发条件

- 功能实现完成
- 修改现有代码后
- 准备提交/构建前

## 步骤

1. **自检清单**
   - [ ] 代码是否符合 `invariants.md` 中的技术栈锁定？
   - [ ] 是否有新的 TODO / FIXME？是否应该在本轮解决？
   - [ ] 错误处理是否完整？Rust 命令是否返回 `Result<T, String>`？
   - [ ] 前端是否使用了 Tailwind 类名（动态颜色除外）？
   - [ ] 类型定义是否同步更新（TS + Rust DTO）？

2. **运行验证**
   - [ ] `cargo check` (in src-tauri) 通过
   - [ ] `bun run build` (前端) 通过
   - [ ] 功能在 `bun tauri dev` 中手动验证通过

3. **更新文档**
   - [ ] `code-map.md` 是否有新增文件？
   - [ ] `runtime-status.md` 是否更新？
   - [ ] `backlog.md` 是否标记完成？

4. **提交**
   - 提交信息格式：`type(scope): description`
   - 例：`feat(goals): add milestone timeline view`
