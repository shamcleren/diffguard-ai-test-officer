import type { DeployContract, TestMatrixItem } from '../types.js';

export async function executeMatrix(input: {
  matrix: TestMatrixItem[];
  contract: DeployContract;
  mode: string;
  testRunId: string;
}): Promise<TestMatrixItem[]> {
  if (input.mode === 'dry-run') {
    return input.matrix.map((item) => simulate(item));
  }

  console.log('[execute] matrix execution is delegated to API / Browser / Mock / Observability Skills.');
  return input.matrix.map((item) => ({ ...item, status: 'not_run' }));
}

function simulate(item: TestMatrixItem): TestMatrixItem {
  if (item.id === 'M-001') {
    return {
      ...item,
      status: 'failed',
      failureReason: '示例后端当前实现疑似先执行 VIP 95 折，再执行满减，100 元订单返回 75.00；需求期望先满减再折扣，结果为 76.00。',
    };
  }

  if (item.id === 'M-002') {
    return {
      ...item,
      status: 'failed',
      failureReason: '结算页展示与后端订单预览存在不一致风险，需要统一使用 /api/orders/preview 返回结果。',
    };
  }

  return { ...item, status: 'passed' };
}
