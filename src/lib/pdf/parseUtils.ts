const MONTHS: Record<string, string> = {
  ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06",
  jul: "07", ago: "08", sep: "09", set: "09", oct: "10", nov: "11", dic: "12",
};

const AMOUNT_RE = /-?\$?\s?-?\d{1,3}(?:\.\d{3})*,\d{2}-?/g;
const DATE_NUMERIC_RE = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/;
const DATE_TEXT_RE =
  /^(\d{1,2})[\/\- ]?(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[\/\- ]?(\d{2,4})?\b/i;

export function parseArgentineAmount(raw: string): number {
  const negative = /^-/.test(raw.trim()) || /-\s*$/.test(raw.trim());
  const digits = raw.replace(/[^\d,]/g, "").replace(",", ".");
  const value = Number.parseFloat(digits);
  if (Number.isNaN(value)) return 0;
  return negative ? -Math.abs(value) : value;
}

export function findAmounts(line: string): string[] {
  return line.match(AMOUNT_RE) ?? [];
}

/** Intenta reconocer una fecha argentina al inicio de la línea, devuelve [iso, restoDeLaLinea] */
export function extractLeadingDate(
  line: string,
  defaultYear: number,
): { iso: string; rest: string } | null {
  const numeric = line.match(DATE_NUMERIC_RE);
  if (numeric) {
    const [full, d, m, yRaw] = numeric;
    const year = yRaw.length === 2 ? Number(`20${yRaw}`) : Number(yRaw);
    const day = d.padStart(2, "0");
    const month = m.padStart(2, "0");
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return {
        iso: `${year}-${month}-${day}`,
        rest: line.slice(full.length).trim(),
      };
    }
  }

  const textual = line.match(DATE_TEXT_RE);
  if (textual) {
    const [full, d, mon, yRaw] = textual;
    const month = MONTHS[mon.toLowerCase()];
    const year = yRaw ? (yRaw.length === 2 ? Number(`20${yRaw}`) : Number(yRaw)) : defaultYear;
    const day = d.padStart(2, "0");
    return {
      iso: `${year}-${month}-${day}`,
      rest: line.slice(full.length).trim(),
    };
  }

  return null;
}

export function stripAmounts(line: string): string {
  return line.replace(AMOUNT_RE, " ").replace(/\s+/g, " ").trim();
}
