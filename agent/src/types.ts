export type RiskLevel = 'low' | 'medium' | 'high';
export type TestLayer = 'api' | 'browser' | 'database' | 'mock' | 'observability';
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'not_run';
export type Decision = '建议合并' | '不建议合并' | '需要人工确认';

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
  app: { name: string; language: string; repoRoot: string };
  deploy: { type: string; chartPath?: string; valuesFile?: string; namespacePrefix?: string; localFallback?: string };
  healthCheck: { url: string; timeoutSeconds: number };
  entrypoints: { web?: { baseUrl: string }; api?: { baseUrl: string } };
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
  };
  notes?: string[];
}

export interface EvidenceBundle {
  testRunId: string;
  createdAt: string;
  changeSummary: string;
  matrix: TestMatrixItem[];
  evidence: EvidenceItem[];
}

export interface WorkflowResult {
  decision: Decision;
  reportPath: string;
  evidencePath: string;
}
