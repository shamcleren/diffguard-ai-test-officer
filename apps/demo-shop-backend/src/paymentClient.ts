export interface PaymentAuthorizationInput {
  orderId: string;
  amount: number;
  testRunId?: string;
}

export async function authorizePayment(input: PaymentAuthorizationInput): Promise<{ paymentId: string; status: string }> {
  const baseUrl = process.env.PAYMENT_BASE_URL ?? 'http://localhost:8089';
  const response = await fetch(`${baseUrl}/payments/authorize`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(input.testRunId ? { 'x-ai-test-run-id': input.testRunId } : {}),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`payment authorization failed: ${response.status}`);
  }

  return response.json() as Promise<{ paymentId: string; status: string }>;
}
