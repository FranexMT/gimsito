import { test, expect } from "@playwright/test";
import { signUpAndLogin } from "./helpers";

test("redirige a /login sin sesion", async ({ page }) => {
  await page.goto("/ranking");
  await expect(page).toHaveURL(/\/login/);
});

test("crear cuenta entra al dashboard", async ({ page }) => {
  await signUpAndLogin(page);
  await expect(page.getByText("Tu nivel")).toBeVisible();
});

test("cerrar sesion vuelve a /login y bloquea rutas privadas", async ({ page }) => {
  await signUpAndLogin(page);
  await page.goto("/perfil");
  await page.click("text=Cerrar sesión");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/ranking");
  await expect(page).toHaveURL(/\/login/);
});
