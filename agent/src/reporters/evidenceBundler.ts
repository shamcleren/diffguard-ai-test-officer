import type { ChangeAnalysis, EvidenceBundle, EvidenceItem, FailureAnalysisItem, TestMatrixItem } from '../types.js';

export function bundleEvidence(input: {
  testRunId: string;
  changeAnalysis: ChangeAnalysis;
  matrix: TestMatrixItem[];
  failureAnalysis?: FailureAnalysisItem[];
}): EvidenceBundle {
  const evidence: EvidenceItem[] = input.matrix.map((item) => ({
    caseId: item.id,
    status: item.status,
    artifacts: buildArtifacts(item),
    notes: buildNotes(item),
  }));

  return {
    testRunId: input.testRunId,
    createdAt: new Date().toISOString(),
    changeSummary: input.changeAnalysis.summary,
    matrix: input.matrix,
    evidence,
    failureAnalysis: input.failureAnalysis,
  };
}

function buildArtifacts(item: TestMatrixItem): EvidenceItem['artifacts'] {
  const runtime = item.runtimeEvidence;
  const artifacts: EvidenceItem['artifacts'] = {
    apiCalls: runtime?.apiCalls,
    mockRequests: runtime?.mockRequests,
    logs: runtime?.logs,
    spans: runtime?.spans,
    files: runtime?.files,
    process: runtime?.process,
  };

  const screenshotFiles = runtime?.files?.filter((file) => file.kind === 'screenshot').map((file) => file.path) ?? [];
  const traceFile = runtime?.files?.find((file) => file.kind === 'trace')?.path;
  const videoFile = runtime?.files?.find((file) => file.kind === 'video')?.path;

  if (screenshotFiles.length > 0) artifacts.screenshots = screenshotFiles;
  if (traceFile) artifacts.playwrightTrace = traceFile;
  if (videoFile) artifacts.video = videoFile;

  if (!artifacts.screenshots && item.evidenceRequired.includes('screenshot')) {
    artifacts.screenshots = [`artifacts/${item.id}-checkout.png`];
  }
  if (!artifacts.playwrightTrace && item.evidenceRequired.includes('playwright_trace')) {
    artifacts.playwrightTrace = `artifacts/${item.id}-trace.zip`;
  }
  if (!artifacts.apiCalls && item.evidenceRequired.includes('api_response')) {
    artifacts.apiCalls = [{ method: 'POST', url: '/api/orders/preview', note: 'execute 模式下由 API Executor 写入真实 response' }];
  }
  if (!artifacts.logs && item.evidenceRequired.includes('service_log')) {
    artifacts.logs = [{ service: 'demo-shop-backend', note: 'execute 模式下可按 x-ai-test-run-id 过滤日志' }];
  }
  if (!artifacts.mockRequests && item.evidenceRequired.includes('mock_request_log')) {
    artifacts.mockRequests = [{ dependency: 'payment-service', endpoint: '/payments/authorize' }];
  }
  if (!artifacts.spans && item.evidenceRequired.includes('trace_id')) {
    artifacts.spans = [{ traceId: 'pending-or-dry-run-trace-id', spanName: 'OrderController.preview' }];
  }

  return artifacts;
}

function buildNotes(item: TestMatrixItem): string[] {
  const notes: string[] = [];
  if (item.failureReason) notes.push(item.failureReason);
  if (item.failureCategory) notes.push(`failureCategory=${item.failureCategory}`);
  if (item.fixSuggestion) notes.push(`fixSuggestion=${item.fixSuggestion}`);
  if (notes.length === 0) notes.push(`${item.id} completed with status=${item.status}`);
  return notes;
}
