import type { ChangeAnalysis, DeployContract, TestMatrixItem } from '../types.js';
import type { CollectedContext } from '../collectors/contextCollector.js';
import type { MockPlanItem } from './mockDependencyPlanner.js';

export interface TestMatrixInput {
  context: CollectedContext;
  contract: DeployContract;
  changeAnalysis: ChangeAnalysis;
  mockPlan: MockPlanItem[];
}

export function planTestMatrix(input: TestMatrixInput): TestMatrixItem[] {
  const matrix: TestMatrixItem[] = [];
  const text = `${input.context.diffText}\n${input.context.requirementText ?? ''}`.toLowerCase();

  if (text.includes('coupon') || text.includes('优惠券')) {
    matrix.push({
      id: 'M-001',
      source: input.context.requirementText ? 'requirement' : 'diff',
      claim: 'VIP 用户可在满 100 减 20 后叠加 95 折，100 元订单最终金额应为 76.00。',
      risk: 'high',
      layers: ['api', 'observability'],
      method: '调用 POST /api/orders/preview，传入 VIP 用户、100 元商品和 FULL100_MINUS20 优惠码。',
      oracle: 'finalPrice === 76.00，且 trace/log 中可看到正确计算链路。',
      evidenceRequired: ['api_response', 'service_log', 'trace_id'],
      status: 'not_run',
    });

    matrix.push({
      id: 'M-002',
      source: 'diff',
      claim: '结算页展示金额应与订单预览 API 返回金额一致。',
      risk: 'high',
      layers: ['browser', 'api'],
      method: 'Playwright 打开 /checkout，输入优惠码，读取页面最终金额并对比 API response。',
      oracle: '页面 final price 与 API finalPrice 完全一致。',
      evidenceRequired: ['screenshot', 'playwright_trace', 'api_response'],
      status: 'not_run',
    });

    matrix.push({
      id: 'M-003',
      source: 'requirement',
      claim: '优惠后金额不能小于 0。',
      risk: 'medium',
      layers: ['api'],
      method: '构造低金额订单和优惠券，验证后端进行金额下限保护。',
      oracle: 'finalPrice >= 0。',
      evidenceRequired: ['api_response'],
      status: 'not_run',
    });
  }

  matrix.push({
    id: 'M-004',
    source: 'regression',
    claim: '不使用优惠券时，普通订单创建流程仍然正常。',
    risk: 'medium',
    layers: ['api', 'browser'],
    method: '执行普通用户下单主路径，确认订单可创建。',
    oracle: '订单创建成功，状态为 CREATED 或 PAID。',
    evidenceRequired: ['api_response', 'screenshot'],
    status: 'not_run',
  });

  if (input.mockPlan.length > 0) {
    matrix.push({
      id: 'M-005',
      source: 'regression',
      claim: '订单支付授权请求应调用 payment-service mock，并透传正确金额。',
      risk: 'high',
      layers: ['mock', 'api'],
      method: '创建订单后查询 WireMock request journal。',
      oracle: 'payment-service 收到 POST /payments/authorize，amount 与订单 finalPrice 一致。',
      evidenceRequired: ['mock_request_log', 'api_response'],
      status: 'not_run',
    });
  }

  if (input.contract.observability?.enabled) {
    matrix.push({
      id: 'M-006',
      source: 'observability',
      claim: '每个测试请求应携带 x-ai-test-run-id，日志和 trace 可与测试矩阵项关联。',
      risk: 'medium',
      layers: ['observability'],
      method: '检查 API 请求 header、服务日志和可选 OTel trace。',
      oracle: '日志或 trace 中可检索到 testRunId 和关键业务字段。',
      evidenceRequired: ['service_log', 'trace_id'],
      status: 'not_run',
    });
  }

  return matrix;
}
