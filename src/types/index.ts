// Goal types
export interface Goal {
  id: number;
  name: string;
  description: string;
  color_theme: string;
  created_at: string;
  target_date: string | null;
  status: "active" | "paused" | "completed" | "abandoned";
  current_progress_pct: number;
}

export interface Milestone {
  id: number;
  goal_id: number;
  name: string;
  description: string;
  sequence_order: number;
  target_date: string | null;
  status: "locked" | "active" | "completed";
  unlock_condition: string | null;
}

export interface Action {
  id: number;
  milestone_id: number;
  name: string;
  description: string;
  suggested_count: number;
  unit: string;
  frequency: "daily" | "weekly" | "optional";
}

// Daily log types
export interface DailyLog {
  id: number;
  goal_id: number;
  milestone_id: number | null;
  log_date: string;
  log_type: "count" | "time" | "boolean";
  label: string;
  value: number;
  unit: string;
  feeling_text: string | null;
  created_at: string;
}

// AI conversation types
export interface ConversationMessage {
  id: number;
  session_type: "goal_creation" | "daily_review" | "chat";
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  related_goal_id: number | null;
}

// AI memory types
export interface AIMemory {
  id: number;
  memory_type: "preference" | "event" | "emotion" | "fact";
  content: string;
  embedding: Uint8Array | null;
  importance_score: number;
  created_at: string;
  last_accessed_at: string;
}

// Aurora dynamic state
export interface AuroraState {
  emotion: "default" | "happy" | "worried" | "excited" | "angry";
  user_status: string;
  relationship_level: string;
  last_conversation_focus: string;
}

// Stats types
export interface StatsSummary {
  today_log_count: number;
  today_goal_count: number;
  today_total_value: number;
  week_log_count: number;
  week_total_value: number;
  total_goals: number;
  active_goals: number;
  completed_goals: number;
}

export interface DailyActivity {
  date: string;
  log_count: number;
  total_value: number;
}

export interface GoalActivity {
  goal_id: number;
  goal_name: string;
  color_theme: string | null;
  log_count: number;
  total_value: number;
  current_progress_pct: number;
}

export interface StatsData {
  summary: StatsSummary;
  daily_activity_last_30d: DailyActivity[];
  goal_activities: GoalActivity[];
  recent_logs: DailyLog[];
}

// App settings
export interface AppSettings {
  api_key: string;
  base_url: string;
  model: string;
  tavily_api_key: string | null;
  theme: "dark" | "light";
  animations_enabled: boolean;
  sound_enabled: boolean;
}
