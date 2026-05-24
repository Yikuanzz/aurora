# Maintenance — Aurora 维护指南

## 日常开发

### 启动开发服务器

```bash
bun tauri dev
```

这会同时启动 Vite 前端开发服务器和 Rust 编译。

### 仅前端开发（不需要 Rust 功能时）

```bash
bun run dev
```

### Rust 代码检查

```bash
cd src-tauri && cargo check
```

### 添加 Rust 依赖

```bash
cd src-tauri && cargo add <crate>
```

## 数据库

### 数据库位置

```
Windows: %APPDATA%\aurora\data.db
macOS:   ~/Library/Application Support/aurora/data.db
Linux:   ~/.config/aurora/data.db
```

### 重置数据库

直接删除 `data.db` 文件，下次启动时会自动重新初始化所有表。

### 查看数据库

使用任意 SQLite 客户端（如 DB Browser for SQLite）打开上述路径的 `data.db`。

## 数据备份

### 手动导出

在应用内 Settings 页面点击"导出数据"，生成 JSON 文件。

### 手动导入

在应用内 Settings 页面点击"导入数据"，选择 JSON 文件。**会覆盖现有数据**。

## 代码规范

### 前端

- 使用 Tailwind CSS 类名，不使用内联 style（动态颜色除外）。
- 组件使用函数组件 + Hooks。
- 状态更新通过 Zustand stores。
- Tauri 调用统一使用 `invoke` from `@tauri-apps/api/core`。

### 后端

- 命令函数返回 `Result<T, String>`，错误转为字符串传递给前端。
- 数据库操作使用 `rusqlite::params!` 防止 SQL 注入。
- 时间使用 `chrono::Local::now()` 生成 RFC3339 字符串。

## 发布流程

1. 更新 `src-tauri/Cargo.toml` 中的 `version`
2. 运行 `bun tauri build`
3. 安装包生成在 `src-tauri/target/release/bundle/`

## 故障排查

### 前端无法调用 Rust 命令

检查 `src-tauri/src/lib.rs` 中是否在 `generate_handler!` 宏中注册了命令。

### 数据库锁定错误

SQLite 文件可能被其他进程占用。关闭其他数据库客户端，或删除 `.db-shm`、`.db-wal` 文件。

### Tauri 构建失败

确保已安装 Tauri 系统依赖：

```bash
# Windows
rustup target add x86_64-pc-windows-msvc

# 确保 WebView2 已安装
```
