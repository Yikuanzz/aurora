import { create } from "zustand";
import type { AppSettings } from "../types";

interface AppState {
  settings: AppSettings;
  isLoading: boolean;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  api_key: "",
  base_url: "https://api.openai.com/v1",
  model: "claude-sonnet-4-6",
  tavily_api_key: null,
  theme: "dark",
  animations_enabled: true,
  sound_enabled: true,
};

export const useAppStore = create<AppState>((set) => ({
  settings: defaultSettings,
  isLoading: false,
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),
}));
