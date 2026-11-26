import type { Row } from "@libsql/client";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "./cache";
import { ensureDbInitialized } from "./db";
import type {
  EventRecord,
  EventWithStats,
  ParticipantRecord,
  SiteSettings,
  VerificationLogRecord,
} from "./types";

function mapEventRow(row: Row): EventRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    organizer: String(row.organizer),
    event_date: String(row.event_date),
    speaker: String(row.speaker ?? ""),
    cert_number_format: String(row.cert_number_format),
    start_number: Number(row.start_number ?? 1),
    last_number: Number(row.last_number ?? 0),
    number_padding: Number(row.number_padding ?? 3),
    attendance_mode: String(row.attendance_mode) === "open" ? "open" : "strict",
    is_attendance_open: Number(row.is_attendance_open ?? 0),
    is_download_open: Number(row.is_download_open ?? 0),
    template_url: String(row.template_url ?? ""),
    layout_config: String(row.layout_config ?? "{}"),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapParticipantRow(row: Row): ParticipantRecord {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    uuid_qr: row.uuid_qr ? String(row.uuid_qr) : null,
    nama_asli: String(row.nama_asli),
    nama_key: String(row.nama_key),
    instansi: String(row.instansi ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    role: String(row.role ?? "Peserta"),
    is_attended: Number(row.is_attended ?? 0),
    attended_at: row.attended_at ? String(row.attended_at) : null,
    nomor_sertifikat: row.nomor_sertifikat ? String(row.nomor_sertifikat) : null,
    created_at: String(row.created_at),
  };
}

function mapLogRow(row: Row): VerificationLogRecord {
  return {
    id: String(row.id),
    queried_code: String(row.queried_code),
    method: String(row.method) === "manual" ? "manual" : "qr",
    status: String(row.status) === "valid" ? "valid" : "invalid",
    participant_id: row.participant_id ? String(row.participant_id) : null,
    participant_name: row.participant_name ? String(row.participant_name) : null,
    event_title: row.event_title ? String(row.event_title) : null,
    cert_number: row.cert_number ? String(row.cert_number) : null,
    checked_at: String(row.checked_at),
  };
}

function mapSiteSettingsRows(rows: Row[]): SiteSettings {
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[String(row.key)] = String(row.value);
  }
  return {
    org_name: map.org_name || "Direktorat Inovasi & Pendidikan Digital",
    default_organizer:
      map.default_organizer || "Panitia Pelaksana Webinar Nasional",
    contact_email: map.contact_email || "admin@vericert.id",
    logo_url: map.logo_url || "",
    verification_footer:
      map.verification_footer ||
      "VeriCert Official Credential Authority • Terlindungi Kriptografi SHA-256",
  };
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const db = await ensureDbInitialized();
    const res = await db.execute("SELECT key, value FROM site_settings");
    return mapSiteSettingsRows(res.rows);
  },
  ["vericert-site-settings"],
  { revalidate: 300, tags: [CACHE_TAGS.SETTINGS] }
);

/**
 * Lightweight single-batch metrics & settings for the Public Home Page (`/`).
 */
export const getPublicHomeData = unstable_cache(
  async () => {
    const db = await ensureDbInitialized();
    const [countsRes, settingsRes] = await db.batch(
      [
        `
          SELECT
            (SELECT COUNT(*) FROM events) AS total_events,
            (SELECT COUNT(*) FROM events WHERE is_attendance_open = 1) AS active_events,
            (SELECT COUNT(*) FROM participants) AS total_participants,
            (SELECT COUNT(*) FROM participants WHERE is_attended = 1) AS issued_certs,
            (SELECT COUNT(*) FROM verification_logs) AS total_scans
        `,
        "SELECT key, value FROM site_settings",
      ],
      "read"
    );

    const row = countsRes.rows[0];
    return {
      metrics: {
        totalEvents: Number(row?.total_events ?? 0),
        activeEvents: Number(row?.active_events ?? 0),
        totalParticipants: Number(row?.total_participants ?? 0),
        issuedCerts: Number(row?.issued_certs ?? 0),
        totalScans: Number(row?.total_scans ?? 0),
      },
      settings: mapSiteSettingsRows(settingsRes.rows),
    };
  },
  ["vericert-public-home"],
  {
    revalidate: 30,
    tags: [CACHE_TAGS.PUBLIC_HOME, CACHE_TAGS.EVENTS, CACHE_TAGS.SETTINGS],
  }
);

/**
 * Lightweight event list for the Public Webinar Directory (`/webinar`).
 */
export const getPublicEventsList = unstable_cache(
  async (): Promise<EventRecord[]> => {
    const db = await ensureDbInitialized();
    const res = await db.execute(`
      SELECT * FROM events
      ORDER BY is_attendance_open DESC, event_date DESC, created_at DESC
    `);
    return res.rows.map(mapEventRow);
  },
  ["vericert-public-events"],
  { revalidate: 30, tags: [CACHE_TAGS.EVENTS] }
);

export const getAllEventsWithStats = unstable_cache(
  async (): Promise<EventWithStats[]> => {
    const db = await ensureDbInitialized();
    const res = await db.execute(`
      SELECT
        e.*,
        COUNT(p.id) AS total_participants,
        COALESCE(SUM(CASE WHEN p.is_attended = 1 THEN 1 ELSE 0 END), 0) AS attended_count
      FROM events e
      LEFT JOIN participants p ON p.event_id = e.id
      GROUP BY e.id
      ORDER BY e.event_date DESC, e.created_at DESC
    `);
    return res.rows.map((row) => ({
      ...mapEventRow(row),
      total_participants: Number(row.total_participants ?? 0),
      attended_count: Number(row.attended_count ?? 0),
    }));
  },
  ["vericert-admin-events-stats"],
  { revalidate: 20, tags: [CACHE_TAGS.EVENTS, CACHE_TAGS.ADMIN_DASHBOARD] }
);

export async function getEventById(id: string): Promise<EventWithStats | null> {
  const db = await ensureDbInitialized();
  const res = await db.execute({
    sql: `
      SELECT
        e.*,
        COUNT(p.id) AS total_participants,
        COALESCE(SUM(CASE WHEN p.is_attended = 1 THEN 1 ELSE 0 END), 0) AS attended_count
      FROM events e
      LEFT JOIN participants p ON p.event_id = e.id
      WHERE e.id = ?
      GROUP BY e.id
      LIMIT 1
    `,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    ...mapEventRow(row),
    total_participants: Number(row.total_participants ?? 0),
    attended_count: Number(row.attended_count ?? 0),
  };
}

export const getEventBySlug = unstable_cache(
  async (slug: string): Promise<EventRecord | null> => {
    const db = await ensureDbInitialized();
    const res = await db.execute({
      sql: `SELECT * FROM events WHERE slug = ? LIMIT 1`,
      args: [slug],
    });
    if (res.rows.length === 0) return null;
    return mapEventRow(res.rows[0]);
  },
  ["vericert-event-by-slug"],
  { revalidate: 20, tags: [CACHE_TAGS.EVENTS] }
);

export async function getEventDetailWithParticipants(id: string): Promise<{
  event: EventWithStats;
  participants: ParticipantRecord[];
} | null> {
  const db = await ensureDbInitialized();
  const [eventRes, participantsRes] = await db.batch(
    [
      {
        sql: `
          SELECT
            e.*,
            COUNT(p.id) AS total_participants,
            COALESCE(SUM(CASE WHEN p.is_attended = 1 THEN 1 ELSE 0 END), 0) AS attended_count
          FROM events e
          LEFT JOIN participants p ON p.event_id = e.id
          WHERE e.id = ?
          GROUP BY e.id
          LIMIT 1
        `,
        args: [id],
      },
      {
        sql: `
          SELECT * FROM participants
          WHERE event_id = ?
          ORDER BY is_attended DESC, attended_at DESC, created_at DESC
        `,
        args: [id],
      },
    ],
    "read"
  );

  if (eventRes.rows.length === 0) return null;
  const row = eventRes.rows[0];
  return {
    event: {
      ...mapEventRow(row),
      total_participants: Number(row.total_participants ?? 0),
      attended_count: Number(row.attended_count ?? 0),
    },
    participants: participantsRes.rows.map(mapParticipantRow),
  };
}

export async function getEventParticipants(
  eventId: string
): Promise<ParticipantRecord[]> {
  const db = await ensureDbInitialized();
  const res = await db.execute({
    sql: `
      SELECT * FROM participants
      WHERE event_id = ?
      ORDER BY is_attended DESC, attended_at DESC, created_at DESC
    `,
    args: [eventId],
  });
  return res.rows.map(mapParticipantRow);
}

export async function getParticipantByUuid(uuid: string): Promise<{
  participant: ParticipantRecord;
  event: EventRecord;
} | null> {
  const db = await ensureDbInitialized();
  const res = await db.execute({
    sql: `
      SELECT
        p.*,
        e.id AS e_id, e.slug AS e_slug, e.title AS e_title, e.organizer AS e_organizer,
        e.event_date AS e_event_date, e.speaker AS e_speaker,
        e.cert_number_format AS e_cert_number_format, e.start_number AS e_start_number,
        e.last_number AS e_last_number, e.number_padding AS e_number_padding,
        e.attendance_mode AS e_attendance_mode, e.is_attendance_open AS e_is_attendance_open,
        e.is_download_open AS e_is_download_open, e.template_url AS e_template_url,
        e.layout_config AS e_layout_config, e.created_at AS e_created_at, e.updated_at AS e_updated_at
      FROM participants p
      JOIN events e ON e.id = p.event_id
      WHERE p.uuid_qr = ? AND p.is_attended = 1
      LIMIT 1
    `,
    args: [uuid],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    participant: mapParticipantRow(row),
    event: {
      id: String(row.e_id),
      slug: String(row.e_slug),
      title: String(row.e_title),
      organizer: String(row.e_organizer),
      event_date: String(row.e_event_date),
      speaker: String(row.e_speaker ?? ""),
      cert_number_format: String(row.e_cert_number_format),
      start_number: Number(row.e_start_number ?? 1),
      last_number: Number(row.e_last_number ?? 0),
      number_padding: Number(row.e_number_padding ?? 3),
      attendance_mode: String(row.e_attendance_mode) === "open" ? "open" : "strict",
      is_attendance_open: Number(row.e_is_attendance_open ?? 0),
      is_download_open: Number(row.e_is_download_open ?? 0),
      template_url: String(row.e_template_url ?? ""),
      layout_config: String(row.e_layout_config ?? "{}"),
      created_at: String(row.e_created_at),
      updated_at: String(row.e_updated_at),
    },
  };
}

export const getRecentVerificationLogs = unstable_cache(
  async (limit = 50): Promise<VerificationLogRecord[]> => {
    const db = await ensureDbInitialized();
    const res = await db.execute({
      sql: `SELECT * FROM verification_logs ORDER BY checked_at DESC LIMIT ?`,
      args: [limit],
    });
    return res.rows.map(mapLogRow);
  },
  ["vericert-recent-logs"],
  { revalidate: 20, tags: [CACHE_TAGS.LOGS] }
);

export async function recordVerificationLog(params: {
  queriedCode: string;
  method: "qr" | "manual";
  status: "valid" | "invalid";
  participantId?: string | null;
  participantName?: string | null;
  eventTitle?: string | null;
  certNumber?: string | null;
}): Promise<void> {
  const db = await ensureDbInitialized();
  await db.execute({
    sql: `
      INSERT INTO verification_logs (
        id, queried_code, method, status, participant_id,
        participant_name, event_title, cert_number, checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      crypto.randomUUID(),
      params.queriedCode,
      params.method,
      params.status,
      params.participantId ?? null,
      params.participantName ?? null,
      params.eventTitle ?? null,
      params.certNumber ?? null,
      new Date().toISOString(),
    ],
  });
}

export const getDashboardSummary = unstable_cache(
  async () => {
    const db = await ensureDbInitialized();
    const [eventsRes, logsRes, scanCountRes, weeklyRes] = await db.batch(
      [
        `
          SELECT
            e.*,
            COUNT(p.id) AS total_participants,
            COALESCE(SUM(CASE WHEN p.is_attended = 1 THEN 1 ELSE 0 END), 0) AS attended_count
          FROM events e
          LEFT JOIN participants p ON p.event_id = e.id
          GROUP BY e.id
          ORDER BY e.event_date DESC, e.created_at DESC
        `,
        `SELECT * FROM verification_logs ORDER BY checked_at DESC LIMIT 6`,
        `SELECT COUNT(*) AS total_scans FROM verification_logs`,
        `
          SELECT substr(attended_at, 1, 10) AS day_key, COUNT(*) AS cnt
          FROM participants
          WHERE is_attended = 1 AND attended_at IS NOT NULL
          GROUP BY day_key
          ORDER BY day_key DESC
          LIMIT 14
        `,
      ],
      "read"
    );

    const events: EventWithStats[] = eventsRes.rows.map((row) => ({
      ...mapEventRow(row),
      total_participants: Number(row.total_participants ?? 0),
      attended_count: Number(row.attended_count ?? 0),
    }));

    let activeEvents = 0;
    let totalParticipants = 0;
    let issuedCerts = 0;
    for (const ev of events) {
      if (ev.is_attendance_open === 1) activeEvents += 1;
      totalParticipants += ev.total_participants;
      issuedCerts += ev.attended_count;
    }

    return {
      metrics: {
        totalEvents: events.length,
        activeEvents,
        totalParticipants,
        issuedCerts,
        totalScans: Number(scanCountRes.rows[0]?.total_scans ?? 0),
      },
      events,
      recentLogs: logsRes.rows.map(mapLogRow),
      dailyAttendance: weeklyRes.rows.map((r) => ({
        day: String(r.day_key),
        count: Number(r.cnt ?? 0),
      })),
    };
  },
  ["vericert-admin-dashboard-summary"],
  {
    revalidate: 20,
    tags: [CACHE_TAGS.ADMIN_DASHBOARD, CACHE_TAGS.EVENTS, CACHE_TAGS.LOGS],
  }
);
