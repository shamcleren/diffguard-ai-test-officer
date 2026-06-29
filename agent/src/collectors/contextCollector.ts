import { readFile } from 'node:fs/promises';
import type { WorkflowInput } from '../types.js';

export interface CollectedContext {
  diffText: string;
  requirementText?: string;
  changedPaths: string[];
  rawInput: WorkflowInput;
}

export async function collectContext(input: WorkflowInput): Promise<CollectedContext> {
  const diffText = await readFile(input.diffPath, 'utf-8');
  const requirementText = input.requirementPath
    ? await readFile(input.requirementPath, 'utf-8')
    : undefined;

  const changedPaths = Array.from(diffText.matchAll(/^diff --git a\/(.*?) b\/(.*?)$/gm))
    .map((match) => match[2])
    .filter(Boolean) as string[];

  return { diffText, requirementText, changedPaths, rawInput: input };
}
