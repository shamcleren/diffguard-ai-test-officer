import type { ChangeAnalysis, DeployContract } from '../types.js';

export interface MockPlanItem {
  dependency: string;
  provider: string;
  baseUrl?: string;
  mappings?: string;
  reason: string;
}

export function planMockDependencies(contract: DeployContract, analysis: ChangeAnalysis): MockPlanItem[] {
  const dependencies = contract.dependencies ?? {};

  return Object.entries(dependencies)
    .filter(([, config]) => config.mode === 'mock')
    .map(([dependency, config]) => ({
      dependency,
      provider: config.provider ?? 'unknown',
      baseUrl: config.baseUrl,
      mappings: config.mappings,
      reason: analysis.impactedJourneys.includes('payment authorization')
        ? '本次变更触达支付链路，使用 mock 隔离外部支付服务。'
        : '外部依赖在测试环境中按契约使用 mock，保证测试稳定性。',
    }));
}
