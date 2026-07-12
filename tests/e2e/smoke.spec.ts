import { test, expect } from "@playwright/test";

/**
 * Happy-path smoke: admin signs in and reaches the Executive ESG Dashboard.
 * Prerequisite: the database has been seeded (`npm run db:seed`).
 */
test("admin can log in and see the dashboard", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("admin@verdantiq.demo");
  await page.getByLabel("Password").fill("Demo@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByText("Overall ESG Score")).toBeVisible();
  await expect(page.getByText("Environmental Score")).toBeVisible();
});

test("dashboard exposes the score methodology drawer", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("manager@verdantiq.demo");
  await page.getByLabel("Password").fill("Demo@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");

  await page.getByRole("button", { name: /How is this calculated/i }).click();
  await expect(page.getByText("ESG score methodology")).toBeVisible();
});
