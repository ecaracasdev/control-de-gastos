export type Category =
  | "comida"
  | "transporte"
  | "salud"
  | "servicios_suscripciones"
  | "compras"
  | "transferencias_personas"
  | "pago_tarjeta_credito"
  | "otros"
  | "movimientos_internos"
  | "transferencias";

export type Bank = "santander" | "nacion" | "manual" | "mercadopago";

export type Currency = "ARS" | "USD";

export type Subcategory =
  | "delivery"
  | "restaurantes_qr"
  | "supermercado"
  | "peajes"
  | "combustible"
  | "apps_transporte"
  | "farmacia"
  | "obra_social"
  | "medicos"
  | "streaming"
  | "software"
  | "servicios_hogar"
  | "seguros"
  | "impuestos"
  | "rendimientos_mp";

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
  subcategory?: Subcategory;
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
  subcategories: Subcategory[];
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  comida: {
    key: "comida",
    label: "Comida",
    shortLabel: "Comida",
    description: "Delivery, supermercado y restaurantes o pagos con QR en el momento",
    colorVar: "var(--series-comida)",
    subcategories: ["delivery", "restaurantes_qr", "supermercado"],
  },
  transporte: {
    key: "transporte",
    label: "Transporte",
    shortLabel: "Transporte",
    description: "Peajes, combustible y apps de transporte",
    colorVar: "var(--series-transporte)",
    subcategories: ["peajes", "combustible", "apps_transporte"],
  },
  salud: {
    key: "salud",
    label: "Salud",
    shortLabel: "Salud",
    description: "Farmacia, obra social o prepaga y médicos",
    colorVar: "var(--series-salud)",
    subcategories: ["farmacia", "obra_social", "medicos"],
  },
  servicios_suscripciones: {
    key: "servicios_suscripciones",
    label: "Servicios y suscripciones",
    shortLabel: "Servicios",
    description: "Streaming, software, servicios del hogar y seguros que se cobran solos",
    colorVar: "var(--series-servicios-suscripciones)",
    subcategories: ["streaming", "software", "servicios_hogar", "seguros"],
  },
  compras: {
    key: "compras",
    label: "Compras",
    shortLabel: "Compras",
    description: "Consumos del día a día con tarjeta de débito o crédito en comercios",
    colorVar: "var(--series-compras)",
    subcategories: [],
  },
  transferencias_personas: {
    key: "transferencias_personas",
    label: "Transferencias a personas",
    shortLabel: "A personas",
    description: "Plata enviada o recibida de otras personas (salidas grupales, juntadas), no a comercios",
    colorVar: "var(--series-transferencias-personas)",
    subcategories: [],
  },
  pago_tarjeta_credito: {
    key: "pago_tarjeta_credito",
    label: "Pago de tarjeta de crédito",
    shortLabel: "Pago tarjeta",
    description: "El pago del resumen de tu tarjeta de crédito (ya gastado en ciclos anteriores)",
    colorVar: "var(--series-pago-tarjeta-credito)",
    subcategories: [],
  },
  otros: {
    key: "otros",
    label: "Otros",
    shortLabel: "Otros",
    description: "Impuestos, rendimientos de Mercado Pago y movimientos que no encajan en el resto",
    colorVar: "var(--series-otros)",
    subcategories: ["impuestos", "rendimientos_mp"],
  },
  movimientos_internos: {
    key: "movimientos_internos",
    label: "Movimientos internos",
    shortLabel: "Mov. internos",
    description: "Plata moviéndose entre tus propias cuentas (banco y Mercado Pago), no es consumo",
    colorVar: "var(--series-movimientos-internos)",
    subcategories: [],
  },
  transferencias: {
    key: "transferencias",
    label: "Transferencias",
    shortLabel: "Transferencias",
    description: "Transferencias bancarias enviadas o recibidas de otras personas o cuentas",
    colorVar: "var(--series-transferencias)",
    subcategories: [],
  },
};

export const CATEGORY_ORDER: Category[] = [
  "compras",
  "comida",
  "transporte",
  "salud",
  "servicios_suscripciones",
  "pago_tarjeta_credito",
  "transferencias_personas",
  "otros",
  "movimientos_internos",
  "transferencias",
];

export interface SubcategoryMeta {
  key: Subcategory;
  label: string;
}

export const SUBCATEGORY_META: Record<Subcategory, SubcategoryMeta> = {
  delivery: { key: "delivery", label: "Delivery" },
  restaurantes_qr: { key: "restaurantes_qr", label: "Restaurantes / en el momento" },
  supermercado: { key: "supermercado", label: "Supermercado" },
  peajes: { key: "peajes", label: "Peajes" },
  combustible: { key: "combustible", label: "Combustible" },
  apps_transporte: { key: "apps_transporte", label: "Apps de transporte" },
  farmacia: { key: "farmacia", label: "Farmacia" },
  obra_social: { key: "obra_social", label: "Obra social / prepaga" },
  medicos: { key: "medicos", label: "Médicos" },
  streaming: { key: "streaming", label: "Streaming" },
  software: { key: "software", label: "Software" },
  servicios_hogar: { key: "servicios_hogar", label: "Servicios del hogar" },
  seguros: { key: "seguros", label: "Seguros" },
  impuestos: { key: "impuestos", label: "Impuestos" },
  rendimientos_mp: { key: "rendimientos_mp", label: "Rendimientos de Mercado Pago" },
};

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
