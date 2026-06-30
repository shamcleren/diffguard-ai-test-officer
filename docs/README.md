# DiffGuard Docs

## 推荐阅读顺序

1. [`agent-vs-skill.md`](./agent-vs-skill.md)：解释为什么 DiffGuard 必须是 Agent，而不是一个 Skill。
2. [`architecture.md`](./architecture.md)：系统架构、状态机和模块边界。
3. [`development-plan.md`](./development-plan.md)：完整开发计划、里程碑、Backlog 和验收标准。
4. [`implementation-backlog.md`](./implementation-backlog.md)：按 P0 / P1 / P2 拆分的开发任务列表。
5. [`project-detection.md`](./project-detection.md)：项目自动识别策略，说明为什么不要求 `language`。
6. [`deliverables.md`](./deliverables.md)：黑客松交付物清单和演示兜底方案。
7. [`demo-script.md`](./demo-script.md)：现场演示脚本。

## 核心设计句

```text
Skill 提供能力，Agent 承担责任。
```

DiffGuard 的核心不是生成测试脚本，而是承担完整测试任务：理解变更、规划矩阵、执行验证、收集证据、归因失败，并给出是否建议合并的结论。
