import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  Hash,
  Activity,
  Flame,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { StatsData, DailyActivity, GoalActivity } from "../types";

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  delay?: number;
}

function SummaryCard({ icon: Icon, label, value, subtext, color, delay = 0 }: SummaryCardProps) {
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

function HeatMap({ data }: { data: DailyActivity[] }) {
  // Fill in missing days for the last 30 days
  const filled = useMemo(() => {
    const result: { date: string; log_count: number; intensity: number }[] = [];
    const today = new Date();
    const dataMap = new Map(data.map((d) => [d.date, d.log_count]));

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = dataMap.get(dateStr) || 0;
      const maxCount = Math.max(...data.map((d) => d.log_count), 1);
      result.push({
        date: dateStr,
        log_count: count,
        intensity: count / maxCount,
      });
    }
    return result;
  }, [data]);

  const weeks = useMemo(() => {
    const w: typeof filled[] = [];
    for (let i = 0; i < filled.length; i += 7) {
      w.push(filled.slice(i, i + 7));
    }
    return w;
  }, [filled]);

  const getColor = (intensity: number) => {
    if (intensity === 0) return "rgba(0, 217, 255, 0.03)";
    if (intensity < 0.25) return "rgba(0, 217, 255, 0.1)";
    if (intensity < 0.5) return "rgba(0, 217, 255, 0.2)";
    if (intensity < 0.75) return "rgba(0, 217, 255, 0.35)";
    return "rgba(0, 217, 255, 0.55)";
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-aurora-amber" />
        <h3 className="text-lg font-semibold text-slate-100">活动热力图</h3>
        <span className="text-xs text-slate-500 ml-auto">最近30天</span>
      </div>
      <div className="flex gap-1.5">
        {weekDays.map((day, idx) => (
          <div key={day} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-slate-600 w-8 text-center">{day}</span>
            {weeks.map((week, widx) => {
              const cell = week[idx];
              if (!cell) return <div key={widx} className="w-8 h-8 rounded-md" />;
              return (
                <div
                  key={widx}
                  className="w-8 h-8 rounded-md transition-all hover:scale-110"
                  style={{ backgroundColor: getColor(cell.intensity) }}
                  title={`${cell.date}: ${cell.log_count} 条记录`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-slate-600">少</span>
        {[0, 0.25, 0.5, 0.75, 1].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: getColor(i) }}
          />
        ))}
        <span className="text-[10px] text-slate-600">多</span>
      </div>
    </div>
  );
}

function GoalProgressList({ goals }: { goals: GoalActivity[] }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-aurora-pink" />
        <h3 className="text-lg font-semibold text-slate-100">目标进度</h3>
      </div>
      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
        {goals.length === 0 ? (
          <div className="text-center text-slate-500 py-8">暂无目标数据</div>
        ) : (
          goals.map((goal, i) => {
            const color = goal.color_theme || "#00D9FF";
            return (
              <motion.div
                key={goal.goal_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-300 truncate flex-1">{goal.goal_name}</span>
                  <span className="text-xs font-medium ml-2" style={{ color }}>
                    {goal.current_progress_pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.current_progress_pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${color}40, ${color})`,
                      boxShadow: `0 0 6px ${color}40`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                  <span>{goal.log_count} 条记录</span>
                  <span>累计 {Math.round(goal.total_value)}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function WeeklyTrend({ data }: { data: DailyActivity[] }) {
  const chartData = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const entry = data.find((x) => x.date === dateStr);
      result.push({
        date: label,
        fullDate: dateStr,
        count: entry?.log_count || 0,
        value: entry?.total_value || 0,
      });
    }
    return result;
  }, [data]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-aurora-cyan" />
        <h3 className="text-lg font-semibold text-slate-100">最近7天趋势</h3>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,217,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "rgba(0,217,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 23, 42, 0.9)",
                border: "1px solid rgba(0,217,255,0.2)",
                borderRadius: "12px",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value} 条`, "记录数"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#00D9FF"
              strokeWidth={2}
              fill="url(#colorCount)"
              dot={{ fill: "#00D9FF", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#00D9FF", stroke: "#0a0e1a", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecentLogs({ logs }: { logs: import("../types").DailyLog[] }) {
  const typeIcons: Record<string, React.ElementType> = {
    count: Hash,
    time: Clock,
    boolean: CheckCircle2,
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-aurora-purple" />
        <h3 className="text-lg font-semibold text-slate-100">最近记录</h3>
      </div>
      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-center text-slate-500 py-8">暂无记录</div>
        ) : (
          logs.map((log, i) => {
            const Icon = typeIcons[log.log_type] || Hash;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-aurora-cyan/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-aurora-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300 truncate">
                      {log.label || "记录"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {log.value} {log.unit || ""}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{log.log_date}</div>
                </div>
                {log.feeling_text && (
                  <span className="text-xs text-aurora-pink/70 flex-shrink-0 max-w-[120px] truncate">
                    {log.feeling_text}
                  </span>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function StatsPage() {
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
        <div className="text-slate-500">加载统计中...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-500">加载失败，请重试</div>
      </div>
    );
  }

  const { summary, daily_activity_last_30d, goal_activities, recent_logs } = stats;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="text-aurora-cyan" size={28} />
          数据统计
        </h2>
        <p className="text-slate-500 text-sm mt-1">追踪你的成长轨迹</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={Zap}
          label="今日记录"
          value={summary.today_log_count}
          subtext={`涉及 ${summary.today_goal_count} 个目标`}
          color="#00D9FF"
          delay={0}
        />
        <SummaryCard
          icon={Calendar}
          label="本周累计"
          value={summary.week_log_count}
          subtext={`总量 ${Math.round(summary.week_total_value)}`}
          color="#FFB800"
          delay={0.05}
        />
        <SummaryCard
          icon={Target}
          label="活跃目标"
          value={summary.active_goals}
          subtext={`共 ${summary.total_goals} 个目标`}
          color="#FF6B9D"
          delay={0.1}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="已完成"
          value={summary.completed_goals}
          subtext="继续努力"
          color="#22C55E"
          delay={0.15}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <WeeklyTrend data={daily_activity_last_30d} />
        <GoalProgressList goals={goal_activities} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HeatMap data={daily_activity_last_30d} />
        </div>
        <RecentLogs logs={recent_logs} />
      </div>
    </div>
  );
}
