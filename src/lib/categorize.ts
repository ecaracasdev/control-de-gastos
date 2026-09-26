import type { Bank, Category, Subcategory } from "../types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

interface Rule {
  category: Category;
  subcategory?: Subcategory;
  patterns: RegExp[];
  /** si matchea alguno de estos, se descarta esta regla aunque matchee un pattern */
  exclude?: RegExp[];
  /** si está presente, la regla solo aplica cuando el movimiento viene de ese banco/fuente */
  onlyWhenBank?: Bank;
}

// El orden importa: se evalúa de arriba hacia abajo y gana el primer match.
// Reglas más específicas van antes que las genéricas para no perderse dentro
// de ellas.
const RULES: Rule[] = [
  {
    // Plata que vos mandás a tu propia cuenta de Mercado Pago, o el ida y
    // vuelta entre tu cuenta de MP y tu banco ("Ingreso/Salida de dinero" en
    // el resumen de MP). Distinto de "Merpago*comercio" (una compra procesada
    // por Mercado Pago en un local, que va a "compras") y de una transferencia
    // RECIBIDA de otra persona a través de Mercado Pago (que va a
    // "transferencias").
    category: "movimientos_internos",
    patterns: [/mercadopago/, /mercado pago/, /^ingreso de dinero$/, /^salida de dinero$/],
    exclude: [/recibid/],
  },
  {
    // El pago del resumen de la tarjeta de crédito: una cuota "en bloque" de
    // gastos ya hechos en ciclos anteriores, no un consumo nuevo.
    category: "pago_tarjeta_credito",
    patterns: [
      /pago tarjeta/, /pago de tarjeta/, /pago.*tarjeta de credito/,
      /resumen tarjeta/, /liquidacion tarjeta/,
    ],
  },
  {
    category: "salud",
    subcategory: "farmacia",
    patterns: [/farmacia/],
  },
  {
    category: "salud",
    subcategory: "obra_social",
    patterns: [/obra social/, /prepaga/, /osde/, /swiss medical/, /galeno/, /prevencion salud/],
  },
  {
    category: "transporte",
    subcategory: "peajes",
    patterns: [/aubasa/, /peaje/, /autopista/],
  },
  {
    // EBANX es un gateway de pagos genérico; en la cuenta de este usuario
    // procesa específicamente los cobros de Uber.
    category: "transporte",
    subcategory: "apps_transporte",
    patterns: [/ebanx/, /\buber\b/, /cabify/, /\bdidi\b/],
  },
  {
    category: "transporte",
    subcategory: "combustible",
    patterns: [/\bypf\b/, /\bshell\b/, /\baxion\b/, /puma energy/, /combustible/],
  },
  {
    category: "comida",
    subcategory: "delivery",
    patterns: [/pedidosya/, /dlo\*/, /\brappi\b/],
  },
  {
    category: "comida",
    subcategory: "supermercado",
    patterns: [/supermercado/, /\bcarrefour\b/, /\bcoto\b/, /\bjumbo\b/, /\bdisco\b/, /\bdia\b/, /\bvea\b/],
  },
  {
    // Pagos con QR en el momento (comercio físico): se chequea después de
    // farmacia/peajes/delivery para no comerse esos casos más específicos.
    category: "comida",
    subcategory: "restaurantes_qr",
    patterns: [/pago con qr/],
  },
  {
    category: "servicios_suscripciones",
    subcategory: "streaming",
    patterns: [
      /netflix/, /spotify/, /disney/, /hbo/, /max play/, /paramount/,
      /youtube premium/, /amazon prime/, /prime video/, /claro video/, /flow/,
      /crunchyroll/, /deezer/, /playstation plus/, /xbox game pass/,
    ],
  },
  {
    category: "servicios_suscripciones",
    subcategory: "software",
    patterns: [/icloud/, /google one/, /google \*storage/, /apple\.com\/bill/, /canva/, /chatgpt/, /openai/],
  },
  {
    category: "servicios_suscripciones",
    subcategory: "servicios_hogar",
    patterns: [
      /debito automatico/, /db automatico/, /debin/, /expensas/,
      /edenor/, /edesur/, /metrogas/, /aysa/, /telecentro/,
      /personal flow/, /movistar/, /claro pagos?/, /aguas argentinas/,
    ],
  },
  {
    category: "servicios_suscripciones",
    subcategory: "seguros",
    patterns: [/seguro/],
  },
  {
    // Consumos del día a día con tarjeta de débito o crédito en comercios,
    // cuando no matcheó nada más específico arriba.
    category: "compras",
    patterns: [
      /consumo/, /compra/, /visa/, /mastercard/, /amex/, /american express/,
      /cuota \d+\/\d+/, /c\.\d+\/\d+/, /tarjeta/,
    ],
  },
  {
    // Transferencias a personas dentro de Mercado Pago: ahí sí son gasto
    // real (salidas grupales, juntadas). En el banco, la misma palabra
    // "transferencia" cae en la regla genérica de abajo, que no es gasto.
    category: "transferencias_personas",
    patterns: [/transferencia enviada/, /transferencia recibida/],
    onlyWhenBank: "mercadopago",
  },
  {
    category: "transferencias",
    patterns: [
      /transferencia/, /\btransf\b/, /\btrf\b/, /cvu/, /\balias\b/,
      /credito inmediato/,
    ],
  },
  {
    category: "otros",
    subcategory: "rendimientos_mp",
    patterns: [/rendimiento/],
  },
  {
    category: "otros",
    subcategory: "impuestos",
    patterns: [/impuesto/, /\biva\b/, /percepcion/],
  },
];

export function categorize(
  description: string,
  bank: Bank,
): { category: Category; subcategory?: Subcategory } {
  const text = normalize(description);
  for (const rule of RULES) {
    if (rule.onlyWhenBank && rule.onlyWhenBank !== bank) continue;
    if (rule.exclude?.some((re) => re.test(text))) continue;
    if (rule.patterns.some((re) => re.test(text))) {
      return { category: rule.category, subcategory: rule.subcategory };
    }
  }
  return { category: "otros" };
}

export function detectInstallment(
  description: string,
): { current: number; total: number } | undefined {
  // Se descartan primero las fechas completas dd/mm/aa(aa) para no confundir
  // "07/08/2026" o "31/07/26" con una cuota — una cuota real es solo "n/total".
  const withoutFullDates = description.replace(/\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4}/g, " ");
  const match = withoutFullDates.match(/(\d{1,2})\s*\/\s*(\d{1,2})\b/);
  if (!match) return undefined;
  const current = Number(match[1]);
  const total = Number(match[2]);
  if (current > total || total > 60 || total === 0) return undefined;
  return { current, total };
}
