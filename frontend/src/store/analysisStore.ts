import { create } from "zustand";
import type { RepoContext, ImpactPath, GraniteResponse } from "@/types";

export interface ScannedRepo {
  id: string;
  name: string;
  url: string;
  context: RepoContext;
  serviceCount: number;
  moduleCount: number;
  scannedAt: number;
}

export interface AnalysisRecord {
  id: string;
  repoName: string;
  repoUrl: string;
  diff: string;
  description: string;
  overallRisk: "low" | "medium" | "high";
  affectedCount: number;
  impactPaths: ImpactPath[];
  summary: GraniteResponse["summary"];
  codebaseInsights?: GraniteResponse["codebaseInsights"];
  modelInfo?: GraniteResponse["modelInfo"];
  timestamp: number;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

interface AnalysisState {
  scannedRepos: ScannedRepo[];
  currentRepoContext: RepoContext | null;
  currentRepoName: string | null;
  recentAnalyses: AnalysisRecord[];
  addScannedRepo: (repo: ScannedRepo) => void;
  setCurrentRepo: (context: RepoContext, name: string, url?: string) => void;
  addAnalysis: (record: AnalysisRecord) => void;
  clearCurrentRepo: () => void;
  clearHistory: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  scannedRepos: loadFromStorage<ScannedRepo[]>("impacttrace-repos", []),
  currentRepoContext: null,
  currentRepoName: null,
  recentAnalyses: loadFromStorage<AnalysisRecord[]>("impacttrace-history", []),

  addScannedRepo: (repo) =>
    set((state) => {
      const updated = [repo, ...state.scannedRepos.slice(0, 19)];
      saveToStorage("impacttrace-repos", updated);
      return { scannedRepos: updated };
    }),

  setCurrentRepo: (context, name) =>
    set({ currentRepoContext: context, currentRepoName: name }),

  addAnalysis: (record) =>
    set((state) => {
      const updated = [record, ...state.recentAnalyses.slice(0, 49)];
      saveToStorage("impacttrace-history", updated);
      return { recentAnalyses: updated };
    }),

  clearCurrentRepo: () =>
    set({ currentRepoContext: null, currentRepoName: null }),

  clearHistory: () => {
    localStorage.removeItem("impacttrace-history");
    set({ recentAnalyses: [] });
  },
}));
