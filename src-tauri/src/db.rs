use rusqlite::{Connection, Result as SqlResult};
use std::path::PathBuf;
use std::sync::Mutex;
use once_cell::sync::Lazy;

pub static DB: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path).expect("Failed to open database");
    init_tables(&conn).expect("Failed to initialize tables");
    Mutex::new(conn)
});

fn get_db_path() -> PathBuf {
    let app_dir = dirs::config_dir()
        .unwrap_or_else(|| std::env::current_dir().unwrap())
        .join("aurora");
    std::fs::create_dir_all(&app_dir).ok();
    app_dir.join("data.db")
}

fn init_tables(conn: &Connection) -> SqlResult<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            color_theme TEXT DEFAULT '#00D9FF',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            target_date TIMESTAMP,
            status TEXT DEFAULT 'active',
            current_progress_pct INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS milestones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            sequence_order INTEGER DEFAULT 0,
            target_date TIMESTAMP,
            status TEXT DEFAULT 'locked',
            unlock_condition TEXT
        );

        CREATE TABLE IF NOT EXISTS actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            suggested_count INTEGER DEFAULT 1,
            unit TEXT DEFAULT '次',
            frequency TEXT DEFAULT 'daily'
        );

        CREATE TABLE IF NOT EXISTS daily_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
            milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
            log_date DATE NOT NULL,
            log_type TEXT DEFAULT 'count',
            label TEXT,
            value REAL DEFAULT 0,
            unit TEXT,
            feeling_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ai_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_type TEXT DEFAULT 'chat',
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            related_goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS ai_memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memory_type TEXT DEFAULT 'fact',
            content TEXT NOT NULL,
            importance_score REAL DEFAULT 0.5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            is_encrypted INTEGER DEFAULT 0
        );
        "
    )?;
    Ok(())
}
