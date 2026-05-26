import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { ConversationMessage, AIMemory, AuroraState } from "../types";

interface AIState {
  messages: ConversationMessage[];
  memories: AIMemory[];
  auroraState: AuroraState;
  isStreaming: boolean;
  addMessage: (msg: ConversationMessage) => void;
  updateLastMessage: (updater: (msg: ConversationMessage) => ConversationMessage) => void;
  clearMessages: () => void;
  setMemories: (memories: AIMemory[]) => void;
  updateAuroraState: (partial: Partial<AuroraState>) => void;
  loadAuroraState: () => Promise<void>;
  analyzeEmotion: (input: string, context?: string) => Promise<void>;
  recordInteraction: () => Promise<void>;
  setIsStreaming: (val: boolean) => void;
}

const defaultAuroraState: AuroraState = {
  emotion: "default",
  relationship_level: "陌生",
  user_status: "",
  last_conversation_focus: "",
  affection_points: 0,
  interaction_count: 0,
  streak_days: 0,
  last_interaction_date: "",
};

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  memories: [],
  auroraState: defaultAuroraState,
  isStreaming: false,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateLastMessage: (updater) =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const lastIndex = state.messages.length - 1;
      const updated = updater(state.messages[lastIndex]);
      const messages = [...state.messages];
      messages[lastIndex] = updated;
      return { messages };
    }),
  clearMessages: () => set({ messages: [] }),
  setMemories: (memories) => set({ memories }),
  updateAuroraState: (partial) =>
    set((state) => ({
      auroraState: { ...state.auroraState, ...partial },
    })),
  loadAuroraState: async () => {
    try {
      const state = await invoke<AuroraState>("get_aurora_state");
      set({ auroraState: state });
    } catch (e) {
      console.error("Failed to load Aurora state:", e);
    }
  },
  analyzeEmotion: async (input, context) => {
    try {
      const state = await invoke<AuroraState>("analyze_and_update_emotion", {
        req: { user_input: input, context },
      });
      set({ auroraState: state });
    } catch (e) {
      console.error("Failed to analyze emotion:", e);
    }
  },
  recordInteraction: async () => {
    try {
      const state = await invoke<AuroraState>("record_interaction");
      set({ auroraState: state });
    } catch (e) {
      console.error("Failed to record interaction:", e);
    }
  },
  setIsStreaming: (val) => set({ isStreaming: val }),
}));
