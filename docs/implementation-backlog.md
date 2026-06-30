# Implementation Backlog

## P0 Backlog

| ID | Title | Area | Status | Acceptance Criteria |
|---|---|---|---|---|
| P0-001 | 固化 Agent workflow | agent | done | `npm run demo` 输出 report / matrix / evidence |
| P0-002 | 移除必填 language | contract | done | `ai-test.yaml` 不包含 `app.language` |
| P0-003 | 自动项目识别 | detector | done | 输出 `project-detection.json` |
| P0-004 | 生成测试矩阵 | planner | done | 至少生成 M-001 到 M-006 |
| P0-005 | 生成 Evidence Bundle | reporter | done | 输出 `evidence-bundle.json` |
| P0-006 | 生成可决策报告 | reporter | done | 高风险失败时输出“不建议合并” |
| P0-007 | Demo 业务系统 | demo-app | done | 后端包含稳定可复现 bug |
| P0-008 | Playwright 配置 | test | done | 失败时保留 trace / screenshot / video |
| P0-009 | 文档完善 | docs | done | README、架构、开发计划、Agent vs Skill 均存在 |

## P1 Backlog

| ID | Title | Area | Status | Acceptance Criteria |
|---|---|---|---|---|
| P1-001 | API Executor 真实执行 | executor | done | Agent 调用 `/api/orders/preview`，M-001 真实失败 |
| P1-002 | Browser Executor 调度 Playwright | executor | done | Agent 触发 E2E 并采集 trace / screenshot |
| P1-003 | WireMock request journal 校验 | mock | done | M-005 验证支付 mock 收到正确 amount |
| P1-004 | 本地日志采集 | observability | partial | M-006 注入 `x-ai-test-run-id` / `traceparent`，日志查询仍待对接 |
| P1-005 | Failure Analyzer | analyzer | done | 报告关联失败用例、需求和 `coupon.ts` 代码位置 |
| P1-006 | PR Comment 输出 | integration | todo | GitHub PR 页面出现测试摘要 |
| P1-007 | HTML 报告 | reporter | todo | 可视化展示矩阵、失败证据、证据链接 |
| P1-008 | CLI 参数扩展 | cli | partial | 已有 `--mode execute`，PR URL / commit-range 待实现 |

## P2 Backlog

| ID | Title | Area | Status | Acceptance Criteria |
|---|---|---|---|---|
| P2-001 | TAPD / TGit connector | integration | todo | 自动读取需求 / Bug / PR diff |
| P2-002 | 定时巡检 | scheduler | todo | 定时跑核心链路并输出巡检报告 |
| P2-003 | Bot 推送 | integration | todo | 报告推送到机器人通道 |
| P2-004 | OTel Collector 查询 | observability | todo | 根据 traceId 查询 span 链路 |
| P2-005 | Test self-healing | browser | todo | selector 失败时给出替代 locator 建议 |
| P2-006 | 多服务拓扑分析 | analyzer | todo | 输出 impacted service graph |
| P2-007 | eBPF / Hubble 透明观测 | observability | todo | 无侵入采集网络链路，作为愿景演示 |

## 当前下一步推荐

优先做 P1-006、P1-007、P2-001。

原因：

1. P1-006 让报告可以回写 PR，形成合并前闭环。
2. P1-007 增强现场演示体验。
3. P2-001 接入 TGit / TAPD 后更贴合比赛平台能力。
