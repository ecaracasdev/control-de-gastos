import { describe, expect, it } from "vitest";
import { migrateCategory } from "./useFinanceStore";

describe("migrateCategory", () => {
  it("mapea 1 a 1 las 6 categorías viejas a las nuevas", () => {
    expect(migrateCategory("compras_tarjeta")).toBe("compras");
    expect(migrateCategory("pago_tarjeta_credito")).toBe("pago_tarjeta_credito");
    expect(migrateCategory("mercado_pago")).toBe("movimientos_internos");
    expect(migrateCategory("transferencias")).toBe("transferencias");
    expect(migrateCategory("debitos_automaticos")).toBe("servicios_suscripciones");
    expect(migrateCategory("otros")).toBe("otros");
  });

  it("cae en otros ante una categoría desconocida", () => {
    expect(migrateCategory("categoria_inexistente")).toBe("otros");
  });
});
