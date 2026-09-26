import { describe, expect, it } from "vitest";
import type { PdfLine } from "./extractText";
import { parseMercadoPago } from "./parseMercadoPago";

function line(text: string, y: number, page = 1): PdfLine {
  return { page, text, y };
}

describe("parseMercadoPago", () => {
  it("ignora todo antes de 'DETALLE DE MOVIMIENTOS' y arma filas con descripción en una sola línea", () => {
    const lines: PdfLine[] = [
      line("RESUMEN DE CUENTA EN PESOS", 100),
      line("Juan Pérez", 90),
      line("CVU: 000111 CUIT/ CUIL: 20111111111", 85),
      line("DETALLE DE MOVIMIENTOS", 70),
      line("ID de la", 60),
      line("Fecha Descripción Valor Saldo", 58),
      line("operación", 56),
      line("01-08-2026 Pago AUBASA 100000000001 $ -1.000,00 $ 9.000,00", 40),
    ];

    const drafts = parseMercadoPago(lines, "resumen.pdf");
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      date: "2026-08-01",
      description: "Pago AUBASA",
      amount: -1000,
      balanceAfter: 9000,
      reference: "100000000001",
      bank: "mercadopago",
      category: "transporte",
      subcategory: "peajes",
    });
  });

  it("reconstruye una descripción partida en dos líneas (antes y después de la fila)", () => {
    const lines: PdfLine[] = [
      line("DETALLE DE MOVIMIENTOS", 100),
      line("Transferencia enviada", 60),
      line("02-08-2026 100000000002 $ -500,00 $ 8.500,00", 55),
      line("Panadería Central", 50),
    ];

    const drafts = parseMercadoPago(lines, "resumen.pdf");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].description).toBe("Transferencia enviada Panadería Central");
    expect(drafts[0].category).toBe("transferencias_personas");
  });

  it("detecta movimientos internos (ingreso/salida de dinero) y rendimientos", () => {
    const lines: PdfLine[] = [
      line("DETALLE DE MOVIMIENTOS", 100),
      line("03-08-2026 Ingreso de dinero 100000000003 $ 2.000,00 $ 10.500,00", 60),
      line("03-08-2026 Rendimientos 100000000004 $ 0,05 $ 10.500,05", 40),
    ];

    const drafts = parseMercadoPago(lines, "resumen.pdf");
    expect(drafts).toHaveLength(2);
    expect(drafts[0].category).toBe("movimientos_internos");
    expect(drafts[1]).toMatchObject({ category: "otros", subcategory: "rendimientos_mp" });
  });

  it("no procesa nada después de 'RESUMEN DE TENENCIAS EN DÓLARES'", () => {
    const lines: PdfLine[] = [
      line("DETALLE DE MOVIMIENTOS", 100),
      line("04-08-2026 Pago con QR Panadería Lean 100000000005 $ -300,00 $ 10.200,00", 60),
      line("RESUMEN DE TENENCIAS EN DÓLARES", 30),
      line("05-08-2026 Rendimientos 100000000006 US$ 0,07 US$ 100,00", 20),
    ];

    const drafts = parseMercadoPago(lines, "resumen.pdf");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].description).toBe("Pago con QR Panadería Lean");
  });

  it("ignora ruido de pie de página y números de página", () => {
    const lines: PdfLine[] = [
      line("DETALLE DE MOVIMIENTOS", 100),
      line("06-08-2026 Pago EBANX S.A. 100000000007 $ -4.000,00 $ 6.200,00", 60),
      line("Fecha de generación: 26-09-2026", 30),
      line("Mercado Libre S.R.L. CUIT 30-70308853-4", 25),
      line("de consulta en: www.mercadopago.com.ar", 20),
      line("6/6", 10),
    ];

    const drafts = parseMercadoPago(lines, "resumen.pdf");
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ category: "transporte", subcategory: "apps_transporte" });
  });
});
