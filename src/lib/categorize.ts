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
}

const RULES: Rule[] = [
  {
    category: "suscripciones",
    patterns: [
      /netflix/, /spotify/, /disney/, /hbo/, /max play/, /paramount/,
      /youtube premium/, /amazon prime/, /prime video/, /icloud/,
      /google one/, /google \*storage/, /claro video/, /flow/,
      /apple\.com\/bill/, /crunchyroll/, /deezer/, /playstation plus/,
      /xbox game pass/, /canva/, /chatgpt/, /openai/,
    ],
  },
  {
    category: "consumos_automaticos",
    patterns: [
      /debito automatico/, /db automatico/, /debin/, /expensas/,
      /edenor/, /edesur/, /metrogas/, /aysa/, /telecentro/,
      /personal flow/, /movistar/, /claro pagos?/, /aguas argentinas/,
      /obra social/, /prepaga/, /osde/, /swiss medical/, /galeno/,
      /seguro/, /prevencion salud/,
    ],
  },
  {
    category: "transferencias",
    patterns: [
      /transferencia/, /\btransf\b/, /\btrf\b/, /cvu/, /\balias\b/,
      /mercadopago/, /mercado pago/, /envio de dinero/, /credito inmediato/,
    ],
  },
  {
    category: "consumo_tarjetas",
    patterns: [
      /consumo/, /compra/, /visa/, /mastercard/, /amex/, /american express/,
      /cuota \d+\/\d+/, /c\.\d+\/\d+/, /tarjeta/,
    ],
  },
];

const MERCADO_PAGO_TRANSFER_PATTERNS = [
  /mercadopago/, /mercado pago/, /\bmp\*/, /meli\b/,
];

export function categorize(description: string): Category {
  const text = normalize(description);
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(text))) {
      return rule.category;
    }
  }
  return "otros";
}

export function isMercadoPagoTransfer(description: string): boolean {
  const text = normalize(description);
  return MERCADO_PAGO_TRANSFER_PATTERNS.some((re) => re.test(text));
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
