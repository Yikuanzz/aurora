import { create } from "zustand";
import type { Goal, Milestone, Action } from "../types";

interface GoalState {
  goals: Goal[];
  milestones: Record<number, Milestone[]>;
  actions: Record<number, Action[]>;
  activeGoalId: number | null;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: number, partial: Partial<Goal>) => void;
  deleteGoal: (id: number) => void;
  setMilestones: (goalId: number, milestones: Milestone[]) => void;
  setActions: (milestoneId: number, actions: Action[]) => void;
  setActiveGoalId: (id: number | null) => void;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  milestones: {},
  actions: {},
  activeGoalId: null,
  setGoals: (goals) => set({ goals }),
  addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
  updateGoal: (id, partial) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...partial } : g)),
    })),
  deleteGoal: (id) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    })),
  setMilestones: (goalId, milestones) =>
    set((state) => ({
      milestones: { ...state.milestones, [goalId]: milestones },
    })),
  setActions: (milestoneId, actions) =>
    set((state) => ({
      actions: { ...state.actions, [milestoneId]: actions },
    })),
  setActiveGoalId: (id) => set({ activeGoalId: id }),
}));
