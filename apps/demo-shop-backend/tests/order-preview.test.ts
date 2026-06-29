import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('POST /api/orders/preview', () => {
  it('detects the demo bug: VIP coupon stacking should be 76.00', async () => {
    const response = await request(app)
      .post('/api/orders/preview')
      .set('x-ai-test-run-id', 'unit-test')
      .send({
        userType: 'vip',
        couponCode: 'FULL100_MINUS20',
        items: [{ skuId: 'sku-001', price: 100, quantity: 1 }],
      });

    expect(response.status).toBe(200);
    expect(response.body.finalPrice).toBe(76);
  });
});
