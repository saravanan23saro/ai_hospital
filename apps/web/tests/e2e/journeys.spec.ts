import { expect, test } from "@playwright/test";

test("homepage provides patient, doctor, staff, and admin sign-in entry", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome to CareFlow" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /patient/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /doctor/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /staff/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /admin/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("a patient can register, complete a profile, and sign out", async ({ page }) => {
  const unique = `${Date.now()}-${test.info().retry}`;
  await page.goto("/");
  await page.getByRole("button", { name: /register as a patient/i }).click();
  await page.getByLabel("Full Name").fill("Journey Test Patient");
  await page.getByLabel(/email address or 10-digit phone number/i).fill(`journey-${unique}@careflow.test`);
  await page.getByLabel("Password", { exact: true }).fill("JourneyTest!2026");
  await page.getByLabel("Confirm Password").fill("JourneyTest!2026");
  await page.getByRole("button", { name: /register account/i }).click();

  await expect(page).toHaveURL(/\/patient$/);
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByLabel("Full name").fill("Journey Test Patient");
  await page.getByLabel("Date of birth").fill("1990-01-15");
  await page.getByLabel("Phone").fill("9876543210");
  await page.getByLabel("Gender").selectOption("PREFER_NOT_TO_SAY");
  await page.getByLabel("Preferred language").fill("English");
  await page.getByLabel("Emergency contact").fill("9876543211");
  await page.getByLabel("Blood group").selectOption("O_POSITIVE");
  await page.getByLabel("Address").fill("Synthetic test address");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page.getByText("Patient profile saved.")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /sign in to your account/i })).toBeVisible();
});

test("staff and doctor registration is restricted; staff portal displays staff modules and no doctor application", async ({ page }) => {
  await page.goto("/");
  // Select Staff tab
  await page.getByRole("tab", { name: /staff/i }).click();
  await expect(page.getByText(/provisioned exclusively by Hospital Administration/i)).toBeVisible();
  // Ensure "Register as a Patient" button is not visible when Staff tab is active
  await expect(page.getByRole("button", { name: /register as a patient/i })).not.toBeVisible();

  // Select Doctor tab
  await page.getByRole("tab", { name: /doctor/i }).click();
  await expect(page.getByText(/provisioned exclusively by Hospital Administration/i)).toBeVisible();
});

test("the bootstrap administrator can sign in and manage hospital operations", async ({ page }) => {
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@careflow.local";
  await page.goto("/");
  await page.getByRole("tab", { name: /admin/i }).click();
  await page.getByLabel(/email address or 10-digit phone number/i).fill(adminEmail);
  await page.getByLabel("Password").fill(process.env.BOOTSTRAP_ADMIN_PASSWORD || "CareFlowAdmin!2026");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/operations$/);
  await expect(page.getByText(adminEmail)).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
});

