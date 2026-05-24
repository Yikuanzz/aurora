use crate::db::DB;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::command;

// ===== Goal Commands =====

#[derive(Debug, Serialize, Deserialize)]
pub struct Goal {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub color_theme: Option<String>,
    pub created_at: String,
    pub target_date: Option<String>,
    pub status: String,
    pub current_progress_pct: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateGoalRequest {
    pub name: String,
    pub description: Option<String>,
    pub color_theme: Option<String>,
    pub target_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGoalRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub color_theme: Option<String>,
    pub target_date: Option<String>,
    pub status: Option<String>,
    pub current_progress_pct: Option<i32>,
}

#[command]
pub fn db_get_goals() -> Result<Vec<Goal>, String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, description, color_theme, created_at, target_date, status, current_progress_pct FROM goals ORDER BY created_at DESC"
        )
        .map_err(|e| e.to_string())?;
    let goals = stmt
        .query_map([], |row| {
            Ok(Goal {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color_theme: row.get(3)?,
                created_at: row.get(4)?,
                target_date: row.get(5)?,
                status: row.get(6)?,
                current_progress_pct: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(goals)
}

#[command]
pub fn db_create_goal(req: CreateGoalRequest) -> Result<Goal, String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO goals (name, description, color_theme, target_date) VALUES (?1, ?2, ?3, ?4)",
        params![req.name, req.description, req.color_theme, req.target_date],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let goal = Goal {
        id,
        name: req.name,
        description: req.description,
        color_theme: req.color_theme,
        created_at: chrono::Local::now().to_rfc3339(),
        target_date: req.target_date,
        status: "active".to_string(),
        current_progress_pct: 0,
    };
    Ok(goal)
}

#[command]
pub fn db_update_goal(id: i64, req: UpdateGoalRequest) -> Result<Goal, String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    let mut values: Vec<rusqlite::types::Value> = vec![];
    let mut fields = vec![];

    if let Some(name) = req.name {
        fields.push("name = ?".to_string());
        values.push(name.into());
    }
    if let Some(description) = req.description {
        fields.push("description = ?".to_string());
        values.push(description.into());
    }
    if let Some(color_theme) = req.color_theme {
        fields.push("color_theme = ?".to_string());
        values.push(color_theme.into());
    }
    if let Some(target_date) = req.target_date {
        fields.push("target_date = ?".to_string());
        values.push(target_date.into());
    }
    if let Some(status) = req.status {
        fields.push("status = ?".to_string());
        values.push(status.into());
    }
    if let Some(progress) = req.current_progress_pct {
        fields.push("current_progress_pct = ?".to_string());
        values.push(progress.into());
    }

    if !fields.is_empty() {
        let sql = format!("UPDATE goals SET {} WHERE id = ?", fields.join(", "));
        values.push(id.into());
        let refs: Vec<&dyn rusqlite::ToSql> = values.iter().map(|v| v as &dyn rusqlite::ToSql).collect();
        conn.execute(&sql, rusqlite::params_from_iter(refs))
            .map_err(|e| e.to_string())?;
    }

    let mut stmt = conn
        .prepare("SELECT id, name, description, color_theme, created_at, target_date, status, current_progress_pct FROM goals WHERE id = ?")
        .map_err(|e| e.to_string())?;
    let goal = stmt
        .query_row([id], |row| {
            Ok(Goal {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color_theme: row.get(3)?,
                created_at: row.get(4)?,
                target_date: row.get(5)?,
                status: row.get(6)?,
                current_progress_pct: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    Ok(goal)
}

#[command]
pub fn db_delete_goal(id: i64) -> Result<(), String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM goals WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn db_recalculate_progress(goal_id: i64) -> Result<Goal, String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;

    // Calculate total value from all logs for this goal
    let total_value: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(value), 0) FROM daily_logs WHERE goal_id = ?",
            [goal_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // Simple heuristic: every 10 units = 1% progress, max 100%
    let progress = ((total_value / 10.0) as i32).min(100).max(0);

    conn.execute(
        "UPDATE goals SET current_progress_pct = ? WHERE id = ?",
        params![progress, goal_id],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, description, color_theme, created_at, target_date, status, current_progress_pct FROM goals WHERE id = ?")
        .map_err(|e| e.to_string())?;
    let goal = stmt
        .query_row([goal_id], |row| {
            Ok(Goal {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color_theme: row.get(3)?,
                created_at: row.get(4)?,
                target_date: row.get(5)?,
                status: row.get(6)?,
                current_progress_pct: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    Ok(goal)
}

// ===== Daily Log Commands =====

#[derive(Debug, Serialize, Deserialize)]
pub struct DailyLog {
    pub id: i64,
    pub goal_id: i64,
    pub milestone_id: Option<i64>,
    pub log_date: String,
    pub log_type: String,
    pub label: Option<String>,
    pub value: f64,
    pub unit: Option<String>,
    pub feeling_text: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateLogRequest {
    pub goal_id: i64,
    pub milestone_id: Option<i64>,
    pub log_date: String,
    pub log_type: String,
    pub label: Option<String>,
    pub value: f64,
    pub unit: Option<String>,
    pub feeling_text: Option<String>,
}

#[command]
pub fn db_add_log(req: CreateLogRequest) -> Result<DailyLog, String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO daily_logs (goal_id, milestone_id, log_date, log_type, label, value, unit, feeling_text) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            req.goal_id,
            req.milestone_id,
            req.log_date,
            req.log_type,
            req.label,
            req.value,
            req.unit,
            req.feeling_text
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let log = DailyLog {
        id,
        goal_id: req.goal_id,
        milestone_id: req.milestone_id,
        log_date: req.log_date,
        log_type: req.log_type,
        label: req.label,
        value: req.value,
        unit: req.unit,
        feeling_text: req.feeling_text,
        created_at: chrono::Local::now().to_rfc3339(),
    };
    Ok(log)
}

#[command]
pub fn db_get_logs(goal_id: Option<i64>, date: Option<String>) -> Result<Vec<DailyLog>, String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    let mut sql = String::from(
        "SELECT id, goal_id, milestone_id, log_date, log_type, label, value, unit, feeling_text, created_at FROM daily_logs WHERE 1=1"
    );
    let mut param_values: Vec<rusqlite::types::Value> = vec![];

    if let Some(gid) = goal_id {
        sql.push_str(" AND goal_id = ?");
        param_values.push(gid.into());
    }
    if let Some(d) = date {
        sql.push_str(" AND log_date = ?");
        param_values.push(d.into());
    }
    sql.push_str(" ORDER BY created_at DESC");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let refs: Vec<&dyn rusqlite::ToSql> = param_values.iter().map(|v| v as &dyn rusqlite::ToSql).collect();
    let logs = stmt
        .query_map(rusqlite::params_from_iter(refs), |row| {
            Ok(DailyLog {
                id: row.get(0)?,
                goal_id: row.get(1)?,
                milestone_id: row.get(2)?,
                log_date: row.get(3)?,
                log_type: row.get(4)?,
                label: row.get(5)?,
                value: row.get(6)?,
                unit: row.get(7)?,
                feeling_text: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(logs)
}

// ===== Settings Commands =====

#[command]
pub fn settings_get(key: String) -> Result<Option<String>, String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    let result: Result<String, _> = conn.query_row(
        "SELECT value FROM app_settings WHERE key = ?",
        [&key],
        |row| row.get(0),
    );
    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[command]
pub fn settings_set(key: String, value: String, encrypt: bool) -> Result<(), String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO app_settings (key, value, is_encrypted) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, is_encrypted = excluded.is_encrypted",
        params![key, value, if encrypt { 1 } else { 0 }],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ===== Stats Command =====

#[derive(Debug, Serialize)]
pub struct StatsSummary {
    pub today_log_count: i32,
    pub today_goal_count: i32,
    pub today_total_value: f64,
    pub week_log_count: i32,
    pub week_total_value: f64,
    pub total_goals: i32,
    pub active_goals: i32,
    pub completed_goals: i32,
}

#[derive(Debug, Serialize)]
pub struct DailyActivity {
    pub date: String,
    pub log_count: i32,
    pub total_value: f64,
}

#[derive(Debug, Serialize)]
pub struct GoalActivity {
    pub goal_id: i64,
    pub goal_name: String,
    pub color_theme: Option<String>,
    pub log_count: i32,
    pub total_value: f64,
    pub current_progress_pct: i32,
}

#[derive(Debug, Serialize)]
pub struct StatsData {
    pub summary: StatsSummary,
    pub daily_activity_last_30d: Vec<DailyActivity>,
    pub goal_activities: Vec<GoalActivity>,
    pub recent_logs: Vec<DailyLog>,
}

#[command]
pub fn db_get_stats() -> Result<StatsData, String> {
    let conn = DB.lock().map_err(|e| e.to_string())?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    // Goals summary
    let total_goals: i32 = conn
        .query_row("SELECT COUNT(*) FROM goals", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let active_goals: i32 = conn
        .query_row("SELECT COUNT(*) FROM goals WHERE status = 'active'", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let completed_goals: i32 = conn
        .query_row("SELECT COUNT(*) FROM goals WHERE status = 'completed'", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    // Today stats
    let today_log_count: i32 = conn
        .query_row("SELECT COUNT(*) FROM daily_logs WHERE log_date = ?", [&today], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let today_goal_count: i32 = conn
        .query_row(
            "SELECT COUNT(DISTINCT goal_id) FROM daily_logs WHERE log_date = ?",
            [&today],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let today_total_value: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(value), 0) FROM daily_logs WHERE log_date = ?",
            [&today],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Week stats (last 7 days)
    let week_start = (chrono::Local::now() - chrono::Duration::days(6))
        .format("%Y-%m-%d")
        .to_string();
    let week_log_count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM daily_logs WHERE log_date >= ?",
            [&week_start],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let week_total_value: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(value), 0) FROM daily_logs WHERE log_date >= ?",
            [&week_start],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Daily activity for last 30 days
    let days_30_ago = (chrono::Local::now() - chrono::Duration::days(29))
        .format("%Y-%m-%d")
        .to_string();
    let mut daily_stmt = conn
        .prepare(
            "SELECT log_date, COUNT(*) as cnt, COALESCE(SUM(value), 0) as total
             FROM daily_logs
             WHERE log_date >= ?
             GROUP BY log_date
             ORDER BY log_date"
        )
        .map_err(|e| e.to_string())?;
    let daily_activity: Vec<DailyActivity> = daily_stmt
        .query_map([&days_30_ago], |row| {
            Ok(DailyActivity {
                date: row.get(0)?,
                log_count: row.get(1)?,
                total_value: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Goal activities
    let mut goal_stmt = conn
        .prepare(
            "SELECT g.id, g.name, g.color_theme, g.current_progress_pct,
                    COUNT(l.id) as log_count, COALESCE(SUM(l.value), 0) as total_value
             FROM goals g
             LEFT JOIN daily_logs l ON g.id = l.goal_id
             GROUP BY g.id
             ORDER BY log_count DESC"
        )
        .map_err(|e| e.to_string())?;
    let goal_activities: Vec<GoalActivity> = goal_stmt
        .query_map([], |row| {
            Ok(GoalActivity {
                goal_id: row.get(0)?,
                goal_name: row.get(1)?,
                color_theme: row.get(2)?,
                current_progress_pct: row.get(3)?,
                log_count: row.get(4)?,
                total_value: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Recent 20 logs
    let mut recent_stmt = conn
        .prepare(
            "SELECT l.id, l.goal_id, l.milestone_id, l.log_date, l.log_type, l.label, l.value, l.unit, l.feeling_text, l.created_at
             FROM daily_logs l
             ORDER BY l.created_at DESC
             LIMIT 20"
        )
        .map_err(|e| e.to_string())?;
    let recent_logs: Vec<DailyLog> = recent_stmt
        .query_map([], |row| {
            Ok(DailyLog {
                id: row.get(0)?,
                goal_id: row.get(1)?,
                milestone_id: row.get(2)?,
                log_date: row.get(3)?,
                log_type: row.get(4)?,
                label: row.get(5)?,
                value: row.get(6)?,
                unit: row.get(7)?,
                feeling_text: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(StatsData {
        summary: StatsSummary {
            today_log_count,
            today_goal_count,
            today_total_value,
            week_log_count,
            week_total_value,
            total_goals,
            active_goals,
            completed_goals,
        },
        daily_activity_last_30d: daily_activity,
        goal_activities,
        recent_logs,
    })
}

// ===== Export / Import =====

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportData {
    pub goals: Vec<Goal>,
    pub logs: Vec<DailyLog>,
    pub export_time: String,
}

#[command]
pub fn export_data() -> Result<String, String> {
    let goals = db_get_goals()?;
    let logs = db_get_logs(None, None)?;
    let data = ExportData {
        goals,
        logs,
        export_time: chrono::Local::now().to_rfc3339(),
    };
    serde_json::to_string(&data).map_err(|e| e.to_string())
}

#[derive(Debug, Deserialize)]
pub struct ImportDataRequest {
    pub json: String,
}

#[command]
pub fn import_data(req: ImportDataRequest) -> Result<(), String> {
    let data: ExportData = serde_json::from_str(&req.json).map_err(|e| e.to_string())?;
    let conn = DB.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM goals", [])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM daily_logs", [])
        .map_err(|e| e.to_string())?;

    for goal in data.goals {
        conn.execute(
            "INSERT INTO goals (id, name, description, color_theme, created_at, target_date, status, current_progress_pct) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                goal.id,
                goal.name,
                goal.description,
                goal.color_theme,
                goal.created_at,
                goal.target_date,
                goal.status,
                goal.current_progress_pct
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    for log in data.logs {
        conn.execute(
            "INSERT INTO daily_logs (id, goal_id, milestone_id, log_date, log_type, label, value, unit, feeling_text, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                log.id,
                log.goal_id,
                log.milestone_id,
                log.log_date,
                log.log_type,
                log.label,
                log.value,
                log.unit,
                log.feeling_text,
                log.created_at
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

// ===== AI Chat Commands =====

use crate::ai::{chat_completion, ChatMessage};

#[derive(Debug, Deserialize)]
pub struct AIChatRequest {
    pub messages: Vec<ChatMessage>,
}

#[command]
pub async fn ai_chat(req: AIChatRequest) -> Result<String, String> {
    let (api_key, base_url, model) = {
        let conn = DB.lock().map_err(|e| e.to_string())?;

        let api_key: String = conn
            .query_row("SELECT value FROM app_settings WHERE key = 'api_key'", [], |row| row.get(0))
            .map_err(|_| "未配置 API Key，请先在设置中添加".to_string())?;

        let base_url: String = conn
            .query_row("SELECT value FROM app_settings WHERE key = 'base_url'", [], |row| row.get(0))
            .unwrap_or_else(|_| "https://api.anthropic.com".to_string());

        let model: String = conn
            .query_row("SELECT value FROM app_settings WHERE key = 'model'", [], |row| row.get(0))
            .unwrap_or_else(|_| "claude-sonnet-4-6".to_string());

        (api_key, base_url, model)
    };

    let content = chat_completion(api_key, base_url, model, req.messages).await?;
    Ok(content)
}
