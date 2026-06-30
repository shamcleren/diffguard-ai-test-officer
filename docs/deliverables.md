# 黑客松交付物清单

## 提交标题

```text
方向二【AI测试官】DiffGuard：理解 PR 意图的全链路测试 Agent
```

## 必须展示的交付物

| 交付物 | 位置 | 用途 |
|---|---|---|
| 产品说明 | `README.md` | 评审快速理解项目 |
| Agent vs Skill 说明 | `docs/agent-vs-skill.md` | 解释为什么必须是 Agent |
| 开发计划 | `docs/development-plan.md` | 展示工程落地路线 |
| 架构图说明 | `docs/architecture.md` | 展示系统模块 |
| Demo 脚本 | `docs/demo-script.md` | 现场演示顺序 |
| 接入契约 | `ai-test.yaml` | 展示标准化接入方式 |
| 示例需求 | `examples/requirements/coupon-stack.md` | 场景 B 能力入口 |
| 示例 PR diff | `examples/pr-diff/coupon-stack.diff` | 场景 A 能力入口 |
| 示例后端 | `apps/demo-shop-backend` | 可运行业务系统 |
| 示例前端 | `apps/demo-shop-frontend` | 浏览器验证对象 |
| 支付 Mock | `mocks/payment` | 外部依赖隔离 |
| Playwright 测试 | `tests/e2e` | 前端真实体验验证 |
| 示例报告 | `reports/sample-report.md` | 可决策报告样例 |
| 示例证据包 | `reports/sample-evidence-bundle.json` | Evidence Bundle 样例 |

## Demo 最小闭环

```bash
npm install
npm run demo
cat reports/report.md
```

评审应该看到：

1. Agent 自动识别项目组件。
2. Agent 解析 `ai-test.yaml`。
3. Agent 生成测试矩阵。
4. Agent 输出证据包。
5. Agent 给出“不建议合并”。
6. 报告能定位到优惠券计算顺序问题。

## 完整演示闭环

```bash
npm run dev
npm run test
npx playwright install chromium
npm run test:e2e
```

## 演示兜底

如果现场 Docker / 网络 / 浏览器环境不稳定，使用 dry-run 闭环：

```bash
npm run demo
```

然后展示以下文件：

```text
reports/project-detection.json
reports/test-matrix.json
reports/evidence-bundle.json
reports/report.md
```

## 评审讲解顺序

1. 先讲痛点：测试不是缺脚本，而是缺能承担测试责任的自动化角色。
2. 再讲形态：Agent 驱动稳定 workflow，Skill 作为能力节点。
3. 展示输入：需求 + PR diff。
4. 展示运行前：项目识别、部署契约、风险分析、测试矩阵。
5. 展示运行时：API / Browser / Mock / Observability。
6. 展示运行后：Evidence Bundle + 可决策报告。
7. 最后讲扩展：TGit、TAPD、定时巡检、bot 推送、OTel、eBPF。
