import { describe, expect, it } from "vitest";
import { parseArgentineAmount } from "./parseUtils";

describe("parseArgentineAmount", () => {
  it("detecta un negativo con el signo antes del símbolo de moneda", () => {
    expect(parseArgentineAmount("-$ 1.000,00")).toBe(-1000);
  });

  it("detecta un negativo con el signo después del símbolo de moneda (formato Mercado Pago)", () => {
    expect(parseArgentineAmount("$ -1.000,00")).toBe(-1000);
  });

  it("detecta un negativo con el signo al final", () => {
    expect(parseArgentineAmount("1.000,00-")).toBe(-1000);
  });

  it("un monto positivo no lleva signo", () => {
    expect(parseArgentineAmount("$ 1.000,00")).toBe(1000);
  });
});
