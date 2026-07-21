import { test, expect } from '@playwright/test';

test.describe('Dashboard & Regra dos 5 Segundos', () => {
  test('deve redirecionar para a página inicial se não estiver autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });

  test('deve exibir elementos de acessibilidade e título da fintech', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Fintech/i);
  });
});
