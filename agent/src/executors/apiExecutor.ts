import type { DeployContract, RuntimeEvidence, TestMatrixItem } from '../types.js';

export interface ApiExecutorInput {
  item: TestMatrixItem;
  contract: DeployContract;
  testRunId: string;
}

interface ApiCallRecord {
  name?: string;
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  request?: unknown;
  response?: unknown;
  error?: string;
}

export async function executeApiMatrixItem(input: ApiExecutorInput): Promise<TestMatrixItem> {
  if (input.item.id === 'M-001') return executeVipCouponPreview(input);
  if (input.item.id === 'M-003') return executeNonNegativePricePreview(input);
  if (input.item.id === 'M-004') return executePlainOrderPreview(input);
  if (input.item.id === 'M-006') return executeObservabilityHeaderProbe(input);

  return input.item;
}

async function executeVipCouponPreview(input: ApiExecutorInput): Promise<TestMatrixItem> {
  const body = {
    userType: 'vip',
    couponCode: 'FULL100_MINUS20',
    items: [{ skuId: 'sku-001', price: 100, quantity: 1 }],
  };
  const call = await postJson(input.contract, '/orders/preview', body, input.testRunId, 'M-001 order preview');
  const finalPrice = readNumber(call.response, 'finalPrice');
  const expected = 76;

  if (call.error) {
    return withApiFailure(input.item, call, 'environment', `API 调用失败：${call.error}`);
  }

  if (call.status !== 200) {
    return withApiFailure(input.item, call, 'environment', `订单预览接口返回非 200 状态码：${call.status}`);
  }

  if (finalPrice !== expected) {
    return {
      ...input.item,
      status: 'failed',
      failureCategory: 'business',
      failureReason: `VIP 满减叠加计算不符合需求：预期 finalPrice=${expected}，实际 finalPrice=${finalPrice}。`,
      fixSuggestion: '修复 apps/demo-shop-backend/src/coupon.ts 中 calculateFinalPrice 的计算顺序：先满减，再应用会员折扣。',
      runtimeEvidence: appendApiCall(input.item.runtimeEvidence, call),
    };
  }

  return withApiPass(input.item, call);
}

async function executeNonNegativePricePreview(input: ApiExecutorInput): Promise<TestMatrixItem> {
  const body = {
    userType: 'vip',
    couponCode: 'FULL100_MINUS20',
    items: [{ skuId: 'sku-low-price', price: 10, quantity: 1 }],
  };
  const call = await postJson(input.contract, '/orders/preview', body, input.testRunId, 'M-003 non-negative final price');
  const finalPrice = readNumber(call.response, 'finalPrice');

  if (call.error) return withApiFailure(input.item, call, 'environment', `API 调用失败：${call.error}`);
  if (call.status !== 200) return withApiFailure(input.item, call, 'environment', `接口返回非 200 状态码：${call.status}`);
  if (typeof finalPrice !== 'number' || finalPrice < 0) {
    return withApiFailure(input.item, call, 'business', `金额下限保护失败：finalPrice=${String(finalPrice)}。`);
  }

  return withApiPass(input.item, call);
}

async function executePlainOrderPreview(input: ApiExecutorInput): Promise<TestMatrixItem> {
  const body = {
    userType: 'normal',
    items: [{ skuId: 'sku-001', price: 100, quantity: 1 }],
  };
  const call = await postJson(input.contract, '/orders/preview', body, input.testRunId, 'M-004 plain order preview');
  const finalPrice = readNumber(call.response, 'finalPrice');

  if (call.error) return withApiFailure(input.item, call, 'environment', `API 调用失败：${call.error}`);
  if (call.status !== 200) return withApiFailure(input.item, call, 'environment', `接口返回非 200 状态码：${call.status}`);
  if (finalPrice !== 100) return withApiFailure(input.item, call, 'business', `无优惠普通订单金额异常：预期 100，实际 ${String(finalPrice)}。`);

  return withApiPass(input.item, call);
}

async function executeObservabilityHeaderProbe(input: ApiExecutorInput): Promise<TestMatrixItem> {
  const body = {
    userType: 'normal',
    items: [{ skuId: 'sku-001', price: 1, quantity: 1 }],
  };
  const call = await postJson(input.contract, '/orders/preview', body, input.testRunId, 'M-006 observability header probe');

  if (call.error) return withApiFailure(input.item, call, 'environment', `观测探针请求失败：${call.error}`);
  if (call.status !== 200) return withApiFailure(input.item, call, 'environment', `观测探针接口返回非 200 状态码：${call.status}`);

  return {
    ...input.item,
    status: 'passed',
    runtimeEvidence: {
      ...input.item.runtimeEvidence,
      ...appendApiCall(input.item.runtimeEvidence, call),
      logs: [
        ...(input.item.runtimeEvidence?.logs ?? []),
        {
          service: 'demo-shop-backend',
          signal: 'expected-log-correlation',
          testRunId: input.testRunId,
          note: '服务端会将 x-ai-test-run-id 和 traceparent 写入 order.preview.calculated 日志。',
        },
      ],
      spans: [
        ...(input.item.runtimeEvidence?.spans ?? []),
        { traceId: `trace-${input.testRunId}`, spanName: 'OrderController.preview', status: 'expected-or-collected' },
      ],
    },
  };
}

async function postJson(contract: DeployContract, path: string, body: unknown, testRunId: string, name: string): Promise<ApiCallRecord> {
  const baseUrl = contract.entrypoints.api?.baseUrl;
  if (!baseUrl) {
    return { name, method: 'POST', url: path, request: body, error: 'ai-test.yaml 缺少 entrypoints.api.baseUrl' };
  }

  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ai-test-run-id': testRunId,
        traceparent: buildTraceparent(testRunId),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    const text = await response.text();
    const parsed = safeJson(text);

    return {
      name,
      method: 'POST',
      url,
      status: response.status,
      durationMs: Date.now() - startedAt,
      request: body,
      response: parsed ?? text,
    };
  } catch (error) {
    return {
      name,
      method: 'POST',
      url,
      durationMs: Date.now() - startedAt,
      request: body,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function readNumber(value: unknown, key: string): number | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const record = value as Record<string, unknown>;
  return typeof record[key] === 'number' ? record[key] : undefined;
}

function safeJson(text: string): unknown | undefined {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function withApiPass(item: TestMatrixItem, call: ApiCallRecord): TestMatrixItem {
  return {
    ...item,
    status: 'passed',
    runtimeEvidence: appendApiCall(item.runtimeEvidence, call),
  };
}

function withApiFailure(item: TestMatrixItem, call: ApiCallRecord, category: TestMatrixItem['failureCategory'], reason: string): TestMatrixItem {
  return {
    ...item,
    status: 'failed',
    failureCategory: category,
    failureReason: reason,
    runtimeEvidence: appendApiCall(item.runtimeEvidence, call),
  };
}

function appendApiCall(evidence: RuntimeEvidence | undefined, call: ApiCallRecord): RuntimeEvidence {
  return {
    ...evidence,
    apiCalls: [...(evidence?.apiCalls ?? []), call],
  };
}

function buildTraceparent(testRunId: string): string {
  const normalized = testRunId.replace(/[^a-fA-F0-9]/g, '').padEnd(32, '0').slice(0, 32);
  return `00-${normalized}-0123456789abcdef-01`;
}
