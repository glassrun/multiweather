import { test, expect } from "@playwright/test";

test("searching for a city shows a consensus weather result", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("Search for a city...").fill("New York");
  await expect(page.getByRole("button", { name: /New York, New York/ })).toBeVisible({
    timeout: 10_000,
  });
  await page.getByRole("button", { name: /New York, New York/ }).click();

  await expect(page.getByText(/source agreement/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("7-day forecast")).toBeVisible();
  await expect(page.getByRole("button", { name: /Show per-source breakdown/ })).toBeVisible();
});

test("signed-out users are not offered a save button", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search for a city...").fill("Paris");
  await expect(page.getByRole("button", { name: /Paris, .*France/ })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Paris, .*France/ }).first().click();

  await expect(page.getByText(/source agreement/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Save location" })).not.toBeVisible();
});
