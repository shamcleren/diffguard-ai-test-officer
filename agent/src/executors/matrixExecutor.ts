import type { DeployContract, TestMatrixItem } from '../types.js';
import { executeApiMatrixItem } from './apiExecutor.js';
import { executeBrowserMatrixItem } from './browserExecutor.js';
import { executeMockMatrixItem } from './mockVerifier.js';

export async function executeMatrix(input: {
  matrix: TestMatrixItem[];
  contract: DeployContract;
  mode: string;
  testRunId: string;
}): Promise<TestMatrixItem[]> {
  if (input.mode === 'dry-run') {
    return input.matrix.map((item) => simulate(item));
  }

  const executed: TestMatrixItem[] = [];
  for (const item of input.matrix) {
    executed.push(await executeOne({ item, contract: input.contract, testRunId: input.testRunId }));
  }

  return executed;
}

async function executeOne(input: {
  item: TestMatrixItem;
  contract: DeployContract;
  testRunId: string;
}): Promise<TestMatrixItem> {
  let current = input.item;

  if (current.layers.includes('api')) {
    current = await executeApiMatrixItem({ item: current, contract: input.contract, testRunId: input.testRunId });
  }

  if (current.id === 'M-002' && current.layers.includes('browser')) {
    current = await executeBrowserMatrixItem({ item: current, contract: input.contract, testRunId: input.testRunId });
  }

  if (current.layers.includes('mock')) {
    current = await executeMockMatrixItem({ item: current, contract: input.contract, testRunId: input.testRunId });
  }

  if (current.status === 'not_run') {
    return {
      ...current,
      status: 'skipped',
      failureCategory: 'unknown',
      failureReason: '当前版本没有匹配该矩阵项的真实执行器。',
    };
  }

  return current;
}

function simulate(item: TestMatrixItem): TestMatrixItem {
  if (item.id === 'M-001') {
    return {
      ...item,
      status: 'failed',
      failureCategory: 'business',
      failureReason: '示例后端当前实现疑似先执行 VIP 95 折，再执行满减，100 元订单返回 75.00；需求期望先满减再折扣，结果为 76.00。',
      fixSuggestion: '修复 apps/demo-shop-backend/src/coupon.ts 中 calculateFinalPrice 的计算顺序。',
      runtimeEvidence: {
        apiCalls: [
          {
            name: 'dry-run order preview',
            method: 'POST',
            url: '/api/orders/preview',
            status: 200,
            request: {
              userType: 'vip',
              couponCode: 'FULL100_MINUS20',
              items: [{ skuId: 'sku-001', price: 100, quantity: 1 }],
            },
            response: { finalPrice: 75, expectedFinalPrice: 76 },
          },
        ],
      },
    };
  }

  if (item.id === 'M-002') {
    return {
      ...item,
      status: 'failed',
      failureCategory: 'business',
      failureReason: '结算页展示与后端订单预览存在不一致风险，需要统一使用 /api/orders/preview 返回结果。',
      fixSuggestion: '使用订单预览接口作为结算页金额唯一来源，并修复后端优惠叠加顺序。',
      runtimeEvidence: {
        files: [
          { kind: 'screenshot', path: 'artifacts/M-002-checkout.png' },
          { kind: 'trace', path: 'artifacts/M-002-trace.zip' },
        ],
      },
    };
  }

  return { ...item, status: 'passed' };
}
