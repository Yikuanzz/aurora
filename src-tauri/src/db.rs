use rusqlite::{Connection, Result as SqlResult};
use std::path::PathBuf;
use std::sync::Mutex;
use once_cell::sync::Lazy;

pub static DB: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path).expect("Failed to open database");
    init_tables(&conn).expect("Failed to initialize tables");
    backup_database(&db_path);
    Mutex::new(conn)
});

fn get_db_path() -> PathBuf {
    let app_dir = dirs::config_dir()
        .unwrap_or_else(|| std::env::current_dir().unwrap())
        .join("aurora");
    std::fs::create_dir_all(&app_dir).ok();
    app_dir.join("data.db")
}

fn get_backup_dir() -> PathBuf {
    let app_dir = dirs::config_dir()
        .unwrap_or_else(|| std::env::current_dir().unwrap())
        .join("aurora")
        .join("backups");
    std::fs::create_dir_all(&app_dir).ok();
    app_dir
}

fn backup_database(db_path: &PathBuf) {
    let backup_dir = get_backup_dir();
    if !db_path.exists() {
        return;
    }

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("data_backup_{}.db", timestamp);
    let backup_path = backup_dir.join(backup_filename);

    match std::fs::copy(db_path, &backup_path) {
        Ok(_) => {
            println!("Database backed up to: {:?}", backup_path);
            cleanup_old_backups(&backup_dir);
        }
        Err(e) => {
            eprintln!("Failed to backup database: {}", e);
        }
    }
}

fn cleanup_old_backups(backup_dir: &PathBuf) {
    let mut backups: Vec<std::fs::DirEntry> = match std::fs::read_dir(backup_dir) {
        Ok(entries) => entries.filter_map(|e| e.ok()).collect(),
        Err(_) => return,
    };

    // Sort by modified time (oldest first)
    backups.sort_by(|a, b| {
        let a_time = a.metadata().and_then(|m| m.modified()).ok();
        let b_time = b.metadata().and_then(|m| m.modified()).ok();
        a_time.cmp(&b_time)
    });

    // Keep only the 10 most recent backups
    if backups.len() > 10 {
        for old_backup in backups.iter().take(backups.len() - 10) {
            let _ = std::fs::remove_file(old_backup.path());
        }
    }
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
            embedding TEXT,
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
