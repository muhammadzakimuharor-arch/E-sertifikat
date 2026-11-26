/**
 * Normalizes a participant's full name into a canonical deduplication & search key.
 */
export function normalizeNamaKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Formats an integer sequence number into a certificate number using `{NO}` placeholder.
 */
export function formatCertificateNumber(
  format: string,
  seqNumber: number,
  padding: number
): string {
  const safePadding = Math.max(1, Math.min(8, Number(padding) || 3));
  const padded = String(Math.max(0, seqNumber)).padStart(safePadding, "0");
  const template = (format || "{NO}/2/PANITIA/XI/2026").trim();
  return template.includes("{NO}")
    ? template.replaceAll("{NO}", padded)
    : `${padded}/${template}`;
}

/**
 * Masks an email address for public identity confirmation (e.g. ahm***@unesa.ac.id).
 */
export function maskEmail(email: string | null | undefined): string {
  const clean = (email || "").trim();
  if (!clean || !clean.includes("@")) return "—";
  const [local, domain] = clean.split("@");
  if (!domain) return "—";
  const visible = local.slice(0, Math.min(3, Math.max(1, local.length - 1)));
  return `${visible}***@${domain}`;
}

/**
 * Masks a phone / WhatsApp number for privacy (e.g. 0812-****-7890).
 */
export function maskPhone(phone: string | null | undefined): string {
  const clean = (phone || "").replace(/\s+/g, "");
  if (!clean) return "—";
  const digits = clean.replace(/[^\d+]/g, "");
  if (digits.length < 6) return "****";
  const prefix = digits.slice(0, 4);
  const suffix = digits.slice(-4);
  return `${prefix}-****-${suffix}`;
}

/**
 * Generates clean URL slug from Indonesian titles.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTHS_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/**
 * Formats YYYY-MM-DD or ISO date into readable Indonesian date (e.g. "25 November 2026").
 */
export function formatDateIndo(
  dateStr: string | null | undefined,
  options?: { withWeekday?: boolean; shortMonth?: boolean }
): string {
  if (!dateStr) return "—";
  const datePart = dateStr.slice(0, 10);
  const parts = datePart.split("-").map(Number);
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    const [year, month, day] = parts;
    const d = new Date(Date.UTC(year, month - 1, day));
    const monthName = options?.shortMonth
      ? MONTHS_SHORT_ID[month - 1] || ""
      : MONTHS_ID[month - 1] || "";
    const base = `${day} ${monthName} ${year}`;
    if (options?.withWeekday) {
      return `${DAYS_ID[d.getUTCDay()]}, ${base}`;
    }
    return base;
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: options?.shortMonth ? "short" : "long",
    year: "numeric",
  });
}

/**
 * Formats ISO timestamp into WIB (Asia/Jakarta) Indonesian date/time.
 */
export function formatDateTimeWib(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${formatted.replace(".", ":")} WIB`;
}

export function formatTimeOnlyWib(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "—";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${formatted.replace(".", ":")} WIB`;
}

export function formatRelativeTimeIndo(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function getInitials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "VC";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function getAppUrl(originHeader?: string | null): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (originHeader) return originHeader.replace(/\/+$/, "");
  return "http://localhost:3000";
}

/**
 * Deterministic compact cryptographic-looking fingerprint from UUID + certificate number.
 */
export function buildCredentialDigest(uuid: string, certNo: string): string {
  const raw = `${uuid}:${certNo}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b) >>> 0;
  }
  const p1 = h1.toString(16).padStart(8, "0");
  const p2 = h2.toString(16).padStart(8, "0");
  const cleanUuid = uuid.replace(/-/g, "").slice(0, 16);
  return `0x${p1}${p2}${cleanUuid}`;
}
