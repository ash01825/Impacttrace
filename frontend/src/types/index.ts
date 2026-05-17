export interface ImpactPath {
  component: string;
  dependencyType: "direct_caller" | "transitive_caller" | "behavioral_contract" | "shared_state";
  riskLevel: "low" | "medium" | "high";
  explanation: string;
  remediation: string;
  affectedFile?: string;
  affectedLine?: number;
}

export interface GraniteResponse {
  overallRisk: "low" | "medium" | "high";
  affectedCount: number;
  impactPaths: ImpactPath[];
  summary: {
    whatChanged: string;
    whatIsAtRisk: string;
    whatToDo: string;
  };
  codebaseInsights?: {
    criticalFiles: string[];
    architectureConcern: string;
    recommendedTests: string[];
  };
  contextSource?: string;
  changedFiles?: string[];
}

export interface AnalysisHistoryEntry {
  id: string;
  timestamp: number;
  repoUrl: string;
  repoName: string;
  diff: string;
  description: string;
  overallRisk: string;
  affectedCount: number;
  summary: {
    whatChanged: string;
    whatIsAtRisk: string;
    whatToDo: string;
  };
}

export interface SSEEvent {
  event: "impact_path" | "phase" | "complete" | "error";
  data: ImpactPath | PhaseData | GraniteResponse | ErrorData;
}

export interface PhaseData {
  phase: "indexing" | "identifying_direct" | "discovering_transitive" | "checking_behavioral";
  label: string;
}

export interface ErrorData {
  message: string;
  code?: string;
}

export interface RepoContext {
  services: ServiceInfo[];
  sharedModules: SharedModuleInfo[];
}

export interface ServiceInfo {
  name: string;
  path: string;
  description: string;
  exports: string[];
  dependencies: string[];
}

export interface SharedModuleInfo {
  name: string;
  path: string;
  description: string;
  consumedBy: string[];
}

export interface ParsedFile {
  filePath: string;
  changedFunctions: string[];
}

export interface ParsedDiff {
  files: ParsedFile[];
}

export interface AnalysisParams {
  diff: string;
  description: string;
  repoContext: RepoContext;
  parsedFiles?: ParsedDiff;
}
