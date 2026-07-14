import { test, expect } from "@playwright/test";
import { signUpAndLogin } from "./helpers";

const BENCH_PRESS_ID = "0025"; // barbell bench press

test("registrar, editar y borrar una serie", async ({ page }) => {
  await signUpAndLogin(page);

  await page.goto(`/ejercicios/${BENCH_PRESS_ID}`);
  await page.fill('input[placeholder="0"]', "100");
  await page.locator('label:has-text("Repeticiones") input').fill("5");
  await page.click('button:has-text("Guardar serie")');
  await expect(page.getByText("100kg × 5")).toBeVisible();

  // Editar
  await page.click("text=Editar >> nth=0");
  await page.locator('label:has-text("Repeticiones") input').fill("6");
  await page.click('button:has-text("Guardar cambios")');
  await expect(page.getByText("100kg × 6")).toBeVisible();

  // Borrar (confirmacion en dos toques)
  await page.click("text=Borrar >> nth=0");
  await page.click("text=¿Seguro? >> nth=0");
  await expect(page.getByText("100kg × 6")).toHaveCount(0);
});

test("registrar una serie desbloquea el logro de primer registro", async ({ page }) => {
  await signUpAndLogin(page);

  await page.goto(`/ejercicios/${BENCH_PRESS_ID}`);
  await page.fill('input[placeholder="0"]', "60");
  await page.locator('label:has-text("Repeticiones") input').fill("10");
  await page.click('button:has-text("Guardar serie")');
  await page.waitForTimeout(1000);

  await page.goto("/perfil");
  await expect(page.getByText(/^[1-9][0-9]*\/18 logros desbloqueados$/)).toBeVisible();
});
