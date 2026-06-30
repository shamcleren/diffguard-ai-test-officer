# DiffGuard 开发计划

## 目标

在黑客松周期内交付一个可现场演示的 AI 测试官：

```text
输入 PR diff / 需求文档
  ↓
自动识别项目结构
  ↓
解析部署契约
  ↓
分析影响范围和风险
  ↓
生成测试矩阵
  ↓
执行 API / Browser / Mock / Observability 验证
  ↓
收集证据包
  ↓
输出是否建议合并的测试报告
```

## 产品定位

DiffGuard 是一个 Agent，不是一个测试脚本生成器。

它的核心产物不是某一段 Playwright 脚本，而是：

1. 测试矩阵。
2. 可运行验证。
3. Evidence Bundle。
4. 可决策报告。
5. 异常归因和改造建议。

## 总体交付范围

### P0：黑客松必须交付

| 模块 | 交付物 | 验收标准 |
|---|---|---|
| Agent workflow | 固定状态机 | `npm run demo` 可生成完整报告 |
| Project detection | 自动识别组件 / runtime | 生成 `reports/project-detection.json` |
| Context collector | 读取 diff / requirement | 可从 examples 读取输入 |
| Deploy contract | 解析 `ai-test.yaml` | 无需声明 language，自动识别项目 |
| Change analyzer | 输出影响范围和风险 | 能识别优惠券 / 订单金额为高风险 |
| Test matrix planner | 生成矩阵 | 覆盖 API、Browser、Mock、Observability |
| Matrix executor | dry-run + 真实执行接口 | dry-run 中能模拟失败；真实执行逐步补齐 |
| Evidence bundle | 结构化证据包 | 输出 `evidence-bundle.json` |
| Report generator | Markdown 报告 | 输出“不建议合并”和失败归因 |
| Demo app | 前后端示例系统 | 包含一个可被发现的金额计算 bug |

### P1：加分项

| 模块 | 交付物 | 验收标准 |
|---|---|---|
| API executor | 真实调用后端接口 | M-001 能真实失败 |
| Playwright executor | 真实浏览器操作 | M-002 能产出 screenshot / trace |
| WireMock verification | 校验支付 mock request | M-005 能检查支付金额 |
| OTel correlation | testRunId / traceparent 注入 | 报告中展示 traceId / span |
| GitHub PR comment | 报告回写 PR | PR 页面出现摘要评论 |
| UI timeline | 简单 Web UI | 可视化展示状态推进 |

### P2：愿景项

| 模块 | 交付物 | 验收标准 |
|---|---|---|
| 定时巡检 | schedule runner | 定时跑核心链路并推送报告 |
| TAPD / TGit connector | 需求和 bug 关联 | 自动读取需求 / 历史缺陷 |
| Test self-healing | selector 修复建议 | selector 失败时给出替换建议 |
| eBPF / Cilium / Hubble | 透明观测 | 可不改业务代码采集网络路径 |
| 多服务拓扑分析 | 依赖图 | 识别被 PR 影响的下游服务 |

## 里程碑计划

## Milestone 0：文档和边界确认

目标：把设计讲清楚，让评审理解为什么是 Agent。

### 任务

| ID | 任务 | 输出 | 优先级 |
|---|---|---|---|
| M0-1 | 完善 README | 快速开始、演示主线、自动识别策略 | P0 |
| M0-2 | 编写 Agent vs Skill 文档 | `docs/agent-vs-skill.md` | P0 |
| M0-3 | 编写架构文档 | `docs/architecture.md` | P0 |
| M0-4 | 编写开发计划 | `docs/development-plan.md` | P0 |
| M0-5 | 编写 demo script | `docs/demo-script.md` | P0 |

### 验收标准

- 文档能解释：为什么 Skill 不够。
- 文档能解释：Agent / Workflow / Skill / MCP Tool 的边界。
- 文档能支持 5 分钟答辩叙事。

## Milestone 1：确定性 Agent Workflow

目标：先完成稳定状态机，不依赖 LLM 也能跑通 dry-run。

### 目标状态机

```text
InputReceived
  ↓
ContextCollected
  ↓
ProjectDetected
  ↓
DeployContractResolved
  ↓
ImpactAnalyzed
  ↓
MockPlanned
  ↓
TestMatrixGenerated
  ↓
EnvironmentReady
  ↓
ExecutionCompleted
  ↓
EvidenceBundled
  ↓
ReportGenerated
```

### 任务

| ID | 任务 | 文件 | 验收标准 | 优先级 |
|---|---|---|---|---|
| M1-1 | 定义 domain types | `agent/src/types.ts` | 类型覆盖 matrix、evidence、contract、decision | P0 |
| M1-2 | 实现 orchestrator | `agent/src/orchestrator/workflow.ts` | 节点串联，输出 4 个报告文件 | P0 |
| M1-3 | 实现 CLI | `agent/src/index.ts` | 支持 `run --diff --requirement --contract --mode` | P0 |
| M1-4 | 统一 run id | workflow | 每次 run 有 `testRunId` | P0 |
| M1-5 | 失败分支建模 | workflow | 高风险失败 → 不建议合并 | P0 |

### 验收命令

```bash
npm run demo
ls reports/
cat reports/report.md
```

### 验收输出

```text
reports/project-detection.json
reports/test-matrix.json
reports/evidence-bundle.json
reports/report.md
```

## Milestone 2：项目自动识别

目标：取消 `language` 必填，按组件自动识别 runtime / framework / role。

### 自动识别信号

| 信号 | 示例 | 推断结果 |
|---|---|---|
| manifest | package.json, pyproject.toml, go.mod, pom.xml | runtime / package manager |
| source extension | .ts, .tsx, .py, .go, .java | language hint |
| framework dependency | express, vite, fastapi, spring | executor strategy |
| deploy file | Dockerfile, docker-compose.yml, Chart.yaml | deploy mode |
| test config | playwright.config.ts, pytest.ini, vitest.config | test runner |
| diff path | apps/demo-shop-backend/src/coupon.ts | impacted component |

### 任务

| ID | 任务 | 文件 | 验收标准 | 优先级 |
|---|---|---|---|---|
| M2-1 | 实现 detector | `agent/src/detectors/projectDetector.ts` | 输出 components / runtime / confidence | P0 |
| M2-2 | 接入 workflow | `workflow.ts` | 生成 `project-detection.json` | P0 |
| M2-3 | 支持 overrides | `ai-test.yaml` | `project.detection.overrides` 可覆盖 | P1 |
| M2-4 | 扩展多语言识别 | detector | 支持 Node / Python / Go / Java / Rust | P1 |
| M2-5 | 低置信度策略 | detector | confidence < 阈值时报告需要人工确认 | P1 |

### 输出示例

```json
{
  "primaryRuntime": "node",
  "confidence": 0.9,
  "components": [
    {
      "id": "demo-shop-backend",
      "root": "apps/demo-shop-backend",
      "role": "api",
      "runtime": "node",
      "confidence": 0.9,
      "evidence": ["package.json", "Express routes", "TypeScript source"]
    }
  ]
}
```

## Milestone 3：上下文采集

目标：把 PR / 需求 / 代码结构转成 Agent 可推理的上下文。

### 输入类型

| 类型 | 输入 | 用途 |
|---|---|---|
| PR mode | diff / commit range / PR URL | 合并前验证 |
| Requirement mode | Markdown / TAPD / issue | 需求验收 |
| Patrol mode | schedule config | 定时巡检 |
| Replay mode | previous testRunId | 失败复现 |

### 任务

| ID | 任务 | 文件 | 验收标准 | 优先级 |
|---|---|---|---|---|
| M3-1 | diff 解析 | `contextCollector.ts` | 提取 changedPaths | P0 |
| M3-2 | requirement 读取 | `contextCollector.ts` | 提取验收标准 | P0 |
| M3-3 | repo tree 采集 | 新增 `repoScanner.ts` | 读取 manifest / configs | P1 |
| M3-4 | API 路由发现 | 新增 `apiRouteScanner.ts` | 识别 Express / FastAPI / Spring routes | P1 |
| M3-5 | 前端路由发现 | 新增 `frontendRouteScanner.ts` | 识别 pages / routes | P1 |

### 结构化输出

```ts
interface CollectedContext {
  diffText: string;
  requirementText?: string;
  changedPaths: string[];
  manifests: ManifestSummary[];
  apiRoutes: ApiRouteSummary[];
  frontendRoutes: FrontendRouteSummary[];
}
```

## Milestone 4：部署契约和环境准备

目标：让 Agent 不“凭空部署”，而是读取标准接入契约。

### 原则

```text
Agent 不负责猜测任意项目如何部署；
Agent 负责读取、校验、补全和执行部署契约。
```

### ai-test.yaml 最小契约

```yaml
app:
  name: demo-shop
  repoRoot: .

deploy:
  type: helm
  chartPath: ./deploy/chart
  localFallback: docker-compose

healthCheck:
  url: http://localhost:3001/health

entrypoints:
  web:
    baseUrl: http://localhost:5173
  api:
    baseUrl: http://localhost:3001/api
```

### 任务

| ID | 任务 | 文件 | 验收标准 | 优先级 |
|---|---|---|---|---|
| M4-1 | 契约解析 | `deployContractResolver.ts` | 校验必填字段 | P0 |
| M4-2 | dry-run 部署计划 | `environmentProvisioner.ts` | 输出计划，不真实执行 | P0 |
| M4-3 | docker-compose 执行 | executor | 可启动 demo app 和 WireMock | P1 |
| M4-4 | Helm 执行 | executor | 可 `helm upgrade --install` | P1 |
| M4-5 | health check | executor | 等待服务 ready | P1 |
| M4-6 | teardown | executor | 清理 namespace / compose | P1 |

### 失败策略

| 失败 | Agent 决策 |
|---|---|
| Helm chart 缺失 | 尝试 localFallback |
| health check 超时 | 标记环境失败，不归因业务代码 |
| mock 未启动 | 阻断依赖相关矩阵项 |
| seed 失败 | 标记测试数据不可用 |

## Milestone 5：Mock 依赖规划

目标：隔离外部依赖，保证 demo 稳定。

### Mock 优先级

```text
1. 项目已有 mock 配置
2. OpenAPI / Swagger 生成 mock
3. 历史调用日志回放
4. 需求文档生成最小 mock
5. 无法判断则标记不可验证风险
```

### 任务

| ID | 任务 | 文件 | 验收标准 | 优先级 |
|---|---|---|---|---|
| M5-1 | 读取 dependencies | `mockDependencyPlanner.ts` | 识别 payment-service mock | P0 |
| M5-2 | WireMock mapping | `mocks/payment/mappings` | 支付授权返回成功 | P0 |
| M5-3 | mock request 校验 | 新增 `mockVerifier.ts` | 验证 `/payments/authorize` 被调用 | P1 |
| M5-4 | 金额一致性校验 | `mockVerifier.ts` | mock request amount = finalPrice | P1 |
| M5-5 | request journal 导出 | evidence | 写入 evidence bundle | P1 |

## Milestone 6：影响范围和风险分析

目标：让 Agent 能解释“为什么要测这些”。

### 风险规则

| 命中项 | 风险 |
|---|---|
| 金额 / 支付 / 优惠 / 订单 | high |
| 登录 / 权限 / 鉴权 | high |
| 删除 / 数据迁移 | high |
| 前后端同时改动 | high |
| 接口参数变化 | medium / high |
| UI 文案 / 样式 | low |

### 任务

| ID | 任务 | 文件 | 验收标准 | 优先级 |
|---|---|---|---|---|
| M6-1 | 规则风险分析 | `changeAnalyzer.ts` | coupon / order 识别 high | P0 |
| M6-2 | 影响 API 识别 | analyzer | 输出 `/api/orders/preview` | P0 |
| M6-3 | 影响页面识别 | analyzer | 输出 `/checkout` | P0 |
| M6-4 | LLM 结构化增强 | prompts + schema | 生成 JSON，不自由文本 | P1 |
| M6-5 | 历史 bug 加权 | analyzer | 同模块历史 bug 提高风险 | P2 |

### 输出结构

```ts
interface ChangeAnalysis {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  changedFiles: ChangeFile[];
  impactedApis: string[];
  impactedPages: string[];
  impactedJourneys: string[];
  riskReasons: string[];
}
```

## Milestone 7：测试矩阵生成

目标：把“影响范围”转成“可执行验证计划”。

### 矩阵项字段

```ts
interface TestMatrixItem {
  id: string;
  source: 'diff' | 'requirement' | 'regression' | 'observability';
  claim: string;
  risk: 'low' | 'medium' | 'high';
  layers: Array<'api' | 'browser' | 'database' | 'mock' | 'observability'>;
  method: string;
  oracle: string;
  evidenceRequired: string[];
  status: 'not_run' | 'passed' | 'failed' | 'skipped';
}
```

### 当前 demo 矩阵

| ID | 层级 | 目标 | Oracle |
|---|---|---|---|
| M-001 | API + Observability | VIP 满减后叠加 95 折 | finalPrice = 76.00 |
| M-002 | Browser + API | 结算页金额与 API 一致 | 页面金额 = API 金额 |
| M-003 | API | 优惠后金额不能小于 0 | finalPrice >= 0 |
| M-004 | API + Browser | 无优惠券下单回归 | 订单创建成功 |
| M-005 | Mock + API | 支付 mock 收到正确金额 | amount = finalPrice |
| M-006 | Observability | testRunId 可关联日志 / trace | 可查到关联记录 |

### 任务

| ID | 任务 | 文件 | 验收标准 | 优先级 |
|---|---|---|---|---|
| M7-1 | 规则生成矩阵 | `testMatrixPlanner.ts` | 生成 M-001 到 M-006 | P0 |
| M7-2 | 需求-实现-测试矩阵 | report | 每条需求关联测试项 | P1 |
| M7-3 | 优先级排序 | planner | P0 / P1 / P2 | P1 |
| M7-4 | 未验证风险输出 | planner | 无执行能力时标记风险 | P1 |
| M7-5 | LLM 生成补充场景 | planner | 边界条件补齐 | P2 |

## Milestone 8：执行器

目标：从 dry-run 过渡到真实执行。

### 执行器分层

| Executor | 作用 | 当前状态 | 目标 |
|---|---|---|---|
| API Executor | 调用后端接口，验证 response | 待实现 | P1 |
| Browser Executor | Playwright 操作浏览器 | 已有 E2E 脚本 | P1 |
| Mock Executor | 验证 WireMock request | 待实现 | P1 |
| Observability Executor | 查询 logs / trace | 预留 | P1 / P2 |
| DB / State Executor | 验证落库和状态流转 | 未实现 | P2 |

### API Executor 任务

| ID | 任务 | 验收标准 | 优先级 |
|---|---|---|---|
| M8-1 | 实现通用 HTTP client | 支持 method、url、headers、body | P1 |
| M8-2 | 注入 testRunId | 所有请求带 `x-ai-test-run-id` | P1 |
| M8-3 | 执行 M-001 | 实际调用 preview API 并失败 | P1 |
| M8-4 | response 归档 | 写入 evidence bundle | P1 |

### Browser Executor 任务

| ID | 任务 | 验收标准 | 优先级 |
|---|---|---|---|
| M8-5 | Playwright CLI 调度 | Agent 可触发 `playwright test` | P1 |
| M8-6 | trace / screenshot 收集 | 失败时有 trace.zip 和 screenshot | P1 |
| M8-7 | 页面和 API 一致性校验 | M-002 真实失败 | P1 |
| M8-8 | HTML report 链接 | 报告里能打开 Playwright report | P2 |

### Mock Executor 任务

| ID | 任务 | 验收标准 | 优先级 |
|---|---|---|---|
| M8-9 | WireMock journal 查询 | 查询 `/__admin/requests` | P1 |
| M8-10 | request body 断言 | amount 与 finalPrice 一致 | P1 |
| M8-11 | mock 证据归档 | 写入 evidence bundle | P1 |

### Observability Executor 任务

| ID | 任务 | 验收标准 | 优先级 |
|---|---|---|---|
| M8-12 | 本地日志采集 | 过滤 testRunId | P1 |
| M8-13 | traceparent 注入 | API / browser 请求带 traceparent | P1 |
| M8-14 | OTel collector 查询接口 | 可配置 endpoint | P2 |
| M8-15 | span 字段建议 | 报告输出改造建议 | P1 |

## Milestone 9：证据包和报告

目标：让输出能支撑人直接决策。

### Evidence Bundle schema

```ts
interface EvidenceBundle {
  testRunId: string;
  createdAt: string;
  changeSummary: string;
  matrix: TestMatrixItem[];
  evidence: EvidenceItem[];
}
```

### 报告结构

```text
1. 决策结论
2. 变更摘要
3. 影响范围
4. 测试矩阵结果
5. 失败项卡片
6. 证据包
7. 部署契约摘要
8. 业务修复建议
9. 可观测性改造建议
10. 可复现命令
```

### 任务

| ID | 任务 | 文件 | 验收标准 | 优先级 |
|---|---|---|---|---|
| M9-1 | evidence bundler | `evidenceBundler.ts` | 输出结构化 JSON | P0 |
| M9-2 | report generator | `reportGenerator.ts` | 输出 Markdown | P0 |
| M9-3 | 失败归因 | `failureAnalyzer.ts` | 关联代码、需求和证据 | P1 |
| M9-4 | HTML report | 新增 renderer | 可视化矩阵和证据 | P2 |
| M9-5 | PR comment | GitHub integration | 摘要回写 PR | P1 |

## Milestone 10：UI 和演示体验

目标：现场演示清楚、稳定、有视觉冲击。

### 最小 UI

三栏：

```text
左侧：输入 PR / 需求
中间：Agent workflow timeline
右侧：测试矩阵、失败证据、报告结论
```

### Timeline 节点

```text
读取 PR diff
自动识别项目
解析部署契约
规划 mock
生成测试矩阵
启动验证
收集证据
生成报告
```

### 任务

| ID | 任务 | 验收标准 | 优先级 |
|---|---|---|---|
| M10-1 | 简单 Web UI | 能展示 demo run 的状态 | P1 |
| M10-2 | 报告预览 | 右侧渲染 Markdown | P1 |
| M10-3 | 证据链接 | 可打开 screenshot / trace | P1 |
| M10-4 | 实时流式日志 | timeline 状态逐步变化 | P2 |
| M10-5 | Bot 推送模拟 | 输出一条可复制的 bot 消息 | P2 |

## 两天黑客松排期

### Day 0：准备

| 时间 | 任务 | 产物 |
|---|---|---|
| 0.5h | 确认 Demo 业务场景 | 会员优惠券叠加 |
| 0.5h | 确认仓库和脚手架 | GitHub repo |
| 1h | 准备需求文档和 diff | `examples/` |
| 1h | 准备 demo bug | coupon 计算顺序错误 |

### Day 1 上午：Agent 主链路

| 时间 | 任务 | 产物 |
|---|---|---|
| 1h | 固化 types 和 workflow | `types.ts`, `workflow.ts` |
| 1h | context collector | 读取 diff / requirement |
| 1h | project detector | `project-detection.json` |
| 1h | deploy contract resolver | 解析 `ai-test.yaml` |

### Day 1 下午：测试矩阵和报告

| 时间 | 任务 | 产物 |
|---|---|---|
| 1h | change analyzer | risk / impacted APIs |
| 1h | test matrix planner | M-001 到 M-006 |
| 1h | evidence bundler | `evidence-bundle.json` |
| 1h | report generator | `report.md` |

### Day 2 上午：真实执行

| 时间 | 任务 | 产物 |
|---|---|---|
| 1h | API executor | M-001 真实失败 |
| 1h | Playwright executor | M-002 真实失败 |
| 1h | WireMock verification | M-005 证据 |
| 1h | 日志 / testRunId 采集 | observability evidence |

### Day 2 下午：演示强化

| 时间 | 任务 | 产物 |
|---|---|---|
| 1h | UI timeline 或 CLI 演示 | 可视化流程 |
| 1h | PR comment / bot summary | 推送摘要 |
| 1h | 修复报告和答辩文档 | demo script |
| 1h | 彩排和兜底脚本 | 稳定演示 |

## 代码实施顺序

推荐按以下 PR 顺序推进：

| PR | 内容 | 目标 |
|---|---|---|
| PR-001 | 文档：Agent vs Skill + 开发计划 | 统一设计叙事 |
| PR-002 | Project detection 完善 | 自动识别项目 |
| PR-003 | API executor | M-001 真实执行 |
| PR-004 | Browser executor | M-002 真实执行 |
| PR-005 | Evidence bundle 强化 | 收集真实 artifact |
| PR-006 | Failure analyzer | 根因归因 |
| PR-007 | PR comment / bot | 报告推送 |
| PR-008 | Demo UI | 现场可视化 |

## 关键技术决策

### 1. 状态机优先于自由 Agent

原因：黑客松现场需要稳定，所有阶段必须可复现。

### 2. 自动识别优先于用户配置

原因：用户不应该写 `language`；Agent 应根据 manifest、源码、框架、部署文件和 diff 自动识别。

### 3. Evidence Bundle 是一等产物

原因：评审要看到真实证据，不是只看模型总结。

### 4. OTel 优先于 eBPF

原因：OTel 更易集成、更适合 MVP；eBPF 放 P2 作为愿景项。

### 5. demo bug 必须稳定复现

原因：现场演示必须有明确失败和明确归因。

## 风险和兜底

| 风险 | 影响 | 兜底 |
|---|---|---|
| npm install 慢 | 现场等待 | 预装依赖 / 录屏 / dry-run |
| docker 无法启动 | 无法运行完整 app | 只跑 dry-run + 单测 |
| Playwright 浏览器缺失 | E2E 失败 | 预先 `npx playwright install chromium` |
| WireMock 镜像拉取失败 | mock 不可用 | 使用本地 fake payment server |
| LLM 输出不稳定 | 矩阵不稳定 | P0 使用规则 + schema，LLM 放 P1 |
| K8s 环境不可用 | 无法 Helm demo | docker-compose fallback |
| 观测数据缺失 | trace 为空 | 使用 service log + testRunId 兜底 |

## Demo 验收清单

运行前检查：

```bash
node -v
npm -v
docker version
npx playwright --version
```

核心命令：

```bash
npm install
npm run demo
cat reports/report.md
```

完整执行：

```bash
npm run dev
npm run test
npx playwright install chromium
npm run test:e2e
```

演示必须展示：

- `examples/requirements/coupon-stack.md`
- `examples/pr-diff/coupon-stack.diff`
- `reports/project-detection.json`
- `reports/test-matrix.json`
- `reports/evidence-bundle.json`
- `reports/report.md`
- `apps/demo-shop-backend/src/coupon.ts` 中的 DEMO_BUG

## 最终答辩结构

1. 传统测试痛点：人工看 diff、人工选用例、人工读日志。
2. DiffGuard 定位：Agent 驱动的全链路测试官。
3. 为什么不是 Skill：Skill 是能力，Agent 承担责任。
4. 展示输入：PR diff + 需求文档。
5. 展示 Agent workflow：自动识别、风险分析、测试矩阵。
6. 展示真实验证：API / Browser / Mock / Observability。
7. 展示证据包：截图、trace、API response、日志。
8. 展示报告：不建议合并 + 根因 + 修复建议。
9. 展示扩展：TGit、TAPD、定时巡检、bot、OTel、eBPF。

## Definition of Done

P0 完成标准：

```text
npm run demo 成功
报告给出“不建议合并”
矩阵覆盖 API / Browser / Mock / Observability
证据包结构完整
README 和 docs 能支撑答辩
```

P1 完成标准：

```text
API 和 Playwright 至少一个真实失败
失败证据写入 evidence bundle
报告能定位到 coupon.ts 的计算顺序问题
```

P2 完成标准：

```text
有 UI / bot / OTel / 定时巡检任一加分项
```

## 参考

- OpenAI Agents SDK: https://developers.openai.com/api/docs/guides/agents
- OpenAI Skills: https://developers.openai.com/api/docs/guides/tools-skills
- Anthropic: Building Effective Agents: https://www.anthropic.com/engineering/building-effective-agents
- MCP Tools specification: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- Playwright Trace Viewer: https://playwright.dev/docs/trace-viewer
- OpenTelemetry Concepts: https://opentelemetry.io/docs/concepts/
