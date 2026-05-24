import { create } from "zustand";
import type { DailyLog } from "../types";

interface LogState {
  logs: DailyLog[];
  todayLogs: DailyLog[];
  setLogs: (logs: DailyLog[]) => void;
  addLog: (log: DailyLog) => void;
  setTodayLogs: (logs: DailyLog[]) => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  todayLogs: [],
  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  setTodayLogs: (logs) => set({ todayLogs: logs }),
}));
