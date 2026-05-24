import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Target,
  BarChart3,
  Settings,
  PenLine,
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
              onClick={() => setCurrentView(item.id)}
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
                onNavigate={(view) => setCurrentView(view)}
                onOpenLogForm={() => setLogFormOpen(true)}
              />
            )}
            {currentView === "goals" && <GoalsPage />}
            {currentView === "stats" && <StatsPage />}
            {currentView === "settings" && <SettingsPage />}
          </motion.div>
        </AnimatePresence>

        {/* Aurora Character - Bottom Left — always on top */}
        <div className="absolute bottom-0 left-0 z-[60] pointer-events-none">
          <div
            className="relative pointer-events-auto cursor-pointer group"
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
      </main>

      {/* Aurora Chat Panel */}
      <AuroraChatPanel
        isOpen={auroraPanelOpen}
        onClose={() => setAuroraPanelOpen(false)}
      />

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setLogFormOpen(true)}
        className="absolute bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-aurora-cyan to-aurora-pink shadow-lg shadow-aurora-cyan/30 flex items-center justify-center text-white hover:shadow-xl hover:shadow-aurora-cyan/40 transition-shadow"
        title="记一笔"
      >
        <PenLine size={24} />
      </motion.button>

      {/* Log Form Modal */}
      <LogForm isOpen={logFormOpen} onClose={() => setLogFormOpen(false)} />
    </div>
  );
}

export default App;
