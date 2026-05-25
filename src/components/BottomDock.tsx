import { useState } from "react";
import { motion } from "framer-motion";
import { PenLine, MessageCircle, ChevronDown } from "lucide-react";

interface BottomDockProps {
  onToggleChat: () => void;
  onOpenLogForm: () => void;
}

export default function BottomDock({ onToggleChat, onOpenLogForm }: BottomDockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-50 flex flex-col items-center"
      initial={false}
      animate={{
        y: isExpanded ? 0 : "calc(100% - 44px)",
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 35,
      }}
    >
      {/* Drag Handle Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-panel rounded-t-xl px-6 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-white/[0.08] transition-colors border-b-0"
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      >
        <div className="w-8 h-1 rounded-full bg-white/25" />
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-white/40" />
        </motion.div>
      </button>

      {/* Dock Content */}
      <div
        className="w-full glass-panel border-t-0"
        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      >
        <div className="flex items-end justify-between px-4 pt-2 pb-3">
          {/* Aurora Character - clickable to toggle chat */}
          <button
            onClick={onToggleChat}
            className="relative group cursor-pointer"
          >
            {/* Ambient glow */}
            <div
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(10,30,50,0.4) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-10 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(0,217,255,0.05) 0%, transparent 60%)",
                filter: "blur(12px)",
              }}
            />

            <img
              src="/aurora_立绘.png"
              alt="Aurora"
              className="h-[180px] w-auto object-contain transition-all duration-500 group-hover:brightness-110"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 88%, transparent 100%)",
                mixBlendMode: "multiply",
              }}
              draggable={false}
            />

            {/* Emotion glow ring */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border border-aurora-cyan/[0.08] animate-pulse pointer-events-none" />
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-4 mr-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleChat}
              className="w-11 h-11 rounded-full bg-white/5 border border-aurora-border flex items-center justify-center text-slate-300 hover:text-aurora-cyan hover:border-aurora-cyan/30 transition-colors"
              title="与 Aurora 对话"
            >
              <MessageCircle size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenLogForm}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-aurora-cyan to-aurora-pink shadow-lg shadow-aurora-cyan/20 flex items-center justify-center text-white hover:shadow-xl hover:shadow-aurora-cyan/30 transition-shadow"
              title="记一笔"
            >
              <PenLine size={22} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
