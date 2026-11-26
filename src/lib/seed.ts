import type { Client } from "@libsql/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_TEMPLATE_URL,
  SECONDARY_TEMPLATE_URL,
  serializeLayoutConfig,
} from "./certificate-layout";
import { normalizeNamaKey } from "./utils";

/**
 * Seeds default Admin credentials, site settings, and 2 realistic Indonesian webinar events
 * if the database is empty.
 */
export async function seedInitialData(db: Client): Promise<void> {
  const adminCountRes = await db.execute("SELECT COUNT(*) as cnt FROM admins");
  const adminCount = Number(adminCountRes.rows[0]?.cnt ?? 0);

  const now = new Date();
  const nowIso = now.toISOString();

  if (adminCount === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.execute({
      sql: `INSERT INTO admins (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [
        "admin-root-01",
        "Admin Utama",
        "admin@vericert.id",
        passwordHash,
        nowIso,
      ],
    });
  }

  const defaultSettings: Record<string, string> = {
    org_name: "Direktorat Inovasi & Pendidikan Digital",
    default_organizer: "Panitia Pelaksana Webinar Nasional",
    contact_email: "admin@vericert.id",
    logo_url: "",
    verification_footer:
      "VeriCert Official Credential Authority • Terlindungi Kriptografi SHA-256",
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)`,
      args: [key, value],
    });
  }

  const eventCountRes = await db.execute("SELECT COUNT(*) as cnt FROM events");
  const eventCount = Number(eventCountRes.rows[0]?.cnt ?? 0);
  if (eventCount > 0) return;

  const event1Id = "evt-webinar-ai-2026";
  const event2Id = "evt-workshop-uiux-2026";
  const layoutJson = serializeLayoutConfig(DEFAULT_LAYOUT_CONFIG);

  await db.execute({
    sql: `INSERT INTO events (
      id, slug, title, organizer, event_date, speaker,
      cert_number_format, start_number, last_number, number_padding,
      attendance_mode, is_attendance_open, is_download_open,
      template_url, layout_config, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      event1Id,
      "webinar-ai-2026",
      "Webinar Nasional Transformasi Digital & AI 2026",
      "Ditjen Dikti & Kemkominfo",
      "2026-11-25",
      "Dr. Raditya Pratama, M.Sc.",
      "{NO}/2/PANITIA/XI/2026",
      1,
      4,
      3,
      "strict",
      1,
      1,
      DEFAULT_TEMPLATE_URL,
      layoutJson,
      nowIso,
      nowIso,
    ],
  });

  await db.execute({
    sql: `INSERT INTO events (
      id, slug, title, organizer, event_date, speaker,
      cert_number_format, start_number, last_number, number_padding,
      attendance_mode, is_attendance_open, is_download_open,
      template_url, layout_config, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      event2Id,
      "workshop-uiux-2026",
      "Workshop UI/UX Design Modern untuk Pemula",
      "Komunitas Desain Produk ID",
      "2026-12-12",
      "Sarah Salsabila, B.Des.",
      "{NO}/WS-UIUX/XII/2026",
      1,
      2,
      3,
      "open",
      1,
      1,
      SECONDARY_TEMPLATE_URL,
      layoutJson,
      nowIso,
      nowIso,
    ],
  });

  const hoursAgo = (h: number) =>
    new Date(now.getTime() - h * 3600 * 1000).toISOString();
  const daysAgo = (d: number) =>
    new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();

  const sampleParticipants = [
    {
      id: "ptc-ai-001",
      event_id: event1Id,
      uuid_qr: "f1b4901a-82bc-4402-a19e-e3170df1b490",
      nama_asli: "Dr. Raditya Pratama, M.Sc.",
      instansi: "Institut Teknologi Bandung",
      email: "raditya@itb.ac.id",
      phone: "081122334455",
      role: "Pemateri",
      is_attended: 1,
      attended_at: daysAgo(2),
      nomor_sertifikat: "001/2/PANITIA/XI/2026",
    },
    {
      id: "ptc-ai-002",
      event_id: event1Id,
      uuid_qr: "a8f92c10-4b7e-491a-9d3c-81f20e5b4412",
      nama_asli: "Ahmad Fauzi, S.Kom.",
      instansi: "Universitas Negeri Surabaya",
      email: "ahmad.fauzi@unesa.ac.id",
      phone: "081234567890",
      role: "Panitia",
      is_attended: 1,
      attended_at: daysAgo(1),
      nomor_sertifikat: "002/2/PANITIA/XI/2026",
    },
    {
      id: "ptc-ai-003",
      event_id: event1Id,
      uuid_qr: "c3d18820-2210-410a-8d19-90bba13c3d18",
      nama_asli: "Siti Aisyah, S.Pd.",
      instansi: "Universitas Airlangga",
      email: "siti.aisyah@unair.ac.id",
      phone: "085678901234",
      role: "Peserta",
      is_attended: 1,
      attended_at: hoursAgo(5),
      nomor_sertifikat: "003/2/PANITIA/XI/2026",
    },
    {
      id: "ptc-ai-004",
      event_id: event1Id,
      uuid_qr: "3d98aa21-0981-447b-b5cb-1992483d98aa",
      nama_asli: "Dewi Lestari, M.Kom.",
      instansi: "Universitas Diponegoro",
      email: "dewi.lestari@undip.ac.id",
      phone: "081355557777",
      role: "Peserta",
      is_attended: 1,
      attended_at: hoursAgo(3),
      nomor_sertifikat: "004/2/PANITIA/XI/2026",
    },
    {
      id: "ptc-ai-005",
      event_id: event1Id,
      uuid_qr: null,
      nama_asli: "Budi Santoso",
      instansi: "Politeknik Elektronika Negeri Surabaya",
      email: "budi.santoso@pens.ac.id",
      phone: "081398765432",
      role: "Peserta",
      is_attended: 0,
      attended_at: null,
      nomor_sertifikat: null,
    },
    {
      id: "ptc-ai-006",
      event_id: event1Id,
      uuid_qr: null,
      nama_asli: "Rina Kusumawati, S.T.",
      instansi: "Universitas Brawijaya",
      email: "rina.kusuma@ub.ac.id",
      phone: "082144556677",
      role: "Peserta",
      is_attended: 0,
      attended_at: null,
      nomor_sertifikat: null,
    },
    {
      id: "ptc-ai-007",
      event_id: event1Id,
      uuid_qr: null,
      nama_asli: "Hendra Wijaya, M.T.",
      instansi: "Institut Teknologi Sepuluh Nopember",
      email: "hendra.w@its.ac.id",
      phone: "081299887766",
      role: "Moderator",
      is_attended: 0,
      attended_at: null,
      nomor_sertifikat: null,
    },
    {
      id: "ptc-ui-001",
      event_id: event2Id,
      uuid_qr: "7e2a11b0-4591-4e12-88aa-38102a7e2a11",
      nama_asli: "Sarah Salsabila, B.Des.",
      instansi: "Komunitas Desain Produk ID",
      email: "sarah@desainproduk.id",
      phone: "081900112233",
      role: "Pemateri",
      is_attended: 1,
      attended_at: daysAgo(3),
      nomor_sertifikat: "001/WS-UIUX/XII/2026",
    },
    {
      id: "ptc-ui-002",
      event_id: event2Id,
      uuid_qr: "9c44bb10-12a3-4b88-90fe-1102a7b4c992",
      nama_asli: "Fajar Nugroho",
      instansi: "Telkom University",
      email: "fajar.nugroho@telkomuniversity.ac.id",
      phone: "085712340987",
      role: "Peserta",
      is_attended: 1,
      attended_at: hoursAgo(1),
      nomor_sertifikat: "002/WS-UIUX/XII/2026",
    },
  ];

  for (const p of sampleParticipants) {
    await db.execute({
      sql: `INSERT INTO participants (
        id, event_id, uuid_qr, nama_asli, nama_key, instansi, email, phone,
        role, is_attended, attended_at, nomor_sertifikat, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.id,
        p.event_id,
        p.uuid_qr,
        p.nama_asli,
        normalizeNamaKey(p.nama_asli),
        p.instansi,
        p.email,
        p.phone,
        p.role,
        p.is_attended,
        p.attended_at,
        p.nomor_sertifikat,
        nowIso,
      ],
    });
  }

  const sampleLogs = [
    {
      id: "log-seed-001",
      queried_code: "a8f92c10-4b7e-491a-9d3c-81f20e5b4412",
      method: "qr",
      status: "valid",
      participant_id: "ptc-ai-002",
      participant_name: "Ahmad Fauzi, S.Kom.",
      event_title: "Webinar Nasional Transformasi Digital & AI 2026",
      cert_number: "002/2/PANITIA/XI/2026",
      checked_at: hoursAgo(0.1),
    },
    {
      id: "log-seed-002",
      queried_code: "c3d18820-2210-410a-8d19-90bba13c3d18",
      method: "qr",
      status: "valid",
      participant_id: "ptc-ai-003",
      participant_name: "Siti Aisyah, S.Pd.",
      event_title: "Webinar Nasional Transformasi Digital & AI 2026",
      cert_number: "003/2/PANITIA/XI/2026",
      checked_at: hoursAgo(0.4),
    },
    {
      id: "log-seed-003",
      queried_code: "002/WS-UIUX/XII/2026",
      method: "manual",
      status: "valid",
      participant_id: "ptc-ui-002",
      participant_name: "Fajar Nugroho",
      event_title: "Workshop UI/UX Design Modern untuk Pemula",
      cert_number: "002/WS-UIUX/XII/2026",
      checked_at: hoursAgo(1.2),
    },
    {
      id: "log-seed-004",
      queried_code: "999/FAKE/2026",
      method: "manual",
      status: "invalid",
      participant_id: null,
      participant_name: null,
      event_title: null,
      cert_number: null,
      checked_at: hoursAgo(2.1),
    },
    {
      id: "log-seed-005",
      queried_code: "3d98aa21-0981-447b-b5cb-1992483d98aa",
      method: "qr",
      status: "valid",
      participant_id: "ptc-ai-004",
      participant_name: "Dewi Lestari, M.Kom.",
      event_title: "Webinar Nasional Transformasi Digital & AI 2026",
      cert_number: "004/2/PANITIA/XI/2026",
      checked_at: hoursAgo(4.5),
    },
  ];

  for (const log of sampleLogs) {
    await db.execute({
      sql: `INSERT INTO verification_logs (
        id, queried_code, method, status, participant_id,
        participant_name, event_title, cert_number, checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        log.id,
        log.queried_code,
        log.method,
        log.status,
        log.participant_id,
        log.participant_name,
        log.event_title,
        log.cert_number,
        log.checked_at,
      ],
    });
  }
}
