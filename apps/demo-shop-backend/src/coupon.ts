export type UserType = 'normal' | 'vip';

export interface PriceInput {
  originalPrice: number;
  userType: UserType;
  couponCode?: string;
}

export interface PriceResult {
  originalPrice: number;
  couponDiscount: number;
  memberDiscount: number;
  finalPrice: number;
  formula: string;
}

export function calculateFinalPrice(input: PriceInput): PriceResult {
  const couponDiscount = input.couponCode === 'FULL100_MINUS20' && input.originalPrice >= 100 ? 20 : 0;
  const memberRate = input.userType === 'vip' ? 0.95 : 1;

  // DEMO_BUG:
  // 需求期望：先满减，再会员折扣 => (100 - 20) * 0.95 = 76
  // 当前实现：先会员折扣，再满减 => 100 * 0.95 - 20 = 75
  // 这个错误用于演示 DiffGuard 如何发现 PR 行为与需求不一致。
  const discountedByMember = input.originalPrice * memberRate;
  const finalPrice = Math.max(0, round2(discountedByMember - couponDiscount));
  const memberDiscount = round2(input.originalPrice - discountedByMember);

  return {
    originalPrice: input.originalPrice,
    couponDiscount,
    memberDiscount,
    finalPrice,
    formula: 'max(0, originalPrice * memberRate - couponDiscount)',
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
