import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { calculateFinalPrice } from './coupon.js';
import { authorizePayment } from './paymentClient.js';

const orderInputSchema = z.object({
  userType: z.enum(['normal', 'vip']).default('normal'),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    skuId: z.string(),
    price: z.number().nonnegative(),
    quantity: z.number().int().positive(),
  })).min(1),
});

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'demo-shop-backend' });
  });

  app.post('/api/orders/preview', (req, res) => {
    const testRunId = req.header('x-ai-test-run-id');
    const traceparent = req.header('traceparent');
    const input = orderInputSchema.parse(req.body);
    const originalPrice = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const result = calculateFinalPrice({ originalPrice, userType: input.userType, couponCode: input.couponCode });

    console.log(JSON.stringify({
      event: 'order.preview.calculated',
      testRunId,
      traceparent,
      userType: input.userType,
      couponCode: input.couponCode,
      ...result,
    }));

    res.json(result);
  });

  app.post('/api/orders', async (req, res, next) => {
    try {
      const testRunId = req.header('x-ai-test-run-id');
      const input = orderInputSchema.parse(req.body);
      const originalPrice = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const price = calculateFinalPrice({ originalPrice, userType: input.userType, couponCode: input.couponCode });
      const orderId = `order-${Date.now()}`;
      const payment = await authorizePayment({ orderId, amount: price.finalPrice, testRunId });

      res.json({ orderId, status: 'PAID', price, payment });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'unknown error';
    res.status(400).json({ error: message });
  });

  return app;
}
