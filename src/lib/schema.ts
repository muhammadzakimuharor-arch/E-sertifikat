import type { Client } from "@libsql/client";

/**
 * Creates all VeriCert tables and performance indexes idempotently.
 */
export async function initSchema(db: Client): Promise<void> {
  await db.executeMultiple(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      organizer TEXT NOT NULL,
      event_date TEXT NOT NULL,
      speaker TEXT DEFAULT '',
      cert_number_format TEXT NOT NULL DEFAULT '{NO}/2/PANITIA/XI/2026',
      start_number INTEGER NOT NULL DEFAULT 1,
      last_number INTEGER NOT NULL DEFAULT 0,
      number_padding INTEGER NOT NULL DEFAULT 3,
      attendance_mode TEXT NOT NULL CHECK(attendance_mode IN ('strict', 'open')) DEFAULT 'strict',
      is_attendance_open INTEGER NOT NULL DEFAULT 1,
      is_download_open INTEGER NOT NULL DEFAULT 1,
      template_url TEXT DEFAULT '',
      layout_config TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      uuid_qr TEXT UNIQUE,
      nama_asli TEXT NOT NULL,
      nama_key TEXT NOT NULL,
      instansi TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'Peserta',
      is_attended INTEGER NOT NULL DEFAULT 0,
      attended_at TEXT,
      nomor_sertifikat TEXT UNIQUE,
      created_at TEXT NOT NULL,
      UNIQUE(event_id, nama_key)
    );

    CREATE INDEX IF NOT EXISTS idx_participants_event_namakey
      ON participants(event_id, nama_key);

    CREATE INDEX IF NOT EXISTS idx_participants_uuid
      ON participants(uuid_qr);

    CREATE INDEX IF NOT EXISTS idx_participants_nomor
      ON participants(nomor_sertifikat);

    CREATE TABLE IF NOT EXISTS verification_logs (
      id TEXT PRIMARY KEY,
      queried_code TEXT NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('qr', 'manual')),
      status TEXT NOT NULL CHECK(status IN ('valid', 'invalid')),
      participant_id TEXT,
      participant_name TEXT,
      event_title TEXT,
      cert_number TEXT,
      checked_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_verification_logs_checked_at
      ON verification_logs(checked_at);

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
