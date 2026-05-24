mod ai;
mod commands;
mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::db_get_goals,
            commands::db_create_goal,
            commands::db_update_goal,
            commands::db_delete_goal,
            commands::db_recalculate_progress,
            commands::db_add_log,
            commands::db_get_logs,
            commands::db_get_stats,
            commands::db_get_milestones,
            commands::db_create_milestone,
            commands::db_update_milestone,
            commands::db_delete_milestone,
            commands::db_get_actions,
            commands::db_create_action,
            commands::db_update_action,
            commands::db_delete_action,
            commands::settings_get,
            commands::settings_set,
            commands::export_data,
            commands::import_data,
            commands::ai_chat,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
