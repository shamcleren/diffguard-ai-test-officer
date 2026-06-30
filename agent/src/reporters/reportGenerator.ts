import type { ChangeAnalysis, Decision, DeployContract, EvidenceBundle, FailureAnalysisItem, TestMatrixItem } from '../types.js';
import type { CollectedContext } from '../collectors/contextCollector.js';

export function generateReport(input: {
  decision: Decision;
  context: CollectedContext;
  contract: DeployContract;
  changeAnalysis: ChangeAnalysis;
  matrix: TestMatrixItem[];
  evidence: EvidenceBundle;
}): string {
  const passed = input.matrix.filter((item) => item.status === 'passed').length;
  const failed = input.matrix.filter((item) => item.status === 'failed').length;
  const skipped = input.matrix.filter((item) => item.status === 'skipped').length;
  const notRun = input.matrix.filter((item) => item.status === 'not_run').length;

  return `# DiffGuard 测试报告

## 决策结论

**${input.decision}**

本次运行共生成 ${input.matrix.length} 个测试矩阵项：通过 ${passed}，失败 ${failed}，跳过 ${skipped}，未运行 ${notRun}。

## 变更摘要

${input.changeAnalysis.summary}

风险等级：**${input.changeAnalysis.riskLevel}**

### 风险原因

${input.changeAnalysis.riskReasons.map((reason) => `- ${reason}`).join('\n') || '- 暂未识别明确风险原因'}

## 影响范围

### 变更文件

| 文件 | 类型 | 风险 | 原因 |
|---|---|---:|---|
${input.changeAnalysis.changedFiles.map((file) => `| ${file.path} | ${file.role} | ${file.risk} | ${file.reason} |`).join('\n') || '| 暂未识别 | unknown | low | 无 |'}

### 影响接口

${input.changeAnalysis.impactedApis.map((api) => `- ${api}`).join('\n') || '- 暂未识别'}

### 影响页面 / 用户路径

${[...input.changeAnalysis.impactedPages, ...input.changeAnalysis.impactedJourneys].map((item) => `- ${item}`).join('\n') || '- 暂未识别'}

## 测试矩阵结果

| ID | 来源 | 风险 | 层级 | 结论 | 失败分类 | 验证目标 |
|---|---|---:|---|---|---|---|
${input.matrix.map((item) => `| ${item.id} | ${item.source} | ${item.risk} | ${item.layers.join(', ')} | ${item.status} | ${item.failureCategory ?? '-'} | ${item.claim} |`).join('\n')}

## 失败项

${renderFailures(input.matrix)}

## 失败归因

${renderFailureAnalysis(input.evidence.failureAnalysis ?? [])}

## 证据包

- testRunId: \`${input.evidence.testRunId}\`
- project detection: \`reports/project-detection.json\`
- test matrix: \`reports/test-matrix.json\`
- evidence bundle: \`reports/evidence-bundle.json\`
- failure analysis: \`reports/failure-analysis.json\`

### 关键证据索引

${renderEvidenceIndex(input.evidence)}

## 部署契约摘要

- app: ${input.contract.app.name}
- deploy: ${input.contract.deploy.type}
- healthCheck: ${input.contract.healthCheck.url}
- apiBaseUrl: ${input.contract.entrypoints.api?.baseUrl ?? 'N/A'}
- webBaseUrl: ${input.contract.entrypoints.web?.baseUrl ?? 'N/A'}

## 改造建议

### 业务修复建议

1. 明确优惠券与会员折扣的计算顺序，并在后端统一实现。
2. 结算页不要重复实现价格公式，应统一消费订单预览 API 返回值。
3. 金额计算增加边界测试：未满门槛、满门槛、VIP、普通用户、金额下限。

### 可观测性改造建议

1. 所有测试请求注入 \`x-ai-test-run-id\`。
2. 在金额计算函数日志中记录 originalPrice、couponDiscount、memberDiscount、finalPrice。
3. 如果接入 OTel，在 OrderPreview、CouponService、PaymentClient span 中写入业务字段。

## 可复现命令

### Dry-run 兜底

\`\`\`bash
npm run demo
cat reports/report.md
\`\`\`

### 真实执行

\`\`\`bash
npm run dev
npm run demo:execute
cat reports/report.md
npx playwright show-trace test-results/**/trace.zip
\`\`\`
`;
}

function renderFailures(matrix: TestMatrixItem[]): string {
  const failures = matrix.filter((item) => item.status === 'failed');
  if (failures.length === 0) return '无。';

  return failures.map((item) => `### ${item.id}: ${item.claim}

- 风险等级：${item.risk}
- 验证层级：${item.layers.join(', ')}
- 验证方法：${item.method}
- 预期 Oracle：${item.oracle}
- 失败分类：${item.failureCategory ?? 'unknown'}
- 失败原因：${item.failureReason ?? '未知'}
- 修复建议：${item.fixSuggestion ?? '见失败归因章节'}
`).join('\n');
}

function renderFailureAnalysis(items: FailureAnalysisItem[]): string {
  if (items.length === 0) return '无失败项。';

  return items.map((item) => `### ${item.caseId}

- 分类：${item.category}
- 结论：${item.conclusion}
- 证据：
${item.evidence.map((evidence) => `  - ${evidence}`).join('\n')}
- 疑似文件：${item.suspectedFiles.length > 0 ? item.suspectedFiles.join(', ') : '未定位'}
- 建议修复：
${item.suggestedFixes.map((fix) => `  - ${fix}`).join('\n')}
`).join('\n');
}

function renderEvidenceIndex(bundle: EvidenceBundle): string {
  return bundle.evidence.map((item) => {
    const parts: string[] = [];
    if (item.artifacts.apiCalls?.length) parts.push(`API calls=${item.artifacts.apiCalls.length}`);
    if (item.artifacts.screenshots?.length) parts.push(`screenshots=${item.artifacts.screenshots.join(', ')}`);
    if (item.artifacts.playwrightTrace) parts.push(`trace=${item.artifacts.playwrightTrace}`);
    if (item.artifacts.video) parts.push(`video=${item.artifacts.video}`);
    if (item.artifacts.mockRequests?.length) parts.push(`mockRequests=${item.artifacts.mockRequests.length}`);
    if (item.artifacts.process) parts.push(`processExit=${String(item.artifacts.process.exitCode ?? '-')}`);
    return `- ${item.caseId}: ${parts.join('; ') || 'no artifact'}`;
  }).join('\n');
}
