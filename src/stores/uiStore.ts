import { create } from "zustand";

interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface UIState {
  auroraPanelOpen: boolean;
  logPanelOpen: boolean;
  settingsPanelOpen: boolean;
  notifications: Notification[];
  toggleAuroraPanel: () => void;
  toggleLogPanel: () => void;
  toggleSettingsPanel: () => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  auroraPanelOpen: false,
  logPanelOpen: false,
  settingsPanelOpen: false,
  notifications: [],
  toggleAuroraPanel: () =>
    set((state) => ({ auroraPanelOpen: !state.auroraPanelOpen })),
  toggleLogPanel: () =>
    set((state) => ({ logPanelOpen: !state.logPanelOpen })),
  toggleSettingsPanel: () =>
    set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: crypto.randomUUID() },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
