import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Target,
  Calendar,
  PenLine,
  Plus,
  Hash,
  Clock,
  CheckCircle2,
  Flame,
  Activity,
  ChevronRight,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import type { StatsData, DailyLog, GoalActivity } from "../types";

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
  delay?: number;
}

function QuickAction({ icon: Icon, label, description, onClick, color, delay = 0 }: QuickActionProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-panel rounded-2xl p-5 text-left hover:border-aurora-cyan/30 transition-all group"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon size={22} />
      </div>
      <div className="text-base font-semibold text-slate-200 mb-1">{label}</div>
      <div className="text-sm text-slate-500">{description}</div>
    </motion.button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-panel rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon size={20} />
        </div>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
      {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </motion.div>
  );
}

function RecentLogItem({ log, index }: { log: DailyLog; index: number }) {
  const typeIcons: Record<string, React.ElementType> = {
    count: Hash,
    time: Clock,
    boolean: CheckCircle2,
  };
  const Icon = typeIcons[log.log_type] || Hash;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-aurora-cyan/10 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-aurora-cyan" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300 truncate">{log.label || "记录"}</span>
          <span className="text-xs text-slate-500">
            {log.value} {log.unit || ""}
          </span>
        </div>
        <div className="text-[10px] text-slate-600 mt-0.5">{log.log_date}</div>
      </div>
      {log.feeling_text && (
        <span className="text-xs text-aurora-pink/70 flex-shrink-0 max-w-[100px] truncate">
          {log.feeling_text}
        </span>
      )}
    </motion.div>
  );
}

function GoalProgressMini({ goal, index }: { goal: GoalActivity; index: number }) {
  const color = goal.color_theme || "#00D9FF";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-300 truncate">{goal.goal_name}</span>
          <span className="text-xs font-medium" style={{ color }}>
            {goal.current_progress_pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.current_progress_pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${color}40, ${color})`,
              boxShadow: `0 0 6px ${color}40`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了，指挥官还不休息吗？";
  if (hour < 9) return "早安，指挥官～今天也要元气满满哦";
  if (hour < 12) return "上午好，指挥官。目标推进得还顺利吗？";
  if (hour < 14) return "中午好，指挥官。别忘了休息一下～";
  if (hour < 18) return "下午好，指挥官。保持节奏，稳步前进";
  if (hour < 22) return "晚上好，指挥官。今天辛苦了";
  return "指挥官，该休息了哦。明天再继续吧～";
}

interface HomePageProps {
  onNavigate: (view: "goals" | "stats" | "settings") => void;
  onOpenLogForm: () => void;
}

export default function HomePage({ onNavigate, onOpenLogForm }: HomePageProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await invoke<StatsData>("db_get_stats");
      setStats(data);
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  const summary = stats?.summary;
  const recentLogs = stats?.recent_logs?.slice(0, 5) || [];
  const goalActivities = stats?.goal_activities?.filter((g) => g.log_count > 0).slice(0, 4) || [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Aurora greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          欢迎回到指挥舱，指挥官
        </h1>
        <p className="text-aurora-cyan/80 text-base">{getGreeting()}</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Zap}
          label="今日记录"
          value={summary?.today_log_count || 0}
          subtext={`涉及 ${summary?.today_goal_count || 0} 个目标`}
          color="#00D9FF"
          delay={0}
        />
        <StatCard
          icon={Flame}
          label="本周累计"
          value={summary?.week_log_count || 0}
          subtext={`总量 ${Math.round(summary?.week_total_value || 0)}`}
          color="#FFB800"
          delay={0.05}
        />
        <StatCard
          icon={Target}
          label="活跃目标"
          value={summary?.active_goals || 0}
          subtext={`共 ${summary?.total_goals || 0} 个目标`}
          color="#FF6B9D"
          delay={0.1}
        />
        <StatCard
          icon={Calendar}
          label="已完成"
          value={summary?.completed_goals || 0}
          subtext="继续努力"
          color="#22C55E"
          delay={0.15}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <QuickAction
          icon={PenLine}
          label="记一笔"
          description="快速记录今日进度"
          onClick={onOpenLogForm}
          color="#00D9FF"
          delay={0.1}
        />
        <QuickAction
          icon={Plus}
          label="新建目标"
          description="在星图中添加新目标"
          onClick={() => onNavigate("goals")}
          color="#FF6B9D"
          delay={0.15}
        />
        <QuickAction
          icon={Activity}
          label="查看数据"
          description="追踪成长轨迹"
          onClick={() => onNavigate("stats")}
          color="#C084FC"
          delay={0.2}
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Recent Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl p-5 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-aurora-cyan" />
              <h3 className="text-lg font-semibold text-slate-100">最近记录</h3>
            </div>
            <button
              onClick={() => onNavigate("stats")}
              className="text-xs text-aurora-cyan hover:text-aurora-cyan/80 flex items-center gap-0.5 transition-colors"
            >
              查看更多 <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {recentLogs.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <div className="mb-2">还没有记录</div>
                <button
                  onClick={onOpenLogForm}
                  className="text-sm text-aurora-cyan hover:underline"
                >
                  记一笔 →
                </button>
              </div>
            ) : (
              recentLogs.map((log, i) => (
                <RecentLogItem key={log.id} log={log} index={i} />
              ))
            )}
          </div>
        </motion.div>

        {/* Active Goal Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel rounded-2xl p-5 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-aurora-pink" />
              <h3 className="text-lg font-semibold text-slate-100">目标进度</h3>
            </div>
            <button
              onClick={() => onNavigate("goals")}
              className="text-xs text-aurora-pink hover:text-aurora-pink/80 flex items-center gap-0.5 transition-colors"
            >
              查看星图 <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {goalActivities.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <div className="mb-2">还没有活跃的目标</div>
                <button
                  onClick={() => onNavigate("goals")}
                  className="text-sm text-aurora-pink hover:underline"
                >
                  创建目标 →
                </button>
              </div>
            ) : (
              goalActivities.map((goal, i) => (
                <GoalProgressMini key={goal.goal_id} goal={goal} index={i} />
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
