# Runtime Execution v0.2

## 新增能力

v0.2 将 DiffGuard 从 dry-run 闭环推进到真实执行闭环。

```text
API Executor
Browser Executor
WireMock Verifier
Failure Analyzer
Runtime Evidence Bundle
```

## 运行命令

### 兜底 dry-run

```bash
npm run demo
```

### 真实执行

```bash
npm run dev
# 新开终端
npx playwright install chromium
npm run demo:execute
```

## 执行矩阵

| ID | Executor | 行为 | 预期 |
|---|---|---|---|
| M-001 | API Executor | 调用 `POST /api/orders/preview` | 预期 76，当前真实返回 75，失败 |
| M-002 | Browser Executor | 调度 Playwright 打开结算页 | 页面最终金额不满足 Oracle，失败 |
| M-003 | API Executor | 构造低金额订单 | `finalPrice >= 0` |
| M-004 | API Executor | 构造无优惠普通订单 | `finalPrice = 100` |
| M-005 | WireMock Verifier | 创建订单并查 request journal | 支付 mock 收到 amount |
| M-006 | Observability Probe | 注入 testRunId / traceparent | 可用于日志和 trace 关联 |

## 输出物

```text
reports/project-detection.json
reports/test-matrix.json
reports/evidence-bundle.json
reports/failure-analysis.json
reports/report.md
playwright-report/index.html
test-results/**/trace.zip
```

## 失败归因规则

| 失败类型 | 分类 | 处理 |
|---|---|---|
| API 连接失败 | environment | 提示启动 `npm run dev` |
| API 200 但业务值不符合 Oracle | business | 归因到业务代码 |
| Playwright 无法连接页面 | environment | 提示检查 web / api 服务 |
| Playwright 断言失败 | business | 归因到前后端一致性或业务规则 |
| WireMock journal 读取失败 | mock | 提示检查 mock 服务 |
| 支付 amount 不一致 | business | 归因到订单金额透传 |

## 当前已知限制

1. 浏览器 trace 路径目前以 glob 形式记录：`test-results/**/trace.zip`。
2. OTel collector 查询仍是预留接口，当前只注入 `x-ai-test-run-id` 和 `traceparent`。
3. PR URL / commit range 输入仍待接入。
4. UI timeline 仍待实现。
