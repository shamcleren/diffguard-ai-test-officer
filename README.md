# DiffGuard AI Test Officer

**提交标题建议：方向二【AI测试官】DiffGuard：理解 PR 意图的全链路测试 Agent**

DiffGuard 是一个面向 PR / 需求变更的全链路测试 Agent 原型。它把“理解变更 → 构建测试环境 → 生成测试矩阵 → 执行验证 → 证据采集 → 报告决策”固化成稳定 workflow，而不是一次性 prompt 或脚本集合。

## 核心闭环

```text
InputReceived
  ↓
ContextCollected
  ↓
DeployContractResolved
  ↓
EnvironmentReady
  ↓
TestMatrixGenerated
  ↓
TestCasesGenerated
  ↓
ExecutionCompleted
  ↓
EvidenceBundled
  ↓
ReportGenerated
```

## 仓库内容

```text
agent/                     AI 测试官 workflow 与执行器骨架
apps/demo-shop-backend/    示例后端：订单预览、优惠券、支付 mock 调用
apps/demo-shop-frontend/   示例前端：结算页优惠券体验
examples/                  示例需求文档与 PR diff
mocks/payment/             WireMock 支付服务 mock
reports/                   运行后生成的报告与证据包
playwright.config.ts       浏览器 E2E 证据采集配置
deploy/chart/              Kubernetes / Helm 部署骨架
ai-test.yaml               DiffGuard 标准接入契约
```

## 快速开始

```bash
npm install
npm run demo
```

`npm run demo` 会执行 Agent dry-run，并生成：

```text
reports/test-matrix.json
reports/evidence-bundle.json
reports/report.md
```

启动示例业务系统：

```bash
npm run dev
```

执行浏览器 E2E：

```bash
npx playwright install chromium
npm run test:e2e
```

## 黑客松演示主线

1. 输入 PR diff 或需求文档。
2. Agent 读取 `ai-test.yaml`，解析部署契约。
3. Agent 识别变更风险，生成测试矩阵。
4. 使用 API、浏览器、Mock、日志和可观测数据完成验证。
5. 输出可决策报告：建议合并 / 不建议合并，以及失败证据和改造建议。

## 标准接入契约

仓库根目录的 `ai-test.yaml` 描述了 Agent 如何部署、探活、mock 外部依赖、执行种子数据和定位入口：

```yaml
app:
  name: demo-shop
  language: typescript

deploy:
  type: helm
  localFallback: docker-compose

entrypoints:
  web:
    baseUrl: http://localhost:5173
  api:
    baseUrl: http://localhost:3001/api

dependencies:
  payment-service:
    mode: mock
    provider: wiremock
```

## 运行前

运行前阶段负责把不稳定的人为判断固化为 workflow：

- 读取 PR diff / 需求文档。
- 解析部署契约。
- 规划外部依赖 mock。
- 分析代码影响范围。
- 生成测试矩阵。

## 运行时

运行时阶段按测试矩阵调度执行器：

- API Executor：验证接口和业务规则。
- Browser Executor：用 Playwright 驱动真实浏览器。
- Mock Verification Executor：验证外部依赖调用。
- Observability Collector：预留 OpenTelemetry trace / log 采集接口。
- Evidence Bundler：收集截图、trace、日志、接口响应和测试脚本。

## 运行后

运行后阶段产出人能直接决策的报告：

- 测试结论。
- 测试矩阵结果。
- 失败证据。
- 失败归因。
- 业务修复建议。
- 可观测性改造建议。
- 可复现命令。

## Demo 中故意埋的缺陷

示例后端的优惠券计算逻辑默认包含一个可演示缺陷：VIP 用户的优惠券和会员折扣叠加顺序实现错误。

需求期望：

```ts
finalPrice = (price - 20) * 0.95
```

错误实现：

```ts
finalPrice = price * 0.95 - 20
```

Agent 会在报告中给出“不建议合并”的结论，并把失败归因到优惠计算逻辑。

## 推荐作品标题

```text
方向二【AI测试官】DiffGuard：理解 PR 意图的全链路测试 Agent
```
