import { expect, test } from "@playwright/test";

test("homepage provides one patient and staff sign-in entry", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome to CareFlow." })).toBeVisible();
  await expect(page.getByLabel("Continue as")).toHaveValue("patient");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("a patient can register, complete a profile, and sign out", async ({ page }) => {
  const unique = `${Date.now()}-${test.info().retry}`;
  await page.goto("/");
  await page.getByLabel("Continue as").selectOption("patient-register");
  await page.getByLabel("Full name").fill("Journey Test Patient");
  await page.getByLabel("Email").fill(`journey-${unique}@careflow.test`);
  await page.getByLabel("Password", { exact: true }).fill("JourneyTest!2026");
  await page.getByLabel("Confirm password").fill("JourneyTest!2026");
  await page.getByRole("button", { name: "Create account" }).click();

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
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("a prospective staff member can create an account and start a doctor application", async ({ page }) => {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await page.goto("/");
  await page.getByLabel("Continue as").selectOption("staff-register");
  await page.getByLabel("Full name").fill("Dr Staff Applicant");
  await page.getByLabel("Email").fill(`staff-${unique}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("Staff-password-2026!");
  await page.getByLabel("Confirm password").fill("Staff-password-2026!");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/staff$/);
  await expect(page.getByRole("heading", { name: "Apply as a doctor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open account menu" })).toBeVisible();
});

test("the bootstrap administrator can open doctor approvals", async ({ page }) => {
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@careflow.local";
  await page.goto("/");
  await page.getByLabel("Continue as").selectOption("staff");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(process.env.BOOTSTRAP_ADMIN_PASSWORD || "CareFlowAdmin!2026");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/staff$/);

  await page.getByRole("button", { name: "Doctor approvals" }).click();
  await page.getByRole("button", { name: "Open account menu" }).click();
  await expect(page.getByText(adminEmail)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});
