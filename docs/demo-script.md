# 现场演示脚本

## 1. 说明痛点

传统测试需要人工看 diff、判断影响范围、补用例、跑回归、读日志。DiffGuard 做的是稳定闭环：理解变更、规划策略、执行验证、输出可决策报告。

## 2. 输入

```bash
npm run demo
```

## 3. 展示运行前

- 已读取需求：会员优惠券叠加
- 已读取 PR diff：coupon.ts、app.ts、Checkout.tsx
- 风险等级：高
- 影响范围：订单预览接口、结算页、支付 mock、观测日志

## 4. 展示测试矩阵

- M-001 API：VIP 满减后叠加 95 折
- M-002 Browser：结算页金额和 API 一致
- M-003 API：金额不能小于 0
- M-004 Regression：不使用优惠券下单正常
- M-005 Mock：支付服务收到正确金额
- M-006 Observability：testRunId / trace 可关联

## 5. 展示报告

报告结论：不建议合并。

失败原因：示例后端当前计算顺序为先会员折扣再满减，导致 100 元 VIP 订单返回 75.00；需求期望为 76.00。

## 6. 展示扩展

同一 workflow 可接入 GitHub / TGit、TAPD、Playwright MCP、Kubernetes、OpenTelemetry、bot 和定时任务。
