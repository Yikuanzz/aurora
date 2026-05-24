import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Target, Calendar, Zap, LayoutGrid, Orbit, Hash } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useGoalStore } from "../stores";
import StarMap from "../components/StarMap";
import type { Goal, DailyLog } from "../types";

const PRESET_COLORS = [
  "#00D9FF",
  "#FF6B9D",
  "#FFB800",
  "#C084FC",
  "#FF4444",
  "#22C55E",
];

export default function GoalsPage() {
  const { goals, setGoals, addGoal, updateGoal, deleteGoal } = useGoalStore();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "starmap">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color_theme: "#00D9FF",
    target_date: "",
  });

  useEffect(() => {
    loadGoals();
    loadTodayLogs();
  }, []);

  async function loadGoals() {
    setLoading(true);
    try {
      const data = await invoke<Goal[]>("db_get_goals");
      setGoals(data);
    } catch (e) {
      console.error("Failed to load goals:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadTodayLogs() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const data = await invoke<DailyLog[]>("db_get_logs", { goalId: null, date: today });
      setTodayLogs(data);
    } catch (e) {
      console.error("Failed to load today logs:", e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingGoal) {
        const updated = await invoke<Goal>("db_update_goal", {
          id: editingGoal.id,
          req: {
            name: formData.name,
            description: formData.description || null,
            color_theme: formData.color_theme,
            target_date: formData.target_date || null,
          },
        });
        updateGoal(updated.id, updated);
      } else {
        const created = await invoke<Goal>("db_create_goal", {
          req: {
            name: formData.name,
            description: formData.description || null,
            color_theme: formData.color_theme,
            target_date: formData.target_date || null,
          },
        });
        addGoal(created);
      }
      closeForm();
    } catch (e) {
      console.error("Failed to save goal:", e);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定要删除这个目标吗？相关的记录也会被删除。")) return;
    try {
      await invoke("db_delete_goal", { id });
      deleteGoal(id);
    } catch (e) {
      console.error("Failed to delete goal:", e);
    }
  }

  function openCreateForm() {
    setEditingGoal(null);
    setFormData({ name: "", description: "", color_theme: "#00D9FF", target_date: "" });
    setShowForm(true);
  }

  function openEditForm(goal: Goal) {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || "",
      color_theme: goal.color_theme || "#00D9FF",
      target_date: goal.target_date || "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingGoal(null);
    setFormData({ name: "", description: "", color_theme: "#00D9FF", target_date: "" });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Target className="text-aurora-cyan" size={28} />
            星图目标
          </h2>
          <p className="text-slate-500 text-sm mt-1">管理你的目标星系</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-aurora-border overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                viewMode === "list"
                  ? "bg-aurora-cyan/15 text-aurora-cyan"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">列表</span>
            </button>
            <button
              onClick={() => setViewMode("starmap")}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                viewMode === "starmap"
                  ? "bg-aurora-cyan/15 text-aurora-cyan"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Orbit size={15} />
              <span className="hidden sm:inline">星图</span>
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurora-cyan/15 border border-aurora-cyan/30 text-aurora-cyan hover:bg-aurora-cyan/25 transition-colors"
          >
            <Plus size={18} />
            <span>新建目标</span>
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "starmap" ? (
          <motion.div
            key="starmap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 overflow-hidden"
          >
            {goals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Orbit size={64} className="mb-4 opacity-30" />
                <p>星图为空</p>
                <p className="text-sm mt-1">创建目标来点亮你的星系</p>
              </div>
            ) : (
              <StarMap goals={goals} />
            )}
          </motion.div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-slate-500">加载中...</div>
          </div>
        ) : goals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Target size={64} className="mb-4 opacity-30" />
            <p>还没有目标</p>
            <p className="text-sm mt-1">点击右上角创建你的第一个目标</p>
          </div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-4"
          >
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                todayLogs={todayLogs.filter((l) => l.goal_id === goal.id)}
                onEdit={() => openEditForm(goal)}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(10, 14, 26, 0.7)" }}
            onClick={closeForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-panel rounded-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-aurora-border flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">
                  {editingGoal ? "编辑目标" : "新建目标"}
                </h3>
                <button
                  onClick={closeForm}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">目标名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：学会 Go 语言"
                    className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="目标的详细描述..."
                    rows={3}
                    className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">主题色</label>
                  <div className="flex gap-3">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color_theme: color })}
                        className={`w-8 h-8 rounded-full transition-all ${
                          formData.color_theme === color
                            ? "ring-2 ring-white ring-offset-2 ring-offset-aurora-bg scale-110"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">目标日期</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="date"
                      value={formData.target_date}
                      onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                      className="w-full bg-white/5 border border-aurora-border rounded-xl pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 py-2.5 rounded-xl border border-aurora-border text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-aurora-cyan/15 border border-aurora-cyan/30 text-aurora-cyan hover:bg-aurora-cyan/25 transition-colors font-medium"
                  >
                    {editingGoal ? "保存" : "创建"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GoalCard({
  goal,
  todayLogs,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  todayLogs: DailyLog[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = goal.color_theme || "#00D9FF";
  const progress = goal.current_progress_pct || 0;
  const todayCount = todayLogs.length;
  const todayValue = todayLogs.reduce((sum, l) => sum + l.value, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-panel rounded-2xl p-5 group hover:border-aurora-cyan/20 transition-all duration-300"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-100 truncate">{goal.name}</h3>
          {goal.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-aurora-cyan hover:bg-aurora-cyan/10 transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-aurora-red hover:bg-aurora-red/10 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500">进度</span>
          <span className="font-medium" style={{ color }}>
            {progress}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${color}40, ${color})`,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Zap size={12} />
          {goal.status === "active" ? "进行中" : goal.status === "completed" ? "已完成" : goal.status === "paused" ? "已暂停" : "已放弃"}
        </span>
        {goal.target_date && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(goal.target_date).toLocaleDateString("zh-CN")}
          </span>
        )}
        {todayCount > 0 && (
          <span className="flex items-center gap-1" style={{ color: `${color}aa` }}>
            <Hash size={12} />
            今日 {todayCount} 条 / {Math.round(todayValue)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
