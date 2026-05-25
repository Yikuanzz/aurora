import { create } from "zustand";
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
  setIsStreaming: (val: boolean) => void;
}

const defaultAuroraState: AuroraState = {
  emotion: "default",
  user_status: "",
  relationship_level: "陌生",
  last_conversation_focus: "",
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
  setIsStreaming: (val) => set({ isStreaming: val }),
}));
