import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { WorkflowInput, WorkflowResult, Decision } from '../types.js';
import { collectContext } from '../collectors/contextCollector.js';
import { detectProject } from '../detectors/projectDetector.js';
import { resolveDeployContract } from '../planners/deployContractResolver.js';
import { analyzeChange } from '../analyzers/changeAnalyzer.js';
import { analyzeFailures } from '../analyzers/failureAnalyzer.js';
import { planMockDependencies } from '../planners/mockDependencyPlanner.js';
import { planTestMatrix } from '../planners/testMatrixPlanner.js';
import { provisionEnvironment } from '../executors/environmentProvisioner.js';
import { executeMatrix } from '../executors/matrixExecutor.js';
import { bundleEvidence } from '../reporters/evidenceBundler.js';
import { generateReport } from '../reporters/reportGenerator.js';

export async function runWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  const testRunId = `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await mkdir(input.outDir, { recursive: true });

  const context = await collectContext(input);
  const projectDetection = detectProject(context);
  const contract = await resolveDeployContract(input.contractPath);
  const changeAnalysis = analyzeChange(context);
  const mockPlan = planMockDependencies(contract, changeAnalysis);
  const matrix = planTestMatrix({ context, contract, changeAnalysis, mockPlan });

  await provisionEnvironment({ contract, mode: input.mode, testRunId });
  const executedMatrix = await executeMatrix({ matrix, contract, mode: input.mode, testRunId });
  const failureAnalysis = analyzeFailures(executedMatrix);
  const bundle = bundleEvidence({ testRunId, changeAnalysis, matrix: executedMatrix, failureAnalysis });

  const detectionPath = join(input.outDir, 'project-detection.json');
  const matrixPath = join(input.outDir, 'test-matrix.json');
  const evidencePath = join(input.outDir, 'evidence-bundle.json');
  const failurePath = join(input.outDir, 'failure-analysis.json');
  const reportPath = join(input.outDir, 'report.md');

  await writeFile(detectionPath, JSON.stringify(projectDetection, null, 2));
  await writeFile(matrixPath, JSON.stringify(executedMatrix, null, 2));
  await writeFile(evidencePath, JSON.stringify(bundle, null, 2));
  await writeFile(failurePath, JSON.stringify(failureAnalysis, null, 2));

  const decision = decide(executedMatrix);
  const report = generateReport({ decision, context, contract, changeAnalysis, matrix: executedMatrix, evidence: bundle });
  await writeFile(reportPath, report);

  return { decision, reportPath, evidencePath };
}

function decide(matrix: Array<{ risk: string; status: string }>): Decision {
  const highRiskFailures = matrix.some((item) => item.risk === 'high' && item.status === 'failed');
  if (highRiskFailures) return '不建议合并';

  const notRunHighRisk = matrix.some((item) => item.risk === 'high' && item.status === 'not_run');
  if (notRunHighRisk) return '需要人工确认';

  return '建议合并';
}
