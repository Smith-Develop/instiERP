import { test, expect } from "@playwright/test";

test.describe("Dashboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@insti.dev");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 5000 });
  });

  test("should show KPIs on dashboard", async ({ page }) => {
    await expect(page.locator("h2").filter({ hasText: /Panel/i })).toBeVisible({ timeout: 5000 });
  });

  test("should navigate to students page", async ({ page }) => {
    await page.click("a[href='/dashboard/students']");
    await page.waitForURL("**/dashboard/students**");
    await expect(page.locator("h2").filter({ hasText: /Estudiantes/i })).toBeVisible();
  });

  test("should navigate to finance page", async ({ page }) => {
    await page.click("a[href='/dashboard/finance']");
    await page.waitForURL("**/dashboard/finance**");
    await expect(page.locator("h2").filter({ hasText: /Finanzas/i })).toBeVisible();
  });

  test("should navigate to calendar page", async ({ page }) => {
    await page.click("a[href='/dashboard/calendar']");
    await page.waitForURL("**/dashboard/calendar**");
    await expect(page.locator("h2").filter({ hasText: /Calendario/i })).toBeVisible();
  });

  test("should open sidebar on mobile via hamburger", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    // On mobile sidebar should be hidden, click hamburger
    const btn = page.locator("button[aria-label='Abrir menú']");
    if (await btn.isVisible()) {
      await btn.click();
      // Sidebar should slide in
      await expect(page.locator("aside")).toBeVisible();
    }
  });
});
