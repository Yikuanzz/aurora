import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Calendar, Hash, Clock, CheckCircle2, Smile, RotateCcw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useGoalStore, useLogStore } from "../stores";
import type { DailyLog, Goal } from "../types";

interface LogFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOG_TYPES = [
  { value: "count", label: "计数", icon: Hash, unit: "次" },
  { value: "time", label: "时间", icon: Clock, unit: "分钟" },
  { value: "boolean", label: "完成", icon: CheckCircle2, unit: "" },
];

export default function LogForm({ isOpen, onClose }: LogFormProps) {
  const { goals, updateGoal } = useGoalStore();
  const { addLog } = useLogStore();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    goal_id: "",
    log_date: new Date().toISOString().split("T")[0],
    log_type: "count" as "count" | "time" | "boolean",
    label: "",
    value: "",
    unit: "次",
    feeling_text: "",
  });

  function handleTypeChange(type: "count" | "time" | "boolean") {
    const selected = LOG_TYPES.find((t) => t.value === type);
    setFormData({
      ...formData,
      log_type: type,
      unit: selected?.unit || "",
      value: type === "boolean" ? "1" : "",
    });
  }

  async function saveLog(keepOpen = false) {
    if (!formData.goal_id || saving) return;

    const goalId = Number(formData.goal_id);
    setSaving(true);
    try {
      const log = await invoke<DailyLog>("db_add_log", {
        req: {
          goal_id: goalId,
          milestone_id: null,
          log_date: formData.log_date,
          log_type: formData.log_type,
          label: formData.label || null,
          value: formData.log_type === "boolean" ? 1 : Number(formData.value) || 0,
          unit: formData.unit || null,
          feeling_text: formData.feeling_text || null,
        },
      });
      addLog(log);

      // Recalculate and update goal progress
      const updatedGoal = await invoke<import("../types").Goal>("db_recalculate_progress", {
        goalId,
      });
      updateGoal(goalId, updatedGoal);

      if (keepOpen) {
        resetForm(true);
      } else {
        resetForm(true);
        onClose();
      }
    } catch (e) {
      console.error("Failed to save log:", e);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveLog(false);
  }

  function resetForm(keepGoal = false) {
    setFormData({
      goal_id: keepGoal ? formData.goal_id : "",
      log_date: formData.log_date,
      log_type: "count",
      label: "",
      value: "",
      unit: "次",
      feeling_text: "",
    });
  }

  const selectedType = LOG_TYPES.find((t) => t.value === formData.log_type);
  const TypeIcon = selectedType?.icon || Hash;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(10, 14, 26, 0.6)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass-panel rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-aurora-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-aurora-cyan" />
                <h3 className="text-lg font-semibold text-slate-100">记一笔</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Goal Selection */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">目标 *</label>
                <select
                  value={formData.goal_id}
                  onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
                  className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-aurora-cyan/50 transition-colors appearance-none"
                  required
                >
                  <option value="" className="bg-aurora-bg">选择目标...</option>
                  {goals.map((goal: Goal) => (
                    <option key={goal.id} value={goal.id} className="bg-aurora-bg">
                      {goal.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">日期</label>
                <input
                  type="date"
                  value={formData.log_date}
                  onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                  className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
                />
              </div>

              {/* Log Type */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">记录类型</label>
                <div className="flex gap-2">
                  {LOG_TYPES.map((type) => {
                    const Icon = type.icon;
                    const active = formData.log_type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleTypeChange(type.value as "count" | "time" | "boolean")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
                          active
                            ? "bg-aurora-cyan/15 border-aurora-cyan/40 text-aurora-cyan"
                            : "border-aurora-border text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-sm">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Label & Value */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1.5">标签</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="例如：阅读、跑步"
                    className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
                  />
                </div>
                {formData.log_type !== "boolean" && (
                  <div className="w-28">
                    <label className="block text-sm text-slate-400 mb-1.5">数值</label>
                    <div className="relative">
                      <TypeIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder="0"
                        min="0"
                        step={formData.log_type === "time" ? "5" : "1"}
                        className="w-full bg-white/5 border border-aurora-border rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Unit */}
              {formData.log_type !== "boolean" && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">单位</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="次、页、公里..."
                    className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
                  />
                </div>
              )}

              {/* Feeling */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1">
                  <Smile size={14} />
                  感受
                </label>
                <textarea
                  value={formData.feeling_text}
                  onChange={(e) => setFormData({ ...formData, feeling_text: e.target.value })}
                  placeholder="今天的感觉如何..."
                  rows={2}
                  className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-aurora-border text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => saveLog(true)}
                  disabled={saving || !formData.goal_id}
                  className="flex-1 py-2.5 rounded-xl border border-aurora-border text-aurora-cyan hover:bg-aurora-cyan/10 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw size={14} />
                  保存并继续
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.goal_id}
                  className="flex-1 py-2.5 rounded-xl bg-aurora-cyan/15 border border-aurora-cyan/30 text-aurora-cyan hover:bg-aurora-cyan/25 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
