import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2, .font-semibold").filter({ hasText: /Insti ERP|Iniciar sesión/i }).first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@email.com");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);
    const errorText = page.locator(".bg-red-50");
    await expect(errorText).toBeVisible({ timeout: 5000 });
  });

  test("should login with admin credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@insti.dev");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL("**/dashboard**", { timeout: 5000 });
    await expect(page.locator("h2").filter({ hasText: /Panel/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 5000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
