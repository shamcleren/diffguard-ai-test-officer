#!/usr/bin/env node
import { Command } from 'commander';
import { runWorkflow } from './orchestrator/workflow.js';

const program = new Command();

program
  .name('diffguard')
  .description('AI 测试官：PR / 需求驱动的全链路测试 Agent')
  .version('0.1.0');

program
  .command('run')
  .requiredOption('--diff <path>', 'PR diff 文件路径')
  .option('--requirement <path>', '需求文档路径')
  .option('--contract <path>', 'ai-test.yaml 接入契约路径', 'ai-test.yaml')
  .option('--mode <mode>', 'dry-run | execute', 'dry-run')
  .option('--out <path>', '报告输出目录', 'reports')
  .action(async (options) => {
    const result = await runWorkflow({
      diffPath: options.diff,
      requirementPath: options.requirement,
      contractPath: options.contract,
      mode: options.mode,
      outDir: options.out,
    });

    console.log(`\nDiffGuard finished: ${result.decision}`);
    console.log(`Report: ${result.reportPath}`);
    console.log(`Evidence: ${result.evidencePath}`);
  });

program.parseAsync(process.argv);
