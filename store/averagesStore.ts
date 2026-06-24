"use client";

import { create } from "zustand";

interface AveragesStore {
  averages: Record<string, number>;
  fetchAverages: (albumIds: string[]) => Promise<void>;
  setAverage: (albumId: string, avg: number | null) => void;
}

export const useAveragesStore = create<AveragesStore>((set) => ({
  averages: {},

  fetchAverages: async (albumIds) => {
    try {
      const res = await fetch("/api/averages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: albumIds }),
      });
      const data = await res.json();
      set({ averages: data.averages ?? {} });
    } catch { /* silently ignore — averages stay empty */ }
  },

  setAverage: (albumId, avg) =>
    set((state) => {
      const next = { ...state.averages };
      if (avg === null) delete next[albumId];
      else next[albumId] = avg;
      return { averages: next };
    }),
}));
