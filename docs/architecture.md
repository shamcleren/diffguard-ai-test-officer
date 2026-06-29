# DiffGuard Architecture

## 角色边界

```text
Agent = 状态机 + 决策 + 编排 + 兜底
Skill = 单一工具能力
```

Agent 节点：

1. Context Collector
2. Deploy Contract Resolver
3. Change Analyzer
4. Mock Dependency Planner
5. Test Matrix Planner
6. Environment Provisioner
7. Matrix Executor
8. Evidence Bundler
9. Report Generator

## 运行前

- 输入 PR diff 或需求文档
- 读取 `ai-test.yaml`
- 解析 Docker / Helm / Mock / 健康检查
- 构建影响范围
- 生成测试矩阵

## 运行时

- API Executor
- Browser Executor
- Mock Verification Executor
- DB / State Executor
- Observability Collector

## 运行后

- 汇总 Evidence Bundle
- 生成可交付测试报告
- 输出业务修复建议和可观测性改造建议

## 证据包

每个测试矩阵项至少应该包含：

- API request / response
- Screenshot
- Playwright trace
- Service log
- Mock request log
- Trace ID / Span
