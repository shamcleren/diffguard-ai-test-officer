# 现场演示脚本

## 1. 说明痛点

传统测试需要人工看 diff、判断影响范围、补用例、跑回归、读日志。DiffGuard 做的是稳定闭环：理解变更、规划策略、执行验证、输出可决策报告。

关键表达：

```text
Skill 提供能力，Agent 承担责任。
```

## 2. 输入

先展示 dry-run 兜底：

```bash
npm run demo
```

再展示真实执行：

```bash
npm run dev
# 新开终端
npx playwright install chromium
npm run demo:execute
```

## 3. 展示运行前

- 已读取需求：会员优惠券叠加。
- 已读取 PR diff：coupon.ts、app.ts、Checkout.tsx。
- 已自动识别项目：backend / frontend / agent。
- 已解析部署契约：apiBaseUrl、webBaseUrl、payment-service mock。
- 风险等级：高。
- 影响范围：订单预览接口、结算页、支付 mock、观测日志。

重点展示：

```text
reports/project-detection.json
reports/test-matrix.json
```

## 4. 展示测试矩阵

- M-001 API：VIP 满减后叠加 95 折。
- M-002 Browser：结算页金额和需求 Oracle 一致。
- M-003 API：金额不能小于 0。
- M-004 Regression：不使用优惠券下单正常。
- M-005 Mock：支付服务收到正确金额。
- M-006 Observability：testRunId / trace 可关联。

## 5. 展示运行时证据

重点展示：

```text
reports/evidence-bundle.json
reports/failure-analysis.json
test-results/**/trace.zip
playwright-report/index.html
```

真实执行中：

- M-001 会真实调用 `/api/orders/preview`。
- M-002 会真实运行 Playwright。
- M-005 会查询 WireMock request journal。
- 所有 API 请求会注入 `x-ai-test-run-id`。

## 6. 展示报告

```bash
cat reports/report.md
```

报告结论：不建议合并。

失败原因：示例后端当前计算顺序为先会员折扣再满减，导致 100 元 VIP 订单返回 75.00；需求期望为 76.00。

失败归因：

```text
apps/demo-shop-backend/src/coupon.ts
calculateFinalPrice
```

修复建议：

```text
先满减，再会员折扣。
前端结算页统一使用 /api/orders/preview 返回结果。
```

## 7. 展示扩展

同一 workflow 可接入 GitHub / TGit、TAPD、Playwright MCP、Kubernetes、OpenTelemetry、bot 和定时任务。
