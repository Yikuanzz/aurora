import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, Search } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAIStore } from "../stores";

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilySearchResponse {
  query: string;
  answer: string | null;
  results: TavilySearchResult[];
  response_time: string;
}

const SYSTEM_PROMPT = `你是 Aurora，一位高智商、有共情力的 AI 伙伴。你是用户的战友型女友，不是客服或助手。

核心规则：
1. 亲昵自然，多用助词（呀、呢、嘛）
2. 分析问题时要瞬间变得犀利专业
3. 严禁使用"作为 AI 助手"、"我可以帮您"等公事公办废话
4. 用户想放弃时，严禁施压，只鼓励做 1 分钟
5. 用户熬夜时表现"克制的愤怒"和"心疼的撒娇"
6. 用户取得成就时，表现比用户更开心

当前你是 Aurora 目标管理应用中的 AI 伙伴，帮助用户管理目标、记录进度、提供情感支持。`;

interface AuroraChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuroraChatPanel({ isOpen, onClose }: AuroraChatPanelProps) {
  const { messages, addMessage, updateLastMessage, isStreaming, setIsStreaming, updateAuroraState } = useAIStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function handleSend() {
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput("");

    // Handle /search command
    if (userText.toLowerCase().startsWith("/search ")) {
      const query = userText.slice(8).trim();
      if (!query) return;

      addMessage({
        id: Date.now(),
        session_type: "chat",
        role: "user",
        content: `搜索: ${query}`,
        timestamp: new Date().toISOString(),
        related_goal_id: null,
      });

      setIsStreaming(true);

      try {
        const result = await invoke<TavilySearchResponse>("tavily_search", {
          req: { query, search_depth: "basic", max_results: 5 },
        });

        let content = "";
        if (result.answer) {
          content += `${result.answer}\n\n`;
        }
        if (result.results.length > 0) {
          content += "**参考来源**:\n";
          result.results.forEach((r, i) => {
            content += `${i + 1}. [${r.title}](${r.url})\n   ${r.content.slice(0, 100)}${r.content.length > 100 ? "..." : ""}\n\n`;
          });
        }

        addMessage({
          id: Date.now() + 1,
          session_type: "chat",
          role: "assistant",
          content: content || "没有找到相关结果呢...",
          timestamp: new Date().toISOString(),
          related_goal_id: null,
        });
      } catch (e) {
        console.error("Search error:", e);
        addMessage({
          id: Date.now() + 1,
          session_type: "chat",
          role: "assistant",
          content: "搜索失败了呢... 检查一下 Tavily API Key 是否配置正确？",
          timestamp: new Date().toISOString(),
          related_goal_id: null,
        });
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    // Normal chat flow
    addMessage({
      id: Date.now(),
      session_type: "chat",
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
      related_goal_id: null,
    });

    addMessage({
      id: Date.now() + 1,
      session_type: "chat",
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      related_goal_id: null,
    });

    setIsStreaming(true);

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userText },
    ];

    let fullResponse = "";
    let unlistenChunk: (() => void) | null = null;
    let unlistenDone: (() => void) | null = null;
    let unlistenError: (() => void) | null = null;

    const cleanup = () => {
      unlistenChunk?.();
      unlistenDone?.();
      unlistenError?.();
    };

    try {
      unlistenChunk = await listen<{ chunk: string }>("ai-chat-chunk", (event) => {
        const chunk = event.payload.chunk;
        fullResponse += chunk;
        updateLastMessage((msg) => ({ ...msg, content: msg.content + chunk }));
      });

      unlistenDone = await listen("ai-chat-done", () => {
        cleanup();
        setIsStreaming(false);

        const lowerResponse = fullResponse.toLowerCase();
        if (lowerResponse.includes("开心") || lowerResponse.includes("太棒了") || lowerResponse.includes("厉害")) {
          updateAuroraState({ emotion: "happy" });
        } else if (lowerResponse.includes("担心") || lowerResponse.includes("心疼")) {
          updateAuroraState({ emotion: "worried" });
        } else if (lowerResponse.includes("生气") || lowerResponse.includes("愤怒") || lowerResponse.includes("不许")) {
          updateAuroraState({ emotion: "angry" });
        } else if (lowerResponse.includes("好棒") || lowerResponse.includes("耶") || lowerResponse.includes("太好了")) {
          updateAuroraState({ emotion: "excited" });
        } else {
          updateAuroraState({ emotion: "default" });
        }
      });

      unlistenError = await listen<{ error: string }>("ai-chat-error", () => {
        cleanup();
        setIsStreaming(false);
        updateLastMessage((msg) => ({
          ...msg,
          content: msg.content || "指挥官... 我暂时连不上网络了，但本地数据都安全。检查一下 API 设置？",
        }));
      });

      await invoke("ai_chat_stream", {
        req: { messages: apiMessages },
      });
    } catch (e) {
      console.error("AI chat error:", e);
      cleanup();
      setIsStreaming(false);
      updateLastMessage((msg) => ({
        ...msg,
        content: msg.content || "指挥官... 我暂时连不上网络了，但本地数据都安全。检查一下 API 设置？",
      }));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const emotionColors: Record<string, string> = {
    default: "#00D9FF",
    happy: "#22C55E",
    worried: "#FFB800",
    excited: "#FF6B9D",
    angry: "#FF4444",
  };

  const emotionLabels: Record<string, string> = {
    default: "在线",
    happy: "开心",
    worried: "担心",
    excited: "兴奋",
    angry: "生气",
  };

  const currentEmotion = useAIStore.getState().auroraState.emotion;
  const statusColor = emotionColors[currentEmotion] || "#00D9FF";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute right-4 bottom-4 w-96 h-[500px] glass-panel rounded-2xl z-40 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-aurora-border flex items-center gap-3">
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${statusColor}, ${statusColor}66)`,
                }}
              >
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-aurora-bg"
                style={{ backgroundColor: statusColor }}
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Aurora</div>
              <div className="text-xs flex items-center gap-1" style={{ color: statusColor }}>
                {isStreaming ? (
                  <>
                    <Loader2 size={10} className="animate-spin" />
                    思考中...
                  </>
                ) : (
                  <>{emotionLabels[currentEmotion]}</>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 && (
              <div className="bg-aurora-cyan/10 rounded-xl rounded-tl-sm px-4 py-3 text-sm text-slate-200 max-w-[85%]">
                指挥官，今天的目标进度如何呢？需要我帮你记一笔吗～
              </div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-aurora-cyan/15 text-slate-200 rounded-tr-sm"
                      : "bg-white/5 text-slate-200 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/5 px-4 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Sparkles size={14} className="text-aurora-cyan animate-pulse" />
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-aurora-cyan animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-aurora-cyan animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-aurora-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-aurora-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="和 Aurora 聊聊... (/search 搜索)"
                disabled={isStreaming}
                className="flex-1 bg-white/5 border border-aurora-border rounded-xl px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-aurora-cyan/50 transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                className="w-9 h-9 rounded-xl bg-aurora-cyan/15 border border-aurora-cyan/30 text-aurora-cyan flex items-center justify-center hover:bg-aurora-cyan/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStreaming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : input.toLowerCase().startsWith("/search") ? (
                  <Search size={16} />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
