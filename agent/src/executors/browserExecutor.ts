import { spawn } from 'node:child_process';
import type { DeployContract, RuntimeEvidence, TestMatrixItem } from '../types.js';

export interface BrowserExecutorInput {
  item: TestMatrixItem;
  contract: DeployContract;
  testRunId: string;
}

export async function executeBrowserMatrixItem(input: BrowserExecutorInput): Promise<TestMatrixItem> {
  if (input.item.id !== 'M-002') return input.item;

  const webBaseUrl = input.contract.entrypoints.web?.baseUrl ?? 'http://localhost:5173';
  const result = await runPlaywright({ webBaseUrl, testRunId: input.testRunId });
  const runtimeEvidence: RuntimeEvidence = {
    ...input.item.runtimeEvidence,
    process: result,
    files: [
      ...(input.item.runtimeEvidence?.files ?? []),
      { kind: 'report', path: 'playwright-report/index.html' },
      { kind: 'trace', path: 'test-results/**/trace.zip' },
      { kind: 'screenshot', path: 'test-results/**/*.png' },
      { kind: 'video', path: 'test-results/**/*.webm' },
    ],
  };

  if (result.exitCode === 0) {
    return { ...input.item, status: 'passed', runtimeEvidence };
  }

  const combined = `${result.stdoutTail ?? ''}\n${result.stderrTail ?? ''}`;
  const isEnvironmentFailure = /ECONNREFUSED|ERR_CONNECTION_REFUSED|net::ERR|Cannot find module|Executable doesn't exist|No tests found/i.test(combined);

  return {
    ...input.item,
    status: 'failed',
    failureCategory: isEnvironmentFailure ? 'environment' : 'business',
    failureReason: isEnvironmentFailure
      ? '浏览器验证未能完成，疑似前端服务、后端服务或浏览器运行环境未就绪。'
      : 'Playwright 断言失败：结算页最终金额未满足需求 Oracle，需结合 trace.zip、截图和 API response 复核。',
    fixSuggestion: isEnvironmentFailure
      ? '先运行 npm run dev，并确认 http://localhost:5173 和 http://localhost:3001/health 可访问。'
      : '统一结算页最终金额来源，使用 /api/orders/preview 返回值，并修复后端优惠叠加顺序。',
    runtimeEvidence,
  };
}

function runPlaywright(input: { webBaseUrl: string; testRunId: string }): Promise<NonNullable<RuntimeEvidence['process']>> {
  const command = 'npx';
  const args = ['playwright', 'test', 'tests/e2e/checkout.spec.ts', '--project=chromium'];

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        WEB_BASE_URL: input.webBaseUrl,
        AI_TEST_RUN_ID: input.testRunId,
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      resolve({
        command: `${command} ${args.join(' ')}`,
        exitCode: 1,
        stderrTail: error.message,
      });
    });

    child.on('close', (code) => {
      resolve({
        command: `${command} ${args.join(' ')}`,
        exitCode: code ?? 1,
        stdoutTail: tail(stdout),
        stderrTail: tail(stderr),
      });
    });
  });
}

function tail(value: string, max = 4000): string {
  return value.length > max ? value.slice(value.length - max) : value;
}
