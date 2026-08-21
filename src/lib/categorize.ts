import type { Category } from "../types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

interface Rule {
  category: Category;
  patterns: RegExp[];
  /** si matchea alguno de estos, se descarta esta regla aunque matchee un pattern */
  exclude?: RegExp[];
}

// El orden importa: se evalúa de arriba hacia abajo y gana el primer match.
// Reglas más específicas (Mercado Pago, pago de tarjeta) van antes que las
// genéricas (compras con tarjeta, transferencias) para no perderse dentro
// de ellas.
const RULES: Rule[] = [
  {
    // Plata que vos mandás a tu propia cuenta de Mercado Pago. Distinto de
    // "Merpago*comercio" (una compra procesada por Mercado Pago en un local,
    // que va a "compras con tarjeta") y de una transferencia RECIBIDA de
    // otra persona a través de Mercado Pago (que va a "transferencias").
    category: "mercado_pago",
    patterns: [/mercadopago/, /mercado pago/],
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
    category: "debitos_automaticos",
    patterns: [
      /debito automatico/, /db automatico/, /debin/, /expensas/,
      /edenor/, /edesur/, /metrogas/, /aysa/, /telecentro/,
      /personal flow/, /movistar/, /claro pagos?/, /aguas argentinas/,
      /obra social/, /prepaga/, /osde/, /swiss medical/, /galeno/,
      /seguro/, /prevencion salud/,
      // suscripciones y servicios pagos recurrentes
      /netflix/, /spotify/, /disney/, /hbo/, /max play/, /paramount/,
      /youtube premium/, /amazon prime/, /prime video/, /icloud/,
      /google one/, /google \*storage/, /claro video/, /flow/,
      /apple\.com\/bill/, /crunchyroll/, /deezer/, /playstation plus/,
      /xbox game pass/, /canva/, /chatgpt/, /openai/,
    ],
  },
  {
    // Consumos del día a día con tarjeta de débito o crédito en comercios,
    // incluidos los procesados por Mercado Pago como medio de cobro ("Merpago*").
    category: "compras_tarjeta",
    patterns: [
      /consumo/, /compra/, /visa/, /mastercard/, /amex/, /american express/,
      /cuota \d+\/\d+/, /c\.\d+\/\d+/, /tarjeta/,
    ],
  },
  {
    category: "transferencias",
    patterns: [
      /transferencia/, /\btransf\b/, /\btrf\b/, /cvu/, /\balias\b/,
      /credito inmediato/,
    ],
  },
];

export function categorize(description: string): Category {
  const text = normalize(description);
  for (const rule of RULES) {
    if (rule.exclude?.some((re) => re.test(text))) continue;
    if (rule.patterns.some((re) => re.test(text))) {
      return rule.category;
    }
  }
  return "otros";
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
