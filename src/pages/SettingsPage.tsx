import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
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
  RefreshCw,
  Wifi,
  ChevronDown,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface SettingsData {
  api_key: string;
  base_url: string;
  model: string;
  api_provider: "openai" | "anthropic";
  tavily_api_key: string;
  theme: "dark" | "light";
  animations_enabled: boolean;
  sound_enabled: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  api_key: "",
  base_url: "https://api.anthropic.com",
  model: "claude-sonnet-4-6",
  api_provider: "anthropic",
  tavily_api_key: "",
  theme: "dark",
  animations_enabled: true,
  sound_enabled: false,
};

const OPENAI_DEFAULT_MODELS = [
  "gpt-4.1",
  "gpt-4o",
  "gpt-4o-mini",
  "o3-mini",
  "o1",
];

const ANTHROPIC_DEFAULT_MODELS = [
  "claude-sonnet-4-6",
  "claude-opus-4-6",
  "claude-haiku-4-5-20251001",
  "claude-3-5-sonnet-20241022",
  "claude-3-opus-20240229",
];

interface SettingsPageProps {
  onDirtyChange?: (dirty: boolean) => void;
}

export default function SettingsPage({ onDirtyChange }: SettingsPageProps) {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; text: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(type: "success" | "error", text: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, type, text });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, show: false } : null));
    }, 3000);
  }

  useEffect(() => {
    loadSettings();
  }, []);

  // Detect dirty state and notify parent
  useEffect(() => {
    const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);
    onDirtyChange?.(isDirty);
  }, [settings, initialSettings, onDirtyChange]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node) &&
        modelTriggerRef.current &&
        !modelTriggerRef.current.contains(event.target as Node)
      ) {
        setModelDropdownOpen(false);
      }
    }
    function handleResize() {
      setModelDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
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
      const provider =
        ((await invoke<string | null>("settings_get", { key: "api_provider" })) as "openai" | "anthropic") ||
        DEFAULT_SETTINGS.api_provider;
      const tavilyApiKey =
        (await invoke<string | null>("settings_get", { key: "tavily_api_key" })) || "";
      const theme =
        ((await invoke<string | null>("settings_get", { key: "theme" })) as "dark" | "light") ||
        "dark";
      const animations =
        (await invoke<string | null>("settings_get", { key: "animations_enabled" })) !== "false";
      const sound =
        (await invoke<string | null>("settings_get", { key: "sound_enabled" })) === "true";

      const loaded = {
        api_key: apiKey,
        base_url: baseUrl,
        model,
        api_provider: provider,
        tavily_api_key: tavilyApiKey,
        theme,
        animations_enabled: animations,
        sound_enabled: sound,
      };
      setSettings(loaded);
      setInitialSettings(loaded);
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchModels() {
    if (!settings.api_key.trim()) {
      showToast("error", "请先填写 API Key");
      return;
    }
    setFetchingModels(true);
    try {
      // 先保存当前设置，确保后端能读取到
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
        key: "api_provider",
        value: settings.api_provider,
        encrypt: false,
      });

      const list = await invoke<string[]>("ai_list_models");
      setModels(list);
      showToast("success", `获取到 ${list.length} 个模型`);
    } catch (e) {
      console.error("Failed to fetch models:", e);
      showToast("error", String(e));
    } finally {
      setFetchingModels(false);
    }
  }

  async function testConnection() {
    if (!settings.api_key.trim()) {
      showToast("error", "请先填写 API Key");
      return;
    }
    setTestingConnection(true);
    try {
      // 先保存当前设置
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
        key: "api_provider",
        value: settings.api_provider,
        encrypt: false,
      });

      const response = await invoke<string>("ai_test_connection");
      showToast("success", `连接成功！响应: ${response.slice(0, 20)}...`);
    } catch (e) {
      console.error("Connection test failed:", e);
      showToast("error", String(e));
    } finally {
      setTestingConnection(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
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
        key: "api_provider",
        value: settings.api_provider,
        encrypt: false,
      });
      await invoke("settings_set", {
        key: "tavily_api_key",
        value: settings.tavily_api_key,
        encrypt: true,
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
      showToast("success", "设置已保存");
      setInitialSettings({ ...settings });
    } catch (e) {
      console.error("Failed to save settings:", e);
      showToast("error", "保存失败");
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
      showToast("success", "数据已导出");
    } catch (e) {
      console.error("Export failed:", e);
      showToast("error", "导出失败");
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
        showToast("success", "数据已导入，请刷新页面");
      } catch (e) {
        console.error("Import failed:", e);
        showToast("error", "导入失败，请检查文件格式");
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

  function handleProviderChange(provider: "openai" | "anthropic") {
    const defaultModel = provider === "openai"
      ? OPENAI_DEFAULT_MODELS[0]
      : ANTHROPIC_DEFAULT_MODELS[0];
    const defaultUrl = provider === "openai"
      ? "https://api.openai.com"
      : "https://api.anthropic.com";

    setSettings((prev) => ({
      ...prev,
      api_provider: provider,
      model: defaultModel,
      base_url: defaultUrl,
    }));
    setModels([]);
  }

  const defaultModels = settings.api_provider === "openai"
    ? OPENAI_DEFAULT_MODELS
    : ANTHROPIC_DEFAULT_MODELS;

  const apiKeyLabel = settings.api_provider === "openai"
    ? "OpenAI API Key"
    : "Anthropic API Key";
  const apiKeyPlaceholder = settings.api_provider === "openai"
    ? "sk-..."
    : "sk-ant-api03-...";

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toast - rendered via portal at top-right */}
      {createPortal(
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
          {toast?.show && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel border ${
                toast.type === "success"
                  ? "border-green-500/30 text-green-400"
                  : "border-aurora-red/30 text-aurora-red"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span className="text-sm">{toast.text}</span>
            </motion.div>
          )}
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="relative z-10 mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="text-aurora-cyan" size={28} />
            系统设置
          </h2>
          <p className="text-slate-500 text-sm mt-1">配置 Aurora 的行为与外观</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-aurora-cyan/15 border border-aurora-cyan/30 text-aurora-cyan hover:bg-aurora-cyan/30 hover:border-aurora-cyan/50 hover:shadow-[0_0_16px_rgba(0,217,255,0.15)] active:scale-[0.98] transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} onScroll={() => setModelDropdownOpen(false)} className="flex-1 overflow-y-auto pb-4 space-y-6 scrollbar-hide">
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
            {/* Provider Selector */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">API 格式</label>
              <div className="flex rounded-xl border border-aurora-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleProviderChange("anthropic")}
                  className={`flex-1 px-4 py-2.5 text-sm transition-colors ${
                    settings.api_provider === "anthropic"
                      ? "bg-aurora-cyan/15 text-aurora-cyan"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Anthropic
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange("openai")}
                  className={`flex-1 px-4 py-2.5 text-sm transition-colors ${
                    settings.api_provider === "openai"
                      ? "bg-aurora-cyan/15 text-aurora-cyan"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  OpenAI
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                选择你的 API 提供商格式。Anthropic 使用 Claude 模型，OpenAI 使用 GPT 模型。
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{apiKeyLabel}</label>
              <input
                type="password"
                value={settings.api_key}
                onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                placeholder={apiKeyPlaceholder}
                className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
              />
              <p className="text-xs text-slate-600 mt-1">
                用于 Aurora AI 对话功能。密钥将被加密存储在本地。
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Tavily API Key</label>
              <input
                type="password"
                value={settings.tavily_api_key}
                onChange={(e) => setSettings({ ...settings, tavily_api_key: e.target.value })}
                placeholder="tvly-..."
                className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
              />
              <p className="text-xs text-slate-600 mt-1">
                用于网页搜索功能。在 tavily.com 获取免费 API Key。
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Base URL</label>
              <input
                type="text"
                value={settings.base_url}
                onChange={(e) => setSettings({ ...settings, base_url: e.target.value })}
                placeholder={settings.api_provider === "openai" ? "https://api.openai.com" : "https://api.anthropic.com"}
                className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-aurora-cyan/50 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-slate-400">模型</label>
                <div className="flex gap-2"
                >
                  <button
                    type="button"
                    onClick={fetchModels}
                    disabled={fetchingModels}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-aurora-border text-slate-400 hover:text-aurora-cyan hover:border-aurora-cyan/30 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={fetchingModels ? "animate-spin" : ""} />
                    {fetchingModels ? "获取中..." : "获取模型"}
                  </button>
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={testingConnection}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-aurora-border text-slate-400 hover:text-green-400 hover:border-green-400/30 transition-colors disabled:opacity-50"
                  >
                    <Wifi size={12} className={testingConnection ? "animate-pulse" : ""} />
                    {testingConnection ? "测试中..." : "测试连接"}
                  </button>
                </div>
              </div>
              <div className="relative"
              >
                <button
                  ref={modelTriggerRef}
                  type="button"
                  onClick={() => {
                    if (!modelDropdownOpen && modelTriggerRef.current) {
                      const rect = modelTriggerRef.current.getBoundingClientRect();
                      setDropdownPos({
                        top: rect.bottom + 6,
                        left: rect.left,
                        width: rect.width,
                      });
                    }
                    setModelDropdownOpen(!modelDropdownOpen);
                  }}
                  className="w-full bg-white/5 border border-aurora-border rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-aurora-cyan/50 transition-colors flex items-center justify-between"
                >
                  <span className="truncate">{settings.model}</span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-500 transition-transform flex-shrink-0 ml-2 ${
                      modelDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {modelDropdownOpen && dropdownPos &&
                  createPortal(
                    <motion.div
                      ref={modelDropdownRef}
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-[100] glass-panel border border-aurora-border rounded-xl overflow-hidden max-h-60 overflow-y-auto scrollbar-hide"
                      style={{
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                      }}
                    >
                      {(models.length > 0 ? models : defaultModels).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSettings({ ...settings, model: m });
                            setModelDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            settings.model === m
                              ? "bg-aurora-cyan/15 text-aurora-cyan"
                              : "text-slate-300 hover:bg-white/5 hover:text-slate-100"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </motion.div>,
                    document.body
                  )}
              </div>
              {models.length > 0 && (
                <p className="text-xs text-slate-600 mt-1">从 API 获取到 {models.length} 个可用模型</p>
              )}
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
                onClick={async () => {
                  setShowConfirmClear(false);
                  try {
                    await invoke("db_clear_all");
                    showToast("success", "数据已清空，请刷新页面");
                    await loadSettings();
                  } catch (e) {
                    console.error("Clear all failed:", e);
                    showToast("error", "清空失败");
                  }
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
