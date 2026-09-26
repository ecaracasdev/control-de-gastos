import { test, expect } from "@playwright/test";
import { buildFakeStatementXlsx } from "./fixtures/fakeStatement";

test("importar un extracto, revisarlo, guardarlo y ver el dashboard actualizado", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");

  await page.getByRole("button", { name: "Cargar documento" }).click();
  await page.getByRole("button", { name: "Elegir archivo" }).click();

  const buffer = await buildFakeStatementXlsx();
  await page.locator('input[type="file"]').setInputFiles({
    name: "extracto-fake.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  });

  await expect(page.getByText("Revisá los movimientos antes de guardar")).toBeVisible();

  await page.getByRole("button", { name: /Guardar \d+ movimientos/ }).click();

  await expect(page.getByText("Importación completa")).toBeVisible();
  await page.getByRole("button", { name: "Ir al panel" }).click();

  // Números del extracto fake (independientes de cómo se llamen las
  // categorías): ingreso = Sueldo 150.000; gasto = 3.000+4.500+25.000+30.000;
  // transferencias neto = -10.000 (Transferencia enviada Juan Perez).
  await expect(page.getByText("$ 150.000,00")).toBeVisible();
  await expect(page.getByText("$ 62.500,00").first()).toBeVisible();
  await expect(page.getByText("-$ 10.000,00")).toBeVisible();
  await expect(page.getByText("Distribución de gastos por categoría")).toBeVisible();

  // Taxonomía nueva (categorías/subcategorías): Farmacia Sepia -> Salud,
  // Netflix -> Servicios y suscripciones, Supermercado Coto -> Comida.
  await expect(page.getByText("Salud").first()).toBeVisible();
  await expect(page.getByText("Servicios y suscripciones").first()).toBeVisible();
  await expect(page.getByText("Comida").first()).toBeVisible();

  expect(errors, `Errores de consola: ${errors.join("\n")}`).toEqual([]);
});
