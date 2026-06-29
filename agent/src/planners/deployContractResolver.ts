import { readFile } from 'node:fs/promises';
import YAML from 'yaml';
import type { DeployContract } from '../types.js';

export async function resolveDeployContract(path: string): Promise<DeployContract> {
  const text = await readFile(path, 'utf-8');
  const parsed = YAML.parse(text) as DeployContract;

  if (!parsed.app?.name) throw new Error('ai-test.yaml 缺少 app.name');
  if (!parsed.healthCheck?.url) throw new Error('ai-test.yaml 缺少 healthCheck.url');
  if (!parsed.entrypoints?.api?.baseUrl && !parsed.entrypoints?.web?.baseUrl) {
    throw new Error('ai-test.yaml 至少需要 entrypoints.api 或 entrypoints.web');
  }

  return parsed;
}
