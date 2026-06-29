import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

interface PreviewResult {
  originalPrice: number;
  couponDiscount: number;
  memberDiscount: number;
  finalPrice: number;
  formula: string;
}

export function Checkout() {
  const [couponCode, setCouponCode] = useState('FULL100_MINUS20');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [message, setMessage] = useState('');

  async function previewOrder() {
    const response = await fetch(`${API_BASE_URL}/orders/preview`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ai-test-run-id': 'manual-browser-demo',
      },
      body: JSON.stringify({
        userType: 'vip',
        couponCode,
        items: [{ skuId: 'sku-001', price: 100, quantity: 1 }],
      }),
    });
    const body = await response.json();
    setPreview(body);
  }

  async function submitOrder() {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ai-test-run-id': 'manual-browser-demo',
      },
      body: JSON.stringify({
        userType: 'vip',
        couponCode,
        items: [{ skuId: 'sku-001', price: 100, quantity: 1 }],
      }),
    });
    const body = await response.json();
    setMessage(`订单 ${body.orderId} 已创建，支付状态：${body.status}`);
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Demo Shop Checkout</h1>
        <p>商品：AI 测试官 T-shirt</p>
        <p data-testid="original-price">原价：100.00</p>
        <label>
          优惠码
          <input
            data-testid="coupon-input"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
          />
        </label>
        <button data-testid="preview-button" onClick={previewOrder}>预览订单</button>
        {preview && (
          <div className="result">
            <p data-testid="coupon-discount">满减优惠：{preview.couponDiscount.toFixed(2)}</p>
            <p data-testid="member-discount">会员优惠：{preview.memberDiscount.toFixed(2)}</p>
            <p data-testid="final-price">最终金额：{preview.finalPrice.toFixed(2)}</p>
            <p data-testid="formula">公式：{preview.formula}</p>
          </div>
        )}
        <button data-testid="submit-button" onClick={submitOrder}>提交订单</button>
        {message && <p data-testid="order-message">{message}</p>}
      </section>
    </main>
  );
}
