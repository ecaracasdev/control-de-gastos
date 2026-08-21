export type Category =
  | "compras_tarjeta"
  | "pago_tarjeta_credito"
  | "mercado_pago"
  | "transferencias"
  | "debitos_automaticos"
  | "otros";

export type Bank = "santander" | "nacion" | "manual";

export type Currency = "ARS" | "USD";

export interface MercadoPagoDetailItem {
  id: string;
  description: string;
  amount: number;
}

export interface Transaction {
  id: string;
  /** ISO date, yyyy-MM-dd */
  date: string;
  description: string;
  /** Negative = gasto, positive = ingreso/acreditación */
  amount: number;
  currency: Currency;
  category: Category;
  bank: Bank;
  installment?: { current: number; total: number };
  mpDetails?: MercadoPagoDetailItem[];
  sourceFile?: string;
  /** Número de referencia/comprobante del banco, cuando está disponible (distingue movimientos idénticos en fecha/monto/descripción) */
  reference?: string;
  /** Saldo que reporta el banco después de este movimiento, cuando el archivo lo trae */
  balanceAfter?: number;
  notes?: string;
}

export interface CategoryMeta {
  key: Category;
  label: string;
  shortLabel: string;
  description: string;
  colorVar: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  compras_tarjeta: {
    key: "compras_tarjeta",
    label: "Compras con tarjeta",
    shortLabel: "Compras",
    description: "Consumos del día a día con tarjeta de débito o crédito en comercios",
    colorVar: "var(--series-compras-tarjeta)",
  },
  pago_tarjeta_credito: {
    key: "pago_tarjeta_credito",
    label: "Pago de tarjeta de crédito",
    shortLabel: "Pago tarjeta",
    description: "El pago del resumen de tu tarjeta de crédito (ya gastado en ciclos anteriores)",
    colorVar: "var(--series-pago-tarjeta-credito)",
  },
  mercado_pago: {
    key: "mercado_pago",
    label: "Mercado Pago",
    shortLabel: "Mercado Pago",
    description: "Plata que enviaste a tu propia cuenta de Mercado Pago",
    colorVar: "var(--series-mercado-pago)",
  },
  transferencias: {
    key: "transferencias",
    label: "Transferencias",
    shortLabel: "Transferencias",
    description: "Transferencias enviadas o recibidas de otras personas o cuentas",
    colorVar: "var(--series-transferencias)",
  },
  debitos_automaticos: {
    key: "debitos_automaticos",
    label: "Débitos automáticos",
    shortLabel: "Automáticos",
    description: "Servicios, expensas, seguros y suscripciones que se cobran solos",
    colorVar: "var(--series-debitos-automaticos)",
  },
  otros: {
    key: "otros",
    label: "Otros",
    shortLabel: "Otros",
    description: "Impuestos, intereses, extracciones y movimientos que no encajan en el resto",
    colorVar: "var(--series-otros)",
  },
};

export const CATEGORY_ORDER: Category[] = [
  "compras_tarjeta",
  "pago_tarjeta_credito",
  "mercado_pago",
  "transferencias",
  "debitos_automaticos",
  "otros",
];

export interface IncomeEntry {
  id: string;
  /** yyyy-MM, mes al que corresponde el ingreso */
  month: string;
  label: string;
  amount: number;
}

export interface ParsedTransactionDraft
  extends Omit<Transaction, "id" | "category" | "bank"> {
  category: Category;
  bank: Bank;
  confidence: "alta" | "media" | "baja";
}
