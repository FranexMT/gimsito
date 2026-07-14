import type { Page } from "@playwright/test";

/** Crea una cuenta nueva contra el Supabase real configurado en .env.local
 * y espera a que la app redirija al dashboard autenticado. Requiere que
 * "Confirm email" este desactivado en el proyecto de Supabase (ver README). */
export async function signUpAndLogin(page: Page): Promise<string> {
  const email = `e2e.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@gmail.com`;
  const password = "ClaveSegura123!";

  await page.goto("/login");
  await page.click("text=¿No tienes cuenta? Crear una");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });

  return email;
}
