import { expect, test } from "@playwright/test";

test("complete patient-doctor consultation and prescription workflow", async ({ page }) => {
  const unique = `${Date.now()}-${test.info().retry}`;

  // 1. Patient Registration & Profile Setup
  await page.goto("/");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Full Name").fill("Consultation Test Patient");
  await page.getByLabel("Email or Phone Number").fill(`consultation-patient-${unique}@careflow.test`);
  await page.getByLabel("Password", { exact: true }).fill("PatientTest!2026");
  await page.getByLabel("Confirm Password").fill("PatientTest!2026");
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page).toHaveURL(/\/patient$/, { timeout: 15000 });
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByLabel("Full name").fill("Consultation Test Patient");
  await page.getByLabel("Date of birth").fill("1992-05-20");
  await page.getByLabel("Phone").fill("9876543299");
  await page.getByLabel("Gender").selectOption("FEMALE");
  await page.getByLabel("Preferred language").fill("English");
  await page.getByLabel("Emergency contact").fill("9876543298");
  await page.getByLabel("Blood group").selectOption("B_POSITIVE");
  await page.getByLabel("Address").fill("123 Clinical Way");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Patient profile saved.")).toBeVisible();

  // Sign out patient
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
});
