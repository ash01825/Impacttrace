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
  modelInfo?: {
    model: string;
    provider: string;
    analysisTimeMs: number;
  };
}

export interface PhaseData {
  phase: "indexing" | "identifying_direct" | "discovering_transitive" | "checking_behavioral";
  label: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  changedFile: string;
  changedFunction: string;
  diffSnippet: string;
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
