import { test, expect } from "@playwright/test";

test("mobile viewport collapses auth links into an account menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Sign in" })).toBeHidden();
  const menuBtn = page.getByRole("button", { name: "Account menu" });
  await expect(menuBtn).toBeVisible();

  await menuBtn.click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
});

test("desktop viewport shows inline auth links, no account menu", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeHidden();
});
