# 为什么 DiffGuard 必须做成 Agent，而不是一个 Skill

## 结论

DiffGuard 的产品形态应是：

```text
Agent 驱动的稳定 workflow + Skill / MCP 工具节点
```

不是：

```text
一个巨型 Skill 跑完整测试流程
```

核心原因：AI 测试官的价值不是“会执行某个测试动作”，而是“对一次测试任务负责”。它要理解输入、判断风险、选择验证路径、调度工具、处理异常、沉淀证据，并输出是否建议合并的决策。

## 外部定义对齐

### Agentic workflow 与 Agent 的区别

Anthropic 对 agentic system 做了一个有用区分：

- Workflow：LLM 和工具沿预定义代码路径被编排。
- Agent：LLM 动态决定流程和工具使用方式，并控制如何完成任务。

DiffGuard 不应该做成完全自由的 autonomous agent，而应该采用：

```text
确定性状态机 + Agent 决策点 + 工具 / Skill 执行节点
```

这样既有工程稳定性，又能覆盖测试任务中不可提前写死的判断。

### Skill 的边界

OpenAI Skills 是带 `SKILL.md` manifest 的版本化文件包，用于复用指令、脚本和流程约定。Skill 很适合沉淀局部能力，例如：

- 读取 Git diff。
- 分析 OpenAPI。
- 执行 Playwright。
- 采集 OTel trace。
- 渲染 Markdown 报告。

但 Skill 不应该承担完整测试任务的 owner 职责。

### MCP Tool 的边界

MCP Tool 负责把外部系统能力暴露给模型，例如查询数据库、调用 API 或执行计算。Tool 是动作接口，不是业务流程负责人。

## 职责边界

| 层级 | 职责 | DiffGuard 示例 |
|---|---|---|
| Agent | 任务理解、策略规划、状态推进、异常分流、最终决策 | 判断是否建议合并 |
| Workflow | 固定阶段、状态机、输入输出契约 | 运行前 → 运行时 → 运行后 |
| Skill | 可复用局部 SOP | diff 分析、Playwright 执行、报告渲染 |
| MCP Tool | 外部系统动作接口 | GitHub、TGit、TAPD、K8s、浏览器、日志平台 |

一句话：

```text
Skill 提供能力，Agent 承担责任。
```

## 为什么一个 Skill 不够

### 1. 输入是不完整且多形态的

用户输入可能是：

```text
测试这个 PR
验证这个需求
今天巡检核心链路
```

Skill 通常假设用户已经知道要调用哪个能力；DiffGuard 必须先判断任务类型：

- PR 验证。
- 需求验收。
- 定时巡检。
- 回归验证。
- 失败复测。

这属于 Agent 的任务路由职责。

### 2. 测试矩阵必须动态生成

测试矩阵依赖：

- PR diff。
- 需求文档。
- 代码影响范围。
- 接口定义。
- 前端页面路径。
- 部署契约。
- 外部依赖可用性。
- 历史 bug。
- 风险等级。

同样是一个 PR：

| 改动类型 | 主要测试策略 |
|---|---|
| CSS / 文案 | E2E smoke、视觉检查 |
| 金额计算 | API、边界值、DB 状态、前后端一致性 |
| 权限中间件 | 权限矩阵、安全回归 |
| 支付 client | Mock verification、幂等、失败重试 |
| 数据删除 | 数据保护、审计日志、恢复路径 |

这不是一个固定 Skill 能稳定覆盖的。

### 3. 运行时需要分支和兜底

运行中可能出现：

- K8s 部署失败。
- health check 超时。
- 外部依赖不可用。
- mock 规则缺失。
- 浏览器 selector 失效。
- API 返回 500。
- OTel 没有 trace。
- 日志里没有 testRunId。

Agent 必须判断：

- 是否降级到 docker-compose。
- 是否生成最小 mock。
- 是否只跑 API 层。
- 是否标记为“环境不可验证”。
- 是否将失败归因给业务代码、测试脚本、环境或 mock。

这类分支决策不应藏在 Skill 中。

### 4. 输出不是日志，而是决策

Skill 很容易输出：

- 日志。
- 截图。
- trace.zip。
- JSON。
- Markdown。

但 AI 测试官必须输出：

- 是否建议合并。
- 哪些失败阻断合并。
- 哪些风险未验证。
- 哪些证据支撑结论。
- 可能根因在哪里。
- 应该如何修复。

这是跨工具结果归纳和风险判断，属于 Agent。

### 5. 需要长期状态和证据链

DiffGuard 的一次 run 至少要维护：

```text
testRunId
input sources
project detection
change analysis
deploy plan
mock plan
test matrix
execution result
evidence bundle
failure analysis
merge decision
```

Skill 可以产出局部物料，但不适合作为 run 的状态中心。

### 6. 需要审批点和安全边界

测试 Agent 可能触发：

- 部署临时环境。
- 访问仓库和需求系统。
- 创建 mock。
- 访问日志和 trace。
- 驱动真实浏览器。
- 推送 bot 报告。
- 创建 issue / PR comment。

高影响动作应该由 workflow 显式建模审批点，例如：

```text
ApproveDeploy
ApproveExternalNetwork
ApproveDestructiveTest
ApproveReportPush
```

这属于 Agent 编排层，不属于单个 Skill。

## DiffGuard 的 Agent 形态

DiffGuard 应采用固定状态机：

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
FailureAnalyzed
  ↓
ReportGenerated
```

每个节点必须声明：

```text
输入
输出
成功条件
失败条件
重试策略
证据物料
可降级路径
```

## Skill 拆分建议

后续可以把当前代码能力逐步拆成这些 Skill：

| Skill | 输入 | 输出 |
|---|---|---|
| diff-analysis-skill | PR diff / commit range | 变更摘要、风险提示 |
| project-detection-skill | repo tree / manifest / diff | components、runtime、confidence |
| deploy-contract-skill | ai-test.yaml / manifests | 部署计划、探活计划 |
| mock-planning-skill | dependencies / OpenAPI / logs | mock 规则、mock 覆盖说明 |
| api-test-skill | test matrix item | API 测试脚本、response 证据 |
| browser-test-skill | journey / selectors / baseUrl | Playwright 脚本、截图、trace |
| observability-skill | testRunId / traceId | logs、spans、metrics |
| report-skill | matrix / evidence / failures | Markdown / HTML 报告 |

Agent 负责选择和组合这些 Skill。

## 答辩表述

可以直接这样讲：

> 我们没有把 DiffGuard 做成一个 Skill，因为 Skill 适合封装局部能力，例如 diff 分析、Playwright 执行或报告渲染。但 AI 测试官的核心价值是跨阶段责任闭环：它要理解任务、判断影响范围、生成测试矩阵、选择执行路径、处理运行异常、收集证据并给出是否建议合并的结论。因此我们采用 Agent 驱动的稳定 workflow：流程确定，关键决策由 Agent 完成，具体动作由 Skill / MCP Tool 执行。

## 判断准则

```text
能被清楚描述成“输入 → 动作 → 输出”的，做成 Skill。
需要跨阶段维护状态、选择路径、处理异常、归纳证据、做最终判断的，做成 Agent。
```

## 参考

- OpenAI Agents SDK: https://developers.openai.com/api/docs/guides/agents
- OpenAI Skills: https://developers.openai.com/api/docs/guides/tools-skills
- Anthropic: Building Effective Agents: https://www.anthropic.com/engineering/building-effective-agents
- MCP Tools specification: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
