import type { ChangeAnalysis, EvidenceBundle, EvidenceItem, TestMatrixItem } from '../types.js';

export function bundleEvidence(input: {
  testRunId: string;
  changeAnalysis: ChangeAnalysis;
  matrix: TestMatrixItem[];
}): EvidenceBundle {
  const evidence: EvidenceItem[] = input.matrix.map((item) => ({
    caseId: item.id,
    status: item.status,
    artifacts: buildArtifacts(item),
    notes: item.failureReason ? [item.failureReason] : [`${item.id} dry-run 证据占位，execute 模式下由执行器写入真实物料。`],
  }));

  return {
    testRunId: input.testRunId,
    createdAt: new Date().toISOString(),
    changeSummary: input.changeAnalysis.summary,
    matrix: input.matrix,
    evidence,
  };
}

function buildArtifacts(item: TestMatrixItem): EvidenceItem['artifacts'] {
  const artifacts: EvidenceItem['artifacts'] = {};

  if (item.evidenceRequired.includes('screenshot')) {
    artifacts.screenshots = [`artifacts/${item.id}-checkout.png`];
  }
  if (item.evidenceRequired.includes('playwright_trace')) {
    artifacts.playwrightTrace = `artifacts/${item.id}-trace.zip`;
  }
  if (item.evidenceRequired.includes('api_response')) {
    artifacts.apiCalls = [{ method: 'POST', url: '/api/orders/preview', status: item.status === 'failed' ? 200 : 200 }];
  }
  if (item.evidenceRequired.includes('service_log')) {
    artifacts.logs = [{ service: 'demo-shop-backend', level: item.status === 'failed' ? 'WARN' : 'INFO' }];
  }
  if (item.evidenceRequired.includes('mock_request_log')) {
    artifacts.mockRequests = [{ dependency: 'payment-service', endpoint: '/payments/authorize' }];
  }
  if (item.evidenceRequired.includes('trace_id')) {
    artifacts.spans = [{ traceId: 'dry-run-trace-id', spanName: 'OrderController.preview' }];
  }

  return artifacts;
}
