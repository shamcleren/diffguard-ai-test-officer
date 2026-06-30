import type { CollectedContext } from '../collectors/contextCollector.js';

export type RuntimeKind = 'node' | 'python' | 'go' | 'java' | 'rust' | 'unknown';

export interface ComponentDetection {
  id: string;
  root: string;
  role: 'agent' | 'api' | 'web' | 'worker' | 'unknown';
  runtime: RuntimeKind;
  confidence: number;
  evidence: string[];
}

export interface ProjectDetection {
  primaryRuntime: RuntimeKind;
  confidence: number;
  components: ComponentDetection[];
  notes: string[];
}

export function detectProject(context: CollectedContext): ProjectDetection {
  const paths = new Set<string>(context.changedPaths);
  const diff = context.diffText;
  const components: ComponentDetection[] = [];

  if (hasAny(paths, ['agent/package.json', 'agent/src/'])) {
    components.push({
      id: 'agent',
      root: 'agent',
      role: 'agent',
      runtime: 'node',
      confidence: 0.9,
      evidence: ['agent/package.json', 'agent/src/**/*.ts'],
    });
  }

  if (hasAny(paths, ['apps/demo-shop-backend/package.json', 'apps/demo-shop-backend/src/'])) {
    components.push({
      id: 'demo-shop-backend',
      root: 'apps/demo-shop-backend',
      role: 'api',
      runtime: 'node',
      confidence: 0.9,
      evidence: ['apps/demo-shop-backend/package.json', 'Express API routes', 'TypeScript source'],
    });
  }

  if (hasAny(paths, ['apps/demo-shop-frontend/package.json', 'apps/demo-shop-frontend/src/'])) {
    components.push({
      id: 'demo-shop-frontend',
      root: 'apps/demo-shop-frontend',
      role: 'web',
      runtime: 'node',
      confidence: 0.9,
      evidence: ['apps/demo-shop-frontend/package.json', 'Vite / React source', 'TypeScript JSX'],
    });
  }

  if (diff.includes('go.mod')) {
    components.push({ id: 'go-service', root: '.', role: 'api', runtime: 'go', confidence: 0.85, evidence: ['go.mod'] });
  }
  if (diff.includes('pyproject.toml') || diff.includes('requirements.txt')) {
    components.push({ id: 'python-service', root: '.', role: 'api', runtime: 'python', confidence: 0.85, evidence: ['pyproject.toml or requirements.txt'] });
  }
  if (diff.includes('pom.xml') || diff.includes('build.gradle')) {
    components.push({ id: 'java-service', root: '.', role: 'api', runtime: 'java', confidence: 0.85, evidence: ['pom.xml or build.gradle'] });
  }

  const primaryRuntime = choosePrimaryRuntime(components);
  const confidence = components.length > 0 ? Math.max(...components.map((item) => item.confidence)) : 0.2;

  return {
    primaryRuntime,
    confidence,
    components,
    notes: components.length > 1
      ? ['检测到多组件 / 多入口项目，后续应按 component 而不是单一 language 生成部署和测试策略。']
      : ['未强制依赖 ai-test.yaml 的 language 字段；语言和运行时由代码、manifest、diff 和部署契约综合推断。'],
  };
}

function hasAny(paths: Set<string>, needles: string[]): boolean {
  return Array.from(paths).some((path) => needles.some((needle) => path === needle || path.startsWith(needle)));
}

function choosePrimaryRuntime(components: ComponentDetection[]): RuntimeKind {
  const counts = new Map<RuntimeKind, number>();
  for (const component of components) {
    counts.set(component.runtime, (counts.get(component.runtime) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
}
