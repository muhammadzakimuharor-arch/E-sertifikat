export type AttendanceMode = "strict" | "open";

export type TextAlign = "left" | "center" | "right";

export type FontFamilyOption =
  | "Plus Jakarta Sans"
  | "JetBrains Mono"
  | "Georgia"
  | "Times New Roman";

export interface TextLayerConfig {
  xPct: number;
  yPct: number;
  fontSize: number;
  fontFamily: FontFamilyOption | string;
  fontWeight: "400" | "500" | "600" | "700" | "800";
  color: string;
  align: TextAlign;
  maxWidthPct: number;
  uppercase: boolean;
  visible: boolean;
}

export interface QrLayerConfig {
  xPct: number;
  yPct: number;
  sizePct: number;
  visible: boolean;
}

export interface LayoutConfig {
  name: TextLayerConfig;
  certNumber: TextLayerConfig;
  role: TextLayerConfig;
  qr: QrLayerConfig;
}

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  event_date: string;
  speaker: string;
  cert_number_format: string;
  start_number: number;
  last_number: number;
  number_padding: number;
  attendance_mode: AttendanceMode;
  is_attendance_open: number;
  is_download_open: number;
  template_url: string;
  layout_config: string;
  created_at: string;
  updated_at: string;
}

export interface EventWithStats extends EventRecord {
  total_participants: number;
  attended_count: number;
}

export interface ParticipantRecord {
  id: string;
  event_id: string;
  uuid_qr: string | null;
  nama_asli: string;
  nama_key: string;
  instansi: string;
  email: string;
  phone: string;
  role: string;
  is_attended: number;
  attended_at: string | null;
  nomor_sertifikat: string | null;
  created_at: string;
}

export interface VerificationLogRecord {
  id: string;
  queried_code: string;
  method: "qr" | "manual";
  status: "valid" | "invalid";
  participant_id: string | null;
  participant_name: string | null;
  event_title: string | null;
  cert_number: string | null;
  checked_at: string;
}

export interface SiteSettings {
  org_name: string;
  default_organizer: string;
  contact_email: string;
  logo_url: string;
  verification_footer: string;
}
