import { describe, expect, it } from "vitest";
import { categorize, detectInstallment } from "./categorize";

describe("categorize", () => {
  it("detecta un pase a la propia cuenta de Mercado Pago como movimiento interno", () => {
    expect(categorize("Transferencia MERCADOPAGO", "santander").category).toBe("movimientos_internos");
  });

  it("no confunde una transferencia recibida vía Mercado Pago con un envío propio", () => {
    expect(categorize("Transferencia recibida MERCADOPAGO", "santander").category).toBe("transferencias");
  });

  it("detecta pago de tarjeta de crédito", () => {
    expect(categorize("Pago tarjeta de credito Visa", "santander").category).toBe("pago_tarjeta_credito");
  });

  it("detecta farmacia como salud, no como comida, aun viniendo de un pago con QR", () => {
    const r = categorize("Pago con QR Farmacia Sepia", "mercadopago");
    expect(r).toEqual({ category: "salud", subcategory: "farmacia", confidence: "alta" });
  });

  it("detecta un pago con QR genérico como comida/restaurantes, con confianza media (es un catch-all)", () => {
    const r = categorize("Pago con QR Panadería Lean", "mercadopago");
    expect(r).toEqual({ category: "comida", subcategory: "restaurantes_qr", confidence: "media" });
  });

  it("detecta peajes de AUBASA como transporte", () => {
    const r = categorize("Pago AUBASA", "mercadopago");
    expect(r).toEqual({ category: "transporte", subcategory: "peajes", confidence: "alta" });
  });

  it("detecta EBANX como Uber (transporte/apps_transporte), con confianza media (gateway genérico)", () => {
    const r = categorize("Pago EBANX S.A.", "mercadopago");
    expect(r).toEqual({ category: "transporte", subcategory: "apps_transporte", confidence: "media" });
  });

  it("detecta delivery de PedidosYa como comida", () => {
    const r = categorize("Pago Dlo*pedidosya market", "mercadopago");
    expect(r).toEqual({ category: "comida", subcategory: "delivery", confidence: "alta" });
  });

  it("una transferencia a una persona en Mercado Pago cuenta como gasto real", () => {
    const r = categorize("Transferencia enviada Janetsi Yamilet Caro Ramirez", "mercadopago");
    expect(r.category).toBe("transferencias_personas");
  });

  it("la misma frase en el banco (no Mercado Pago) sigue siendo transferencia excluida del gasto", () => {
    const r = categorize("Transferencia enviada a Juan Perez", "santander");
    expect(r.category).toBe("transferencias");
  });

  it("cae en otros cuando no matchea ninguna regla", () => {
    expect(categorize("XYZ sin sentido 123", "santander").category).toBe("otros");
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
