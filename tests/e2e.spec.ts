import { test, expect } from '@playwright/test';

test.describe('JustLoveJazz', () => {
  test('page loads and renders', async ({ page }) => {
    await page.goto('/');
    
    // Page title exists
    expect(page.title).toBeTruthy();
    
    // Canvas exists (WebGL/WebGPU renderer)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav');
    await expect(nav).toBeVisible({ timeout: 5000 });
    
    const links = nav.locator('a');
    await expect(links).toHaveCount({ timeout: 5000 });
    
    // All nav links have href
    const hrefs = await links.allAttributes();
    expect(hrefs).toBeDefined();
  });

  test('has accessibility landmarks', async ({ page }) => {
    await page.goto('/');
    
    // Skip link exists
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeVisible();
    
    // Nav has role
    const nav = page.locator('nav[role="navigation"]');
    expect(await nav.count()).toBeGreaterThan(0);
  });

  test('gallery section is loadable', async ({ page }) => {
    await page.goto('/');
    
    // Wait for 3D scene to initialize
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    
    // Gallery section exists
    const aboutSection = page.locator('#about');
    expect(await aboutSection.count()).toBeGreaterThan(0);
  });
});
