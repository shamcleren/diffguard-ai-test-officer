import type { DeployContract, RuntimeEvidence, TestMatrixItem } from '../types.js';

export interface MockVerifierInput {
  item: TestMatrixItem;
  contract: DeployContract;
  testRunId: string;
}

export async function executeMockMatrixItem(input: MockVerifierInput): Promise<TestMatrixItem> {
  if (input.item.id !== 'M-005') return input.item;

  const orderCall = await createOrder(input.contract, input.testRunId);
  const journalCall = await readWireMockJournal(input.contract);
  const orderFinalPrice = readPathNumber(orderCall.response, ['price', 'finalPrice']);
  const journalAmount = extractPaymentAmount(journalCall.response);

  const runtimeEvidence: RuntimeEvidence = {
    ...input.item.runtimeEvidence,
    apiCalls: [...(input.item.runtimeEvidence?.apiCalls ?? []), orderCall],
    mockRequests: [...(input.item.runtimeEvidence?.mockRequests ?? []), { requestJournal: journalCall.response, extractedAmount: journalAmount }],
  };

  if (orderCall.error) {
    return fail(input.item, runtimeEvidence, 'environment', `创建订单失败，无法触发支付 mock：${orderCall.error}`);
  }
  if (journalCall.error) {
    return fail(input.item, runtimeEvidence, 'mock', `读取 WireMock request journal 失败：${journalCall.error}`);
  }
  if (typeof orderFinalPrice !== 'number') {
    return fail(input.item, runtimeEvidence, 'business', '订单响应中缺少 price.finalPrice，无法校验支付透传金额。');
  }
  if (typeof journalAmount !== 'number') {
    return fail(input.item, runtimeEvidence, 'mock', 'WireMock journal 中没有识别到 /payments/authorize 的 amount 字段。');
  }
  if (journalAmount !== orderFinalPrice) {
    return fail(input.item, runtimeEvidence, 'business', `支付 mock 收到的 amount=${journalAmount}，订单 finalPrice=${orderFinalPrice}，金额透传不一致。`);
  }

  return { ...input.item, status: 'passed', runtimeEvidence };
}

async function createOrder(contract: DeployContract, testRunId: string): Promise<Record<string, unknown>> {
  const baseUrl = contract.entrypoints.api?.baseUrl;
  if (!baseUrl) return { method: 'POST', url: '/orders', error: 'ai-test.yaml 缺少 entrypoints.api.baseUrl' };

  const url = `${baseUrl.replace(/\/$/, '')}/orders`;
  const body = {
    userType: 'vip',
    couponCode: 'FULL100_MINUS20',
    items: [{ skuId: 'sku-001', price: 100, quantity: 1 }],
  };

  return postJson(url, body, testRunId, 'M-005 create order with payment mock');
}

async function readWireMockJournal(contract: DeployContract): Promise<Record<string, unknown>> {
  const payment = contract.dependencies?.['payment-service'];
  const baseUrl = payment?.baseUrl;
  if (!baseUrl) return { method: 'GET', url: '/__admin/requests', error: 'payment-service 缺少 baseUrl' };

  const url = `${baseUrl.replace(/\/$/, '')}/__admin/requests`;
  const startedAt = Date.now();

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const text = await response.text();
    return {
      method: 'GET',
      url,
      status: response.status,
      durationMs: Date.now() - startedAt,
      response: safeJson(text) ?? text,
    };
  } catch (error) {
    return {
      method: 'GET',
      url,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function postJson(url: string, body: unknown, testRunId: string, name: string): Promise<Record<string, unknown>> {
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ai-test-run-id': testRunId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const text = await response.text();

    return {
      name,
      method: 'POST',
      url,
      status: response.status,
      durationMs: Date.now() - startedAt,
      request: body,
      response: safeJson(text) ?? text,
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

function extractPaymentAmount(value: unknown): number | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const requests = (value as { requests?: unknown }).requests;
  if (!Array.isArray(requests)) return undefined;

  const paymentRequest = requests.find((entry) => {
    const url = readPathString(entry, ['request', 'url']);
    return url === '/payments/authorize';
  });

  const body = readPathString(paymentRequest, ['request', 'body']);
  if (!body) return undefined;

  const parsed = safeJson(body);
  return readPathNumber(parsed, ['amount']);
}

function readPathNumber(value: unknown, path: string[]): number | undefined {
  const target = readPath(value, path);
  return typeof target === 'number' ? target : undefined;
}

function readPathString(value: unknown, path: string[]): string | undefined {
  const target = readPath(value, path);
  return typeof target === 'string' ? target : undefined;
}

function readPath(value: unknown, path: string[]): unknown {
  let cursor = value;
  for (const key of path) {
    if (typeof cursor !== 'object' || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

function safeJson(text: string): unknown | undefined {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function fail(item: TestMatrixItem, runtimeEvidence: RuntimeEvidence, category: TestMatrixItem['failureCategory'], reason: string): TestMatrixItem {
  return {
    ...item,
    status: 'failed',
    failureCategory: category,
    failureReason: reason,
    runtimeEvidence,
  };
}
