import type { ChangeAnalysis, ChangeFile, RiskLevel } from '../types.js';
import type { CollectedContext } from '../collectors/contextCollector.js';

const HIGH_RISK_KEYWORDS = ['price', 'amount', 'coupon', 'discount', 'payment', 'order', 'auth', 'permission', 'delete'];

export function analyzeChange(context: CollectedContext): ChangeAnalysis {
  const changedFiles = context.changedPaths.map(toChangeFile);
  const fullText = `${context.diffText}\n${context.requirementText ?? ''}`.toLowerCase();
  const highRiskHit = HIGH_RISK_KEYWORDS.some((keyword) => fullText.includes(keyword));
  const hasFrontend = changedFiles.some((file) => file.role === 'frontend');
  const hasBackend = changedFiles.some((file) => file.role === 'backend');

  const impactedApis = new Set<string>();
  const impactedPages = new Set<string>();
  const impactedJourneys = new Set<string>();
  const riskReasons: string[] = [];

  if (fullText.includes('coupon') || fullText.includes('优惠券')) {
    impactedApis.add('POST /api/orders/preview');
    impactedApis.add('POST /api/orders');
    impactedPages.add('/checkout');
    impactedJourneys.add('checkout with coupon');
    riskReasons.push('涉及优惠券金额计算，属于核心业务规则变更。');
  }

  if (fullText.includes('vip') || fullText.includes('会员')) {
    impactedJourneys.add('VIP checkout');
    riskReasons.push('涉及会员折扣叠加，可能影响不同用户分层价格。');
  }

  if (fullText.includes('payment') || fullText.includes('支付')) {
    impactedJourneys.add('payment authorization');
    riskReasons.push('涉及支付链路或支付依赖调用。');
  }

  if (hasFrontend && hasBackend) {
    riskReasons.push('同时影响前端展示与后端计算，需要做跨层一致性验证。');
  }

  const riskLevel: RiskLevel = highRiskHit || (hasFrontend && hasBackend) ? 'high' : 'medium';

  return {
    summary: '本次变更疑似涉及优惠券、订单金额计算与结算页展示，需要覆盖 API、浏览器、Mock 和观测证据。',
    riskLevel,
    changedFiles,
    impactedApis: Array.from(impactedApis),
    impactedPages: Array.from(impactedPages),
    impactedJourneys: Array.from(impactedJourneys),
    riskReasons,
  };
}

function toChangeFile(path: string): ChangeFile {
  const lower = path.toLowerCase();
  const role = lower.includes('frontend') || lower.endsWith('.tsx') ? 'frontend'
    : lower.includes('backend') || lower.includes('service') || lower.includes('controller') ? 'backend'
    : lower.includes('test') || lower.includes('spec') ? 'test'
    : lower.includes('deploy') || lower.includes('chart') || lower.endsWith('.yaml') ? 'deploy'
    : lower.includes('config') || lower.endsWith('.json') ? 'config'
    : 'unknown';

  const risk = HIGH_RISK_KEYWORDS.some((keyword) => lower.includes(keyword)) ? 'high'
    : role === 'frontend' || role === 'backend' ? 'medium'
    : 'low';

  return {
    path,
    changeType: 'modified',
    role,
    risk,
    reason: risk === 'high' ? '文件路径命中金额、订单、优惠、支付等高风险关键词。' : `根据路径识别为 ${role} 变更。`,
  };
}
