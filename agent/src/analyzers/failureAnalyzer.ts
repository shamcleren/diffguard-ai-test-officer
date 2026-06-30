import type { FailureAnalysisItem, TestMatrixItem } from '../types.js';

export function analyzeFailures(matrix: TestMatrixItem[]): FailureAnalysisItem[] {
  return matrix
    .filter((item) => item.status === 'failed')
    .map((item) => analyzeFailure(item));
}

function analyzeFailure(item: TestMatrixItem): FailureAnalysisItem {
  if (item.id === 'M-001') {
    return {
      caseId: item.id,
      category: item.failureCategory ?? 'business',
      conclusion: 'VIP 优惠券叠加计算与需求 Oracle 不一致。',
      evidence: [
        item.failureReason ?? 'finalPrice 与预期不一致。',
        'API 证据见 evidence-bundle.json 中的 M-001 apiCalls。',
      ],
      suspectedFiles: ['apps/demo-shop-backend/src/coupon.ts'],
      suggestedFixes: [
        '将 calculateFinalPrice 调整为先计算 couponDiscount，再基于扣减后的金额应用会员折扣。',
        '增加金额计算单元测试，覆盖 VIP、普通用户、未满门槛和金额下限。',
      ],
    };
  }

  if (item.id === 'M-002') {
    return {
      caseId: item.id,
      category: item.failureCategory ?? 'business',
      conclusion: '浏览器结算链路未满足需求 Oracle。',
      evidence: [
        item.failureReason ?? 'Playwright 断言失败。',
        '前端证据见 test-results/**/trace.zip、screenshot 和 playwright-report。',
      ],
      suspectedFiles: ['apps/demo-shop-frontend/src/pages/Checkout.tsx', 'apps/demo-shop-backend/src/coupon.ts'],
      suggestedFixes: [
        '前端结算页只展示 /api/orders/preview 的返回金额，不重复实现价格公式。',
        '如果页面金额来自后端，则优先修复后端优惠叠加顺序。',
      ],
    };
  }

  if (item.id === 'M-005') {
    return {
      caseId: item.id,
      category: item.failureCategory ?? 'mock',
      conclusion: '支付 mock 校验失败，订单金额向外部依赖透传存在风险或 mock 环境不可用。',
      evidence: [item.failureReason ?? 'WireMock request journal 校验失败。'],
      suspectedFiles: ['apps/demo-shop-backend/src/paymentClient.ts', 'mocks/payment/mappings/authorize-success.json'],
      suggestedFixes: [
        '确认 WireMock 已启动并开启 request journal。',
        '确认 /api/orders 创建订单时传给 payment-service 的 amount 等于订单 finalPrice。',
      ],
    };
  }

  return {
    caseId: item.id,
    category: item.failureCategory ?? 'unknown',
    conclusion: item.failureReason ?? '测试矩阵项失败。',
    evidence: [item.failureReason ?? '未提供失败原因。'],
    suspectedFiles: [],
    suggestedFixes: [item.fixSuggestion ?? '根据 evidence-bundle.json 中的运行证据进一步排查。'],
  };
}
