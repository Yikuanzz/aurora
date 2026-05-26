import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Target,
  BarChart3,
  Settings,
  PenLine,
  Minus,
  AlertTriangle,
} from "lucide-react";
import HomePage from "./pages/HomePage";
import GoalsPage from "./pages/GoalsPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import LogForm from "./components/LogForm";
import AuroraChatPanel from "./components/AuroraChatPanel";
import "./App.css";

type View = "home" | "goals" | "stats" | "settings";

const navItems: { id: View; icon: React.ElementType; label: string }[] = [
  { id: "home", icon: Home, label: "指挥舱" },
  { id: "goals", icon: Target, label: "星图" },
  { id: "stats", icon: BarChart3, label: "数据" },
  { id: "settings", icon: Settings, label: "设置" },
];

function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [auroraPanelOpen, setAuroraPanelOpen] = useState(false);
  const [logFormOpen, setLogFormOpen] = useState(false);
  const [dockVisible, setDockVisible] = useState(true);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [pendingView, setPendingView] = useState<View | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  function handleNavClick(view: View) {
    if (currentView === "settings" && settingsDirty && view !== "settings") {
      setPendingView(view);
      setShowLeaveConfirm(true);
      return;
    }
    setCurrentView(view);
  }

  function confirmLeave() {
    setShowLeaveConfirm(false);
    setSettingsDirty(false);
    if (pendingView) {
      setCurrentView(pendingView);
      setPendingView(null);
    }
  }

  function cancelLeave() {
    setShowLeaveConfirm(false);
    setPendingView(null);
  }

  return (
    <div className="flex h-screen w-screen bg-aurora-bg text-slate-200 overflow-hidden">
      {/* Left Sidebar */}
      <nav className="w-16 flex-shrink-0 glass-panel border-r border-aurora-border flex flex-col items-center py-6 gap-2 z-20">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-cyan to-aurora-pink flex items-center justify-center shadow-lg shadow-aurora-cyan/20">
            <span className="text-white font-bold text-sm">A</span>
          </div>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group ${
                active
                  ? "bg-aurora-cyan/15 text-aurora-cyan shadow-[0_0_12px_rgba(0,217,255,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
              title={item.label}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-aurora-cyan rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full w-full p-8"
          >
            {currentView === "home" && (
              <HomePage
                onNavigate={(view) => handleNavClick(view)}
                onOpenLogForm={() => setLogFormOpen(true)}
              />
            )}
            {currentView === "goals" && <GoalsPage />}
            {currentView === "stats" && <StatsPage />}
            {currentView === "settings" && (
              <SettingsPage onDirtyChange={setSettingsDirty} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Aurora Character - Bottom Left */}
        <motion.div
          className="absolute bottom-0 left-0 z-[60] pointer-events-none"
          initial={false}
          animate={{
            x: dockVisible ? 0 : -240,
            opacity: dockVisible ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="relative pointer-events-auto">
            {/* Collapse button */}
            <button
              onClick={() => setDockVisible(false)}
              className="absolute top-4 right-2 z-10 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
              title="收起"
            >
              <Minus size={14} />
            </button>

            <div
              className="relative cursor-pointer group"
              onClick={() => setAuroraPanelOpen(!auroraPanelOpen)}
            >
              {/* Soft ambient glow */}
              <div
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-80 h-32 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(10,30,50,0.5) 0%, rgba(10,14,26,0) 70%)",
                  filter: "blur(24px)",
                }}
              />
              <div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-56 h-16 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(0,217,255,0.06) 0%, transparent 60%)",
                  filter: "blur(16px)",
                }}
              />

              <img
                src="/aurora_立绘.png"
                alt="Aurora"
                className="h-[420px] w-auto object-contain transition-all duration-500 group-hover:brightness-110"
                style={{
                  maskImage: "linear-gradient(to bottom, black 92%, transparent 100%)",
                  mixBlendMode: "multiply",
                }}
              />

              {/* Emotion border glow */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full border border-aurora-cyan/[0.08] animate-pulse pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Expand trigger - visible when collapsed */}
        <AnimatePresence>
          {!dockVisible && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => setDockVisible(true)}
              className="absolute bottom-6 left-6 z-50 flex items-center gap-2 px-3 py-2 rounded-full glass-panel border border-aurora-border/50 text-slate-300 hover:text-aurora-cyan hover:border-aurora-cyan/30 transition-colors"
            >
              <img
                src="/aurora_头像.png"
                alt="Aurora"
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="text-xs">展开</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <motion.button
          initial={false}
          animate={{
            x: dockVisible ? 0 : 80,
            opacity: dockVisible ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setLogFormOpen(true)}
          className="absolute bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-aurora-cyan to-aurora-pink shadow-lg shadow-aurora-cyan/30 flex items-center justify-center text-white hover:shadow-xl hover:shadow-aurora-cyan/40 transition-shadow"
          title="记一笔"
        >
          <PenLine size={24} />
        </motion.button>
      </main>

      {/* Aurora Chat Panel */}
      <AuroraChatPanel
        isOpen={auroraPanelOpen}
        onClose={() => setAuroraPanelOpen(false)}
      />

      {/* Log Form Modal */}
      <LogForm isOpen={logFormOpen} onClose={() => setLogFormOpen(false)} />

      {/* Leave Settings Confirmation Dialog */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(10, 14, 26, 0.7)" }}
            onClick={cancelLeave}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel rounded-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-aurora-amber" />
                <h3 className="text-lg font-semibold text-slate-100">未保存的更改</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                设置页面有未保存的更改，离开后将丢失。是否继续离开？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLeave}
                  className="flex-1 py-2.5 rounded-xl border border-aurora-border text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                >
                  留在当前页面
                </button>
                <button
                  onClick={confirmLeave}
                  className="flex-1 py-2.5 rounded-xl bg-aurora-amber/15 border border-aurora-amber/30 text-aurora-amber hover:bg-aurora-amber/25 transition-colors font-medium"
                >
                  离开并放弃
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
