import { expect, test } from '@playwright/test';

test('M-002 checkout final price should match requirement oracle', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('coupon-input').fill('FULL100_MINUS20');
  await page.getByTestId('preview-button').click();

  await expect(page.getByTestId('final-price')).toContainText('76.00');
});
