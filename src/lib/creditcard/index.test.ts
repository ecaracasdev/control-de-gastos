import { describe, expect, it } from "vitest";
import type { XlsxRow } from "../excel/parseXlsx";
import { parseCreditCardRows } from "./index";

function row(cells: Record<string, string>): XlsxRow {
  return { cells };
}

describe("parseCreditCardRows", () => {
  it("arma un resumen con pago vinculable, consumos en ARS y USD, y subtotal", () => {
    const rows: XlsxRow[] = [
      row({ A: "Fecha de cierre" }),
      row({ A: "15/09/2026" }),
      row({ A: "Pago de tarjeta y devoluciones" }),
      row({ A: "10/08/2026", B: "Pago tarjeta de credito", E: "$50.000,00" }),
      row({ A: "Tarjeta de Juan Perez - Visa terminada en 1234" }),
      row({ A: "Fecha", B: "Descripción" }),
      row({ A: "12/08/2026", B: "Super Mercado", C: "1 de 3", D: "REF123", E: "$1.234,56" }),
      row({ A: "14/08/2026", B: "Compra USD", F: "U$S10,00" }),
      row({ A: "Subtotal de Visa", E: "$1.234,56", F: "U$S10,00" }),
    ];

    const statements = parseCreditCardRows(rows, "consumos.xlsx");
    expect(statements).toHaveLength(1);

    const s = statements[0];
    expect(s.cardLabel).toBe("Visa terminada en 1234");
    expect(s.cardLast4).toBe("1234");
    expect(s.closingDate).toBe("2026-09-15");
    expect(s.paymentAmount).toBe(50000);
    expect(s.totalConsumedArs).toBe(1234.56);
    expect(s.totalConsumedUsd).toBe(10);
    expect(s.sourceFile).toBe("consumos.xlsx");

    expect(s.items).toHaveLength(2);
    expect(s.items[0]).toMatchObject({
      date: "2026-08-12",
      description: "Super Mercado",
      amount: -1234.56,
      currency: "ARS",
      installment: { current: 1, total: 3 },
      reference: "REF123",
    });
    expect(s.items[1]).toMatchObject({
      date: "2026-08-14",
      description: "Compra USD",
      amount: -10,
      currency: "USD",
    });
  });

  it("separa varias tarjetas en resúmenes distintos", () => {
    const rows: XlsxRow[] = [
      row({ A: "Tarjeta de Juan Perez - Visa terminada en 1111" }),
      row({ A: "11/08/2026", B: "Consumo Visa", E: "$100,00" }),
      row({ A: "Subtotal de Visa", E: "$100,00" }),
      row({ A: "Tarjeta de Juan Perez - Mastercard terminada en 2222" }),
      row({ A: "12/08/2026", B: "Consumo Master", E: "$200,00" }),
      row({ A: "Subtotal de Mastercard", E: "$200,00" }),
    ];

    const statements = parseCreditCardRows(rows, "consumos.xlsx");
    expect(statements).toHaveLength(2);
    expect(statements[0].cardLast4).toBe("1111");
    expect(statements[0].items).toHaveLength(1);
    expect(statements[1].cardLast4).toBe("2222");
    expect(statements[1].items).toHaveLength(1);
  });
});
