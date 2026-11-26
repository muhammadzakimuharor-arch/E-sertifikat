import { ensureDbInitialized } from "./db";
import { mapParticipantRow } from "./queries";
import type { ParticipantRecord } from "./types";
import { formatCertificateNumber, normalizeNamaKey } from "./utils";

export interface IssueAttendanceResult {
  participant: ParticipantRecord;
  alreadyAttended: boolean;
}

export class AttendanceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function allocateUniqueCertNumber(
  tx: Awaited<ReturnType<Awaited<ReturnType<typeof ensureDbInitialized>>["transaction"]>>,
  format: string,
  startNumber: number,
  lastNumber: number,
  padding: number
): Promise<{ seqNumber: number; certNumber: string }> {
  let candidate = Math.max(lastNumber + 1, startNumber);
  for (let attempt = 0; attempt < 100; attempt++) {
    const formatted = formatCertificateNumber(format, candidate, padding);
    const existing = await tx.execute({
      sql: `SELECT id FROM participants WHERE nomor_sertifikat = ? LIMIT 1`,
      args: [formatted],
    });
    if (existing.rows.length === 0) {
      return { seqNumber: candidate, certNumber: formatted };
    }
    candidate += 1;
  }
  throw new AttendanceError(
    "Gagal menghasilkan nomor sertifikat unik.",
    500
  );
}

/**
 * Atomically marks a strict-mode pre-registered participant as attended and issues
 * a sequential certificate number + UUID inside a SQLite write transaction.
 */
export async function attendStrictParticipant(params: {
  slug: string;
  participantId: string;
}): Promise<IssueAttendanceResult> {
  const db = await ensureDbInitialized();
  const tx = await db.transaction("write");

  try {
    const evRes = await tx.execute({
      sql: `SELECT * FROM events WHERE slug = ? LIMIT 1`,
      args: [params.slug],
    });
    if (evRes.rows.length === 0) {
      throw new AttendanceError("Webinar tidak ditemukan.", 404);
    }
    const ev = evRes.rows[0];
    if (Number(ev.is_attendance_open) !== 1) {
      throw new AttendanceError("Sesi absensi untuk webinar ini telah ditutup.", 403);
    }
    if (String(ev.attendance_mode) !== "strict") {
      throw new AttendanceError("Mode absensi event ini bukan mode ketat.", 400);
    }

    const pRes = await tx.execute({
      sql: `SELECT * FROM participants WHERE id = ? AND event_id = ? LIMIT 1`,
      args: [params.participantId, String(ev.id)],
    });
    if (pRes.rows.length === 0) {
      throw new AttendanceError("Data peserta tidak ditemukan dalam daftar event.", 404);
    }

    const existing = mapParticipantRow(pRes.rows[0]);
    if (existing.is_attended === 1 && existing.uuid_qr) {
      await tx.commit();
      return { participant: existing, alreadyAttended: true };
    }

    const { seqNumber, certNumber } = await allocateUniqueCertNumber(
      tx,
      String(ev.cert_number_format),
      Number(ev.start_number ?? 1),
      Number(ev.last_number ?? 0),
      Number(ev.number_padding ?? 3)
    );

    const uuidQr = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    await tx.execute({
      sql: `UPDATE events SET last_number = ?, updated_at = ? WHERE id = ?`,
      args: [seqNumber, nowIso, String(ev.id)],
    });

    await tx.execute({
      sql: `
        UPDATE participants
        SET is_attended = 1, attended_at = ?, nomor_sertifikat = ?, uuid_qr = ?
        WHERE id = ?
      `,
      args: [nowIso, certNumber, uuidQr, existing.id],
    });

    const updatedRes = await tx.execute({
      sql: `SELECT * FROM participants WHERE id = ? LIMIT 1`,
      args: [existing.id],
    });

    await tx.commit();
    return {
      participant: mapParticipantRow(updatedRes.rows[0]),
      alreadyAttended: false,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

/**
 * Atomically registers (or finds existing by normalized nama_key) and marks an open-mode
 * attendee as present with a sequential certificate number + UUID.
 */
export async function attendOpenParticipant(params: {
  slug: string;
  namaAsli: string;
  instansi: string;
  email?: string;
  phone?: string;
  role?: string;
}): Promise<IssueAttendanceResult> {
  const cleanName = params.namaAsli.trim().replace(/\s+/g, " ");
  if (cleanName.length < 2) {
    throw new AttendanceError("Nama lengkap minimal 2 karakter.", 400);
  }
  const namaKey = normalizeNamaKey(cleanName);

  const db = await ensureDbInitialized();
  const tx = await db.transaction("write");

  try {
    const evRes = await tx.execute({
      sql: `SELECT * FROM events WHERE slug = ? LIMIT 1`,
      args: [params.slug],
    });
    if (evRes.rows.length === 0) {
      throw new AttendanceError("Webinar tidak ditemukan.", 404);
    }
    const ev = evRes.rows[0];
    if (Number(ev.is_attendance_open) !== 1) {
      throw new AttendanceError("Sesi absensi untuk webinar ini telah ditutup.", 403);
    }
    if (String(ev.attendance_mode) !== "open") {
      throw new AttendanceError(
        "Event ini menggunakan Mode Ketat. Silakan cari nama Anda di daftar peserta.",
        400
      );
    }

    const existingRes = await tx.execute({
      sql: `SELECT * FROM participants WHERE event_id = ? AND nama_key = ? LIMIT 1`,
      args: [String(ev.id), namaKey],
    });

    if (existingRes.rows.length > 0) {
      const existing = mapParticipantRow(existingRes.rows[0]);
      if (existing.is_attended === 1 && existing.uuid_qr) {
        await tx.commit();
        return { participant: existing, alreadyAttended: true };
      }

      const { seqNumber, certNumber } = await allocateUniqueCertNumber(
        tx,
        String(ev.cert_number_format),
        Number(ev.start_number ?? 1),
        Number(ev.last_number ?? 0),
        Number(ev.number_padding ?? 3)
      );
      const uuidQr = crypto.randomUUID();
      const nowIso = new Date().toISOString();

      await tx.execute({
        sql: `UPDATE events SET last_number = ?, updated_at = ? WHERE id = ?`,
        args: [seqNumber, nowIso, String(ev.id)],
      });

      await tx.execute({
        sql: `
          UPDATE participants
          SET nama_asli = ?, instansi = ?, email = ?, phone = ?,
              is_attended = 1, attended_at = ?, nomor_sertifikat = ?, uuid_qr = ?
          WHERE id = ?
        `,
        args: [
          cleanName,
          params.instansi.trim() || existing.instansi,
          (params.email ?? "").trim() || existing.email,
          (params.phone ?? "").trim() || existing.phone,
          nowIso,
          certNumber,
          uuidQr,
          existing.id,
        ],
      });

      const updatedRes = await tx.execute({
        sql: `SELECT * FROM participants WHERE id = ? LIMIT 1`,
        args: [existing.id],
      });
      await tx.commit();
      return {
        participant: mapParticipantRow(updatedRes.rows[0]),
        alreadyAttended: false,
      };
    }

    const { seqNumber, certNumber } = await allocateUniqueCertNumber(
      tx,
      String(ev.cert_number_format),
      Number(ev.start_number ?? 1),
      Number(ev.last_number ?? 0),
      Number(ev.number_padding ?? 3)
    );

    const newId = crypto.randomUUID();
    const uuidQr = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    await tx.execute({
      sql: `UPDATE events SET last_number = ?, updated_at = ? WHERE id = ?`,
      args: [seqNumber, nowIso, String(ev.id)],
    });

    await tx.execute({
      sql: `
        INSERT INTO participants (
          id, event_id, uuid_qr, nama_asli, nama_key, instansi, email, phone,
          role, is_attended, attended_at, nomor_sertifikat, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `,
      args: [
        newId,
        String(ev.id),
        uuidQr,
        cleanName,
        namaKey,
        params.instansi.trim(),
        (params.email ?? "").trim(),
        (params.phone ?? "").trim(),
        (params.role ?? "Peserta").trim() || "Peserta",
        nowIso,
        certNumber,
        nowIso,
      ],
    });

    const insertedRes = await tx.execute({
      sql: `SELECT * FROM participants WHERE id = ? LIMIT 1`,
      args: [newId],
    });
    await tx.commit();
    return {
      participant: mapParticipantRow(insertedRes.rows[0]),
      alreadyAttended: false,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

/**
 * Admin helper: atomically marks any participant as attended (ignoring attendance_open status).
 */
export async function adminMarkParticipantAttended(
  eventId: string,
  participantId: string
): Promise<IssueAttendanceResult> {
  const db = await ensureDbInitialized();
  const tx = await db.transaction("write");

  try {
    const evRes = await tx.execute({
      sql: `SELECT * FROM events WHERE id = ? LIMIT 1`,
      args: [eventId],
    });
    if (evRes.rows.length === 0) {
      throw new AttendanceError("Event tidak ditemukan.", 404);
    }
    const ev = evRes.rows[0];

    const pRes = await tx.execute({
      sql: `SELECT * FROM participants WHERE id = ? AND event_id = ? LIMIT 1`,
      args: [participantId, eventId],
    });
    if (pRes.rows.length === 0) {
      throw new AttendanceError("Peserta tidak ditemukan.", 404);
    }
    const existing = mapParticipantRow(pRes.rows[0]);
    if (existing.is_attended === 1 && existing.uuid_qr) {
      await tx.commit();
      return { participant: existing, alreadyAttended: true };
    }

    const { seqNumber, certNumber } = await allocateUniqueCertNumber(
      tx,
      String(ev.cert_number_format),
      Number(ev.start_number ?? 1),
      Number(ev.last_number ?? 0),
      Number(ev.number_padding ?? 3)
    );

    const uuidQr = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    await tx.execute({
      sql: `UPDATE events SET last_number = ?, updated_at = ? WHERE id = ?`,
      args: [seqNumber, nowIso, eventId],
    });

    await tx.execute({
      sql: `
        UPDATE participants
        SET is_attended = 1, attended_at = ?, nomor_sertifikat = ?, uuid_qr = ?
        WHERE id = ?
      `,
      args: [nowIso, certNumber, uuidQr, participantId],
    });

    const updatedRes = await tx.execute({
      sql: `SELECT * FROM participants WHERE id = ? LIMIT 1`,
      args: [participantId],
    });
    await tx.commit();
    return {
      participant: mapParticipantRow(updatedRes.rows[0]),
      alreadyAttended: false,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

/**
 * Admin helper: creates a participant manually, optionally marking attended immediately.
 */
export async function adminCreateParticipant(params: {
  eventId: string;
  namaAsli: string;
  instansi: string;
  email: string;
  phone: string;
  role: string;
  markAttended: boolean;
}): Promise<ParticipantRecord> {
  const cleanName = params.namaAsli.trim().replace(/\s+/g, " ");
  if (!cleanName) {
    throw new AttendanceError("Nama lengkap wajib diisi.", 400);
  }
  const namaKey = normalizeNamaKey(cleanName);

  const db = await ensureDbInitialized();
  const tx = await db.transaction("write");

  try {
    const evRes = await tx.execute({
      sql: `SELECT * FROM events WHERE id = ? LIMIT 1`,
      args: [params.eventId],
    });
    if (evRes.rows.length === 0) {
      throw new AttendanceError("Webinar tidak ditemukan.", 404);
    }
    const ev = evRes.rows[0];

    const dupRes = await tx.execute({
      sql: `SELECT id FROM participants WHERE event_id = ? AND nama_key = ? LIMIT 1`,
      args: [params.eventId, namaKey],
    });
    if (dupRes.rows.length > 0) {
      throw new AttendanceError(
        `Peserta dengan nama "${cleanName}" sudah terdaftar pada acara ini.`,
        409
      );
    }

    const newId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    let uuidQr: string | null = null;
    let certNumber: string | null = null;
    let attendedAt: string | null = null;

    if (params.markAttended) {
      const allocated = await allocateUniqueCertNumber(
        tx,
        String(ev.cert_number_format),
        Number(ev.start_number ?? 1),
        Number(ev.last_number ?? 0),
        Number(ev.number_padding ?? 3)
      );
      uuidQr = crypto.randomUUID();
      certNumber = allocated.certNumber;
      attendedAt = nowIso;

      await tx.execute({
        sql: `UPDATE events SET last_number = ?, updated_at = ? WHERE id = ?`,
        args: [allocated.seqNumber, nowIso, params.eventId],
      });
    }

    await tx.execute({
      sql: `
        INSERT INTO participants (
          id, event_id, uuid_qr, nama_asli, nama_key, instansi, email, phone,
          role, is_attended, attended_at, nomor_sertifikat, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        newId,
        params.eventId,
        uuidQr,
        cleanName,
        namaKey,
        params.instansi.trim(),
        params.email.trim(),
        params.phone.trim(),
        params.role.trim() || "Peserta",
        params.markAttended ? 1 : 0,
        attendedAt,
        certNumber,
        nowIso,
      ],
    });

    const createdRes = await tx.execute({
      sql: `SELECT * FROM participants WHERE id = ? LIMIT 1`,
      args: [newId],
    });
    await tx.commit();
    return mapParticipantRow(createdRes.rows[0]);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
