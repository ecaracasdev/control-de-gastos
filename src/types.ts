export type Category =
  | "suscripciones"
  | "consumos_automaticos"
  | "transferencias"
  | "consumo_tarjetas"
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
  isMercadoPagoTransfer?: boolean;
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
  suscripciones: {
    key: "suscripciones",
    label: "Suscripciones",
    shortLabel: "Suscripciones",
    description: "Streaming, software y otros servicios pagos recurrentes",
    colorVar: "var(--series-suscripciones)",
  },
  consumos_automaticos: {
    key: "consumos_automaticos",
    label: "Consumos automáticos",
    shortLabel: "Automáticos",
    description: "Débitos automáticos: servicios, expensas, telefonía",
    colorVar: "var(--series-automaticos)",
  },
  transferencias: {
    key: "transferencias",
    label: "Transferencias",
    shortLabel: "Transferencias",
    description: "Transferencias enviadas, incluyendo cargas a Mercado Pago",
    colorVar: "var(--series-transferencias)",
  },
  consumo_tarjetas: {
    key: "consumo_tarjetas",
    label: "Consumo de tarjetas",
    shortLabel: "Tarjetas",
    description: "Compras con tarjeta de débito o crédito, incluidas cuotas",
    colorVar: "var(--series-tarjetas)",
  },
  otros: {
    key: "otros",
    label: "Otros",
    shortLabel: "Otros",
    description: "Movimientos que no encajan en el resto de las categorías",
    colorVar: "var(--series-otros)",
  },
};

export const CATEGORY_ORDER: Category[] = [
  "suscripciones",
  "consumos_automaticos",
  "transferencias",
  "consumo_tarjetas",
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
