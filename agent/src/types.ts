export type RiskLevel = 'low' | 'medium' | 'high';
export type TestLayer = 'api' | 'browser' | 'database' | 'mock' | 'observability';
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'not_run';
export type Decision = '建议合并' | '不建议合并' | '需要人工确认';
export type FailureCategory = 'business' | 'environment' | 'test' | 'mock' | 'observability' | 'unknown';

export interface WorkflowInput {
  diffPath: string;
  requirementPath?: string;
  contractPath: string;
  mode: 'dry-run' | 'execute' | string;
  outDir: string;
}

export interface ChangeFile {
  path: string;
  changeType: 'added' | 'modified' | 'deleted' | 'unknown';
  role: 'frontend' | 'backend' | 'test' | 'config' | 'deploy' | 'unknown';
  risk: RiskLevel;
  reason: string;
}

export interface ChangeAnalysis {
  summary: string;
  riskLevel: RiskLevel;
  changedFiles: ChangeFile[];
  impactedApis: string[];
  impactedPages: string[];
  impactedJourneys: string[];
  riskReasons: string[];
}

export interface DeployContract {
  app: {
    name: string;
    repoRoot: string;
    /** Optional hint only. Runtime/language should be detected automatically by default. */
    languageHint?: string;
  };
  deploy: { type: string; chartPath?: string; valuesFile?: string; namespacePrefix?: string; localFallback?: string };
  healthCheck: { url: string; timeoutSeconds: number };
  entrypoints: { web?: { baseUrl: string }; api?: { baseUrl: string } };
  project?: {
    detection?: {
      enabled?: boolean;
      confidenceThreshold?: number;
      overrides?: Record<string, unknown>;
    };
  };
  observability?: {
    enabled?: boolean;
    propagationHeaders?: string[];
    logQuery?: Record<string, unknown>;
    traceQuery?: Record<string, unknown>;
  };
  dependencies?: Record<string, {
    mode: 'mock' | 'real';
    provider?: string;
    baseUrl?: string;
    mappings?: string;
  }>;
  seed?: { command?: string };
  test?: Record<string, unknown>;
}

export interface RuntimeEvidence {
  apiCalls?: Array<{
    name?: string;
    method: string;
    url: string;
    status?: number;
    durationMs?: number;
    request?: unknown;
    response?: unknown;
    error?: string;
  }>;
  mockRequests?: Array<Record<string, unknown>>;
  logs?: Array<Record<string, unknown>>;
  spans?: Array<Record<string, unknown>>;
  files?: Array<{ kind: 'screenshot' | 'trace' | 'video' | 'report' | 'other'; path: string }>;
  process?: {
    command: string;
    exitCode: number;
    stdoutTail?: string;
    stderrTail?: string;
  };
}

export interface TestMatrixItem {
  id: string;
  source: 'diff' | 'requirement' | 'regression' | 'observability';
  claim: string;
  risk: RiskLevel;
  layers: TestLayer[];
  method: string;
  oracle: string;
  evidenceRequired: string[];
  status: TestStatus;
  failureReason?: string;
  failureCategory?: FailureCategory;
  fixSuggestion?: string;
  runtimeEvidence?: RuntimeEvidence;
}

export interface EvidenceItem {
  caseId: string;
  status: TestStatus;
  artifacts: {
    screenshots?: string[];
    playwrightTrace?: string;
    video?: string;
    apiCalls?: Array<Record<string, unknown>>;
    logs?: Array<Record<string, unknown>>;
    mockRequests?: Array<Record<string, unknown>>;
    spans?: Array<Record<string, unknown>>;
    files?: Array<Record<string, unknown>>;
    process?: Record<string, unknown>;
  };
  notes?: string[];
}

export interface FailureAnalysisItem {
  caseId: string;
  category: FailureCategory;
  conclusion: string;
  evidence: string[];
  suspectedFiles: string[];
  suggestedFixes: string[];
}

export interface EvidenceBundle {
  testRunId: string;
  createdAt: string;
  changeSummary: string;
  matrix: TestMatrixItem[];
  evidence: EvidenceItem[];
  failureAnalysis?: FailureAnalysisItem[];
}

export interface WorkflowResult {
  decision: Decision;
  reportPath: string;
  evidencePath: string;
}
