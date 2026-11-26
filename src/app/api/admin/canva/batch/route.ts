import { NextResponse } from "next/server";
import { revalidateEventRelatedCaches } from "@/lib/cache";
import { ensureDbInitialized } from "@/lib/db";
import {
  formatCertificateNumber,
  normalizeNamaKey,
  slugify,
} from "@/lib/utils";

interface BatchParticipantInput {
  name: string;
  instansi?: string;
  email?: string;
  customCertNumber?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventId?: string;
      eventTitle?: string;
      organizer?: string;
      eventDate?: string;
      certNumberFormat?: string;
      startNumber?: number;
      numberPadding?: number;
      participants?: BatchParticipantInput[];
    };

    const participantsInput = Array.isArray(body.participants)
      ? body.participants
      : [];

    if (participantsInput.length === 0) {
      return NextResponse.json(
        { error: "Mohon masukkan minimal 1 nama peserta." },
        { status: 400 }
      );
    }

    const db = await ensureDbInitialized();
    const nowIso = new Date().toISOString();

    // Determine host / origin for verification links
    const originHeader =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "localhost:3000";
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (originHeader.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${originHeader}`;

    let eventId = body.eventId?.trim() || "";
    let certFormat = (body.certNumberFormat || "{NO}/PANITIA/XI/2026").trim();
    let currentNumber = Math.max(1, Number(body.startNumber) || 1);
    let padding = Math.max(1, Math.min(8, Number(body.numberPadding) || 3));
    let eventTitle = body.eventTitle?.trim() || "Batch Sertifikat Canva";

    if (eventId) {
      // Use existing event
      const evRes = await db.execute({
        sql: `SELECT id, title, cert_number_format, last_number, number_padding FROM events WHERE id = ? LIMIT 1`,
        args: [eventId],
      });
      if (evRes.rows.length === 0) {
        return NextResponse.json(
          { error: "Event yang dipilih tidak ditemukan." },
          { status: 404 }
        );
      }
      const ev = evRes.rows[0];
      eventTitle = String(ev.title);
      certFormat = String(ev.cert_number_format || certFormat);
      padding = Number(ev.number_padding || padding);
      currentNumber = Math.max(Number(ev.last_number || 0) + 1, currentNumber);
    } else {
      // Create new event
      eventId = crypto.randomUUID();
      const slug = `${slugify(eventTitle)}-${Math.random().toString(36).slice(2, 7)}`;
      const organizer = (body.organizer || "Panitia Penyelenggara").trim();
      const eventDate =
        (body.eventDate || "").trim() || nowIso.split("T")[0];

      await db.execute({
        sql: `
          INSERT INTO events (
            id, slug, title, organizer, event_date, speaker,
            cert_number_format, start_number, last_number, number_padding,
            attendance_mode, is_attendance_open, is_download_open,
            template_url, layout_config, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, '', ?, ?, 0, ?, 'strict', 1, 1, '', '{}', ?, ?)
        `,
        args: [
          eventId,
          slug,
          eventTitle,
          organizer,
          eventDate,
          certFormat,
          currentNumber,
          padding,
          nowIso,
          nowIso,
        ],
      });
    }

    const statements: { sql: string; args: (string | number | null)[] }[] = [];
    const generatedRows: {
      id: string;
      nama: string;
      instansi: string;
      email: string;
      nomor_sertifikat: string;
      uuid_qr: string;
      link_verifikasi: string;
      qr_image_url: string;
    }[] = [];

    // Track used cert numbers in this batch to avoid duplicates
    let seq = currentNumber;

    for (const item of participantsInput) {
      const cleanName = (item.name || "").trim().replace(/\s+/g, " ");
      if (!cleanName) continue;

      const participantId = crypto.randomUUID();
      // Unique cryptographically secure token
      const uuidQr = crypto.randomUUID();

      const namaKey = normalizeNamaKey(
        `${cleanName}-${Math.random().toString(36).slice(2, 6)}`
      );

      const certNumber =
        (item.customCertNumber || "").trim() ||
        formatCertificateNumber(certFormat, seq, padding);

      const linkVerifikasi = `${baseUrl}/verify/${uuidQr}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
        linkVerifikasi
      )}`;

      statements.push({
        sql: `
          INSERT INTO participants (
            id, event_id, uuid_qr, nama_asli, nama_key, instansi, email, phone,
            role, is_attended, attended_at, nomor_sertifikat, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, '', 'Peserta', 1, ?, ?, ?)
        `,
        args: [
          participantId,
          eventId,
          uuidQr,
          cleanName,
          namaKey,
          (item.instansi || "").trim(),
          (item.email || "").trim(),
          nowIso,
          certNumber,
          nowIso,
        ],
      });

      generatedRows.push({
        id: participantId,
        nama: cleanName,
        instansi: (item.instansi || "").trim(),
        email: (item.email || "").trim(),
        nomor_sertifikat: certNumber,
        uuid_qr: uuidQr,
        link_verifikasi: linkVerifikasi,
        qr_image_url: qrImageUrl,
      });

      seq += 1;
    }

    if (statements.length === 0) {
      return NextResponse.json(
        { error: "Semua baris nama kosong atau tidak valid." },
        { status: 400 }
      );
    }

    // Insert participants in batches of 100
    for (let i = 0; i < statements.length; i += 100) {
      await db.batch(statements.slice(i, i + 100), "write");
    }

    // Update last_number on the event
    await db.execute({
      sql: `UPDATE events SET last_number = ?, updated_at = ? WHERE id = ?`,
      args: [seq - 1, nowIso, eventId],
    });

    revalidateEventRelatedCaches();

    return NextResponse.json({
      ok: true,
      event: {
        id: eventId,
        title: eventTitle,
      },
      count: generatedRows.length,
      participants: generatedRows,
    });
  } catch (err) {
    console.error("Batch Canva generate error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan internal saat membuat data sertifikat.",
      },
      { status: 500 }
    );
  }
}
