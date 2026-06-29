# DiffGuard 测试报告（Sample）

## 决策结论

**不建议合并**

本次运行共生成 6 个测试矩阵项：通过 4，失败 2，未运行 0。

## 变更摘要

本次变更涉及优惠券、订单金额计算与结算页展示，需要覆盖 API、浏览器、Mock 和观测证据。

风险等级：**high**

## 失败项

### M-001: VIP 用户可在满 100 减 20 后叠加 95 折

- 预期：`finalPrice = (100 - 20) * 0.95 = 76.00`
- 实际：`finalPrice = 75.00`
- 初步归因：`apps/demo-shop-backend/src/coupon.ts` 当前实现先会员折扣再满减。
- 证据：API response、service log、traceId。

### M-002: 结算页展示金额应与订单预览 API 返回金额一致

- 预期：页面最终金额与 `/api/orders/preview` 一致且符合需求 Oracle。
- 实际：页面展示继承后端错误金额。
- 证据：Playwright screenshot、trace.zip、API response。

## 改造建议

1. 修复 `calculateFinalPrice` 的计算顺序。
2. 前端结算页只展示 `/api/orders/preview` 返回的最终金额，不重复实现价格公式。
3. 增加金额计算单测与 E2E 证据采集。
4. 在订单预览链路中记录 `x-ai-test-run-id`、`traceparent`、`originalPrice`、`finalPrice`。
