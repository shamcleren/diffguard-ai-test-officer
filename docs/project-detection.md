# Project Detection

DiffGuard 不要求用户在 `ai-test.yaml` 中强制声明 `language`。

推荐策略是：

```text
自动识别为默认路径，配置覆盖为兜底路径。
```

## 自动识别信号

DiffGuard 可以按以下信号推断项目运行时、组件和测试策略：

| 信号 | 示例 | 推断 |
|---|---|---|
| Manifest | package.json, pyproject.toml, go.mod, pom.xml, Cargo.toml | runtime / package manager |
| 源码扩展名 | .ts, .tsx, .py, .go, .java, .rs | source language |
| 框架特征 | express, vite, fastapi, spring | app role / test executor |
| 部署文件 | Dockerfile, docker-compose.yml, Helm chart | deploy mode |
| 入口命令 | npm scripts, Makefile, Procfile | start / test / build command |
| PR diff | changed paths and symbols | impacted components |

## 配置覆盖

只有在自动识别不准时才需要配置覆盖：

```yaml
project:
  detection:
    enabled: true
    confidenceThreshold: 0.75
    overrides:
      apps/legacy-service:
        runtime: java
        buildTool: maven
```

## 为什么不用单一 language 字段

真实项目经常是 monorepo 或 polyglot：

- agent 可能是 TypeScript
- backend 可能是 Go / Java / Python
- frontend 可能是 TypeScript
- infra 可能是 Helm / Terraform
- test 可能是 Playwright / pytest / JUnit

因此测试 Agent 应该按 component 建模，而不是用一个仓库级 `language` 决定所有行为。
