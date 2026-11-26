import type { LayoutConfig } from "./types";

export const CERT_CANVAS_WIDTH = 2000;
export const CERT_CANVAS_HEIGHT = 1414;

export const DEFAULT_TEMPLATE_URL = "/templates/default-certificate.svg";
export const SECONDARY_TEMPLATE_URL = "/templates/default-certificate-2.svg";

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  name: {
    xPct: 50,
    yPct: 47.5,
    fontSize: 64,
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    color: "#0F172A",
    align: "center",
    maxWidthPct: 76,
    uppercase: false,
    visible: true,
  },
  certNumber: {
    xPct: 50,
    yPct: 28,
    fontSize: 28,
    fontFamily: "JetBrains Mono",
    fontWeight: "600",
    color: "#0284C7",
    align: "center",
    maxWidthPct: 60,
    uppercase: false,
    visible: true,
  },
  role: {
    xPct: 50,
    yPct: 56.5,
    fontSize: 30,
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    color: "#0284C7",
    align: "center",
    maxWidthPct: 50,
    uppercase: false,
    visible: true,
  },
  qr: {
    xPct: 85.75,
    yPct: 79.2,
    sizePct: 10.5,
    visible: true,
  },
};

export const AVAILABLE_FONTS = [
  // Populer di Canva untuk Sertifikat & Judul
  { label: "Bricolage Grotesque (Modern Display)", value: "Bricolage Grotesque", category: "sans" },
  { label: "Plus Jakarta Sans (Clean Modern)", value: "Plus Jakarta Sans", category: "sans" },
  { label: "Montserrat (Geometric Sans)", value: "Montserrat", category: "sans" },
  { label: "Poppins (Rounded Clean)", value: "Poppins", category: "sans" },
  { label: "Inter (Neutral Tech)", value: "Inter", category: "sans" },
  { label: "Cinzel (Classic Roman / Sertifikat)", value: "Cinzel", category: "serif" },
  { label: "Playfair Display (Luxury Serif)", value: "Playfair Display", category: "serif" },
  { label: "Cormorant Garamond (Formal Formal)", value: "Cormorant Garamond", category: "serif" },
  { label: "Merriweather (Elegant Serif)", value: "Merriweather", category: "serif" },
  { label: "Lora (Contemporary Serif)", value: "Lora", category: "serif" },
  { label: "Great Vibes (Script / Kaligrafi Elegan)", value: "Great Vibes", category: "script" },
  { label: "Alex Brush (Script Halus)", value: "Alex Brush", category: "script" },
  { label: "JetBrains Mono (Monospace / No. Reg)", value: "JetBrains Mono", category: "mono" },
  { label: "Roboto (Standar)", value: "Roboto", category: "sans" },
  { label: "Georgia (Serif Klasik)", value: "Georgia", category: "serif" },
  { label: "Times New Roman", value: "Times New Roman", category: "serif" },
] as const;

export function parseLayoutConfig(raw?: string | null): LayoutConfig {
  if (!raw) return structuredClone(DEFAULT_LAYOUT_CONFIG);
  try {
    const parsed = JSON.parse(raw) as Partial<LayoutConfig>;
    return {
      name: { ...DEFAULT_LAYOUT_CONFIG.name, ...(parsed.name || {}) },
      certNumber: {
        ...DEFAULT_LAYOUT_CONFIG.certNumber,
        ...(parsed.certNumber || {}),
      },
      role: { ...DEFAULT_LAYOUT_CONFIG.role, ...(parsed.role || {}) },
      qr: { ...DEFAULT_LAYOUT_CONFIG.qr, ...(parsed.qr || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_LAYOUT_CONFIG);
  }
}

export function serializeLayoutConfig(config: LayoutConfig): string {
  return JSON.stringify(config);
}
