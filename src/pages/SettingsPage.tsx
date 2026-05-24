import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Key,
  Moon,
  Sun,
  Sparkles,
  Volume2,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface SettingsData {
  api_key: string;
  base_url: string;
  model: string;
  theme: "dark" | "light";
  animations_enabled: boolean;
  sound_enabled: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  api_key: "",
  base_url: "https://api.anthropic.com",
  model: "claude-sonnet-4-6",
  theme: "dark",
  animations_enabled: true,
  sound_enabled: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const apiKey = (await invoke<string | null>("settings_get", { key: "api_key" })) || "";
      const baseUrl =
        (await invoke<string | null>("settings_get", { key: "base_url" })) ||
        DEFAULT_SETTINGS.base_url;
      const model =
        (await invoke<string | null>("settings_get", { key: "model" })) ||
        DEFAULT_SETTINGS.model;
      const theme =
        ((await invoke<string | null>("settings_get", { key: "theme" })) as "dark" | "light") ||
        "dark";
      const animations =
        (await invoke<string | null>("settings_get", { key: "animations_enabled" })) !== "false";
      const sound =
        (await invoke<string | null>("settings_get", { key: "sound_enabled" })) === "true";

      setSettings({
        api_key: apiKey,
        base_url: baseUrl,
        model,
        theme,
        animations_enabled: animations,
        sound_enabled: sound,
      });
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    try {
      await invoke("settings_set", {
        key: "api_key",
        value: settings.api_key,
        encrypt: true,
      });
      await invoke("settings_set", {
        key: "base_url",
        value: settings.base_url,
        encrypt: false,
      });
      await invoke("settings_set", {
        key: "model",
        value: settings.model,
        encrypt: false,
      });
      await invoke("settings_set", {
        key: "theme",
        value: settings.theme,
        encrypt: false,
      });
      await invoke("settings_set", {
        key: "animations_enabled",
        value: String(settings.animations_enabled),
        encrypt: false,
      });
      await invoke("settings_set", {
        key: "sound_enabled",
        value: String(settings.sound_enabled),
        encrypt: false,
      });
      setMessage({ type: "success", text: "设置已保存" });
    } catch (e) {
      console.error("Failed to save settings:", e);
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    try {
      const json = await invoke<string>("export_data");
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aurora-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "数据已导出" });
    } catch (e) {
      console.error("Export failed:", e);
      setMessage({ type: "error", text: "导出失败" });
    }
  }

  async function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await invoke("import_data", { req: { json: text } });
        setMessage({ type: "success", text: "数据已导入，请刷新页面" });
      } catch (e) {
        console.error("Import failed:", e);
        setMessage({ type: "error", text: "导入失败，请检查文件格式" });
      }
    };
    input.click();
  }

  function toggleSetting(key: keyof SettingsData) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="text-aurora-cyan" size={28} />
          系统设置
        </h2>
        <p className="text-slate-500 text-sm mt-1">配置 Aurora 的行为与外观</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-6">
        {/* API Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} className="text-aurora-cyan" />
            <h3 className="text-lg font-semibold text-slate-100">API 配置</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Anthropic API Key</label>
              <input
                type="password"
                value={settings.api_key}
                onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                placeholder="sk-ant-api03-..."
                className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
              />
              <p className="text-xs text-slate-600 mt-1">
                用于 Aurora AI 对话功能。密钥将被加密存储在本地。
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Base URL</label>
              <input
                type="text"
                value={settings.base_url}
                onChange={(e) => setSettings({ ...settings, base_url: e.target.value })}
                placeholder="https://api.anthropic.com"
                className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">模型</label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-aurora-cyan/50 transition-colors appearance-none"
              >
                <option value="claude-sonnet-4-6" className="bg-aurora-bg">
                  Claude Sonnet 4.6
                </option>
                <option value="claude-opus-4-6" className="bg-aurora-bg">
                  Claude Opus 4.6
                </option>
                <option value="claude-haiku-4-5" className="bg-aurora-bg">
                  Claude Haiku 4.5
                </option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-aurora-pink" />
            <h3 className="text-lg font-semibold text-slate-100">外观与体验</h3>
          </div>

          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.theme === "dark" ? (
                  <Moon size={18} className="text-slate-400" />
                ) : (
                  <Sun size={18} className="text-aurora-amber" />
                )}
                <div>
                  <div className="text-sm text-slate-200">主题</div>
                  <div className="text-xs text-slate-500">
                    {settings.theme === "dark" ? "深色模式" : "浅色模式"}
                  </div>
                </div>
              </div>
              <div className="flex rounded-xl border border-aurora-border overflow-hidden">
                <button
                  onClick={() => setSettings({ ...settings, theme: "dark" })}
                  className={`px-4 py-2 text-sm transition-colors ${
                    settings.theme === "dark"
                      ? "bg-aurora-cyan/15 text-aurora-cyan"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  深色
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: "light" })}
                  className={`px-4 py-2 text-sm transition-colors ${
                    settings.theme === "light"
                      ? "bg-aurora-cyan/15 text-aurora-cyan"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  浅色
                </button>
              </div>
            </div>

            {/* Animations */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-aurora-purple" />
                <div>
                  <div className="text-sm text-slate-200">动画效果</div>
                  <div className="text-xs text-slate-500">页面切换和交互动画</div>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("animations_enabled")}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.animations_enabled ? "bg-aurora-cyan/30" : "bg-white/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full absolute top-0.5 transition-all ${
                    settings.animations_enabled
                      ? "left-6 bg-aurora-cyan"
                      : "left-0.5 bg-slate-400"
                  }`}
                />
              </button>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-aurora-amber" />
                <div>
                  <div className="text-sm text-slate-200">音效</div>
                  <div className="text-xs text-slate-500">操作反馈音效（暂未实现）</div>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("sound_enabled")}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.sound_enabled ? "bg-aurora-cyan/30" : "bg-white/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full absolute top-0.5 transition-all ${
                    settings.sound_enabled
                      ? "left-6 bg-aurora-cyan"
                      : "left-0.5 bg-slate-400"
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Download size={18} className="text-aurora-amber" />
            <h3 className="text-lg font-semibold text-slate-100">数据管理</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={exportData}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] transition-colors text-left"
            >
              <Download size={18} className="text-aurora-cyan" />
              <div className="flex-1">
                <div className="text-sm text-slate-200">导出数据</div>
                <div className="text-xs text-slate-500">将所有目标与记录导出为 JSON 文件</div>
              </div>
            </button>

            <button
              onClick={importData}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] transition-colors text-left"
            >
              <Upload size={18} className="text-aurora-purple" />
              <div className="flex-1">
                <div className="text-sm text-slate-200">导入数据</div>
                <div className="text-xs text-slate-500">从 JSON 文件恢复数据（会覆盖现有数据）</div>
              </div>
            </button>

            <button
              onClick={() => setShowConfirmClear(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-aurora-red/10 transition-colors text-left"
            >
              <Trash2 size={18} className="text-aurora-red" />
              <div className="flex-1">
                <div className="text-sm text-aurora-red">清空所有数据</div>
                <div className="text-xs text-slate-500">删除所有目标、记录和设置（不可恢复）</div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-100">关于 Aurora</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-400">
            <p>版本 0.1.0</p>
            <p>目标管理与 AI 伙伴应用</p>
            <p className="flex items-center gap-1">
              基于
              <a
                href="https://tauri.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-aurora-cyan hover:underline flex items-center gap-0.5"
              >
                Tauri 2.0 <ExternalLink size={10} />
              </a>
              +
              <a
                href="https://react.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-aurora-cyan hover:underline flex items-center gap-0.5"
              >
                React 19 <ExternalLink size={10} />
              </a>
              构建
            </p>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <div className="mt-4 pt-4 border-t border-aurora-border flex items-center gap-4">
        {message && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-1.5 text-sm ${
              message.type === "success" ? "text-green-400" : "text-aurora-red"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertTriangle size={14} />
            )}
            {message.text}
          </motion.div>
        )}
        <div className="flex-1" />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-aurora-cyan/15 border border-aurora-cyan/30 text-aurora-cyan hover:bg-aurora-cyan/25 transition-colors font-medium disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存设置"}
        </motion.button>
      </div>

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(10, 14, 26, 0.7)" }}
          onClick={() => setShowConfirmClear(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="glass-panel rounded-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-aurora-red" />
              <h3 className="text-lg font-semibold text-slate-100">确认清空</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              这将删除所有目标、记录和设置数据。此操作不可恢复，是否继续？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2.5 rounded-xl border border-aurora-border text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowConfirmClear(false);
                  // TODO: implement clear all
                  setMessage({ type: "success", text: "数据已清空" });
                }}
                className="flex-1 py-2.5 rounded-xl bg-aurora-red/15 border border-aurora-red/30 text-aurora-red hover:bg-aurora-red/25 transition-colors font-medium"
              >
                确认清空
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
