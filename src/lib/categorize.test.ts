import { describe, expect, it } from "vitest";
import { categorize, detectInstallment } from "./categorize";

describe("categorize", () => {
  it("detecta transferencia a Mercado Pago", () => {
    expect(categorize("Transferencia MERCADOPAGO")).toBe("mercado_pago");
  });

  it("no confunde una transferencia recibida vía Mercado Pago con un envío propio", () => {
    expect(categorize("Transferencia recibida MERCADOPAGO")).toBe("transferencias");
  });

  it("detecta pago de tarjeta de crédito", () => {
    expect(categorize("Pago tarjeta de credito Visa")).toBe("pago_tarjeta_credito");
  });

  it("cae en otros cuando no matchea ninguna regla", () => {
    expect(categorize("XYZ sin sentido 123")).toBe("otros");
  });
});

describe("detectInstallment", () => {
  it("detecta una cuota n/total", () => {
    expect(detectInstallment("Compra Cuota 3/12")).toEqual({ current: 3, total: 12 });
  });

  it("no confunde una fecha completa con una cuota", () => {
    expect(detectInstallment("Pago del 07/08/2026")).toBeUndefined();
  });
});
