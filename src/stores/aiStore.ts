import { create } from "zustand";
import type { ConversationMessage, AIMemory, AuroraState } from "../types";

interface AIState {
  messages: ConversationMessage[];
  memories: AIMemory[];
  auroraState: AuroraState;
  isStreaming: boolean;
  addMessage: (msg: ConversationMessage) => void;
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
  clearMessages: () => set({ messages: [] }),
  setMemories: (memories) => set({ memories }),
  updateAuroraState: (partial) =>
    set((state) => ({
      auroraState: { ...state.auroraState, ...partial },
    })),
  setIsStreaming: (val) => set({ isStreaming: val }),
}));
