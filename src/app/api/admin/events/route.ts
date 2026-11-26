import { NextResponse } from "next/server";
import { revalidateEventRelatedCaches } from "@/lib/cache";
import {
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_TEMPLATE_URL,
  serializeLayoutConfig,
} from "@/lib/certificate-layout";
import { ensureDbInitialized } from "@/lib/db";
import { getAllEventsWithStats } from "@/lib/queries";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const events = await getAllEventsWithStats();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/admin/events error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar webinar." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      organizer?: string;
      event_date?: string;
      speaker?: string;
      slug?: string;
      cert_number_format?: string;
      start_number?: number;
      number_padding?: number;
      attendance_mode?: "strict" | "open";
      is_attendance_open?: boolean | number;
      is_download_open?: boolean | number;
      template_url?: string;
    };

    const title = (body.title || "").trim();
    const organizer = (body.organizer || "").trim();
    const eventDate = (body.event_date || "").trim();

    if (!title || !organizer || !eventDate) {
      return NextResponse.json(
        { error: "Judul acara, penyelenggara, dan tanggal pelaksanaan wajib diisi." },
        { status: 400 }
      );
    }

    const cleanSlug = slugify(body.slug?.trim() || title);
    if (!cleanSlug) {
      return NextResponse.json(
        { error: "URL slug tidak valid." },
        { status: 400 }
      );
    }

    const db = await ensureDbInitialized();
    const existing = await db.execute({
      sql: `SELECT id FROM events WHERE slug = ? LIMIT 1`,
      args: [cleanSlug],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: `Slug "${cleanSlug}" sudah digunakan oleh webinar lain.` },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const certFormat =
      (body.cert_number_format || "").trim() || "{NO}/2/PANITIA/XI/2026";
    const startNumber = Math.max(1, Number(body.start_number) || 1);
    const numberPadding = Math.max(1, Math.min(8, Number(body.number_padding) || 3));
    const attendanceMode = body.attendance_mode === "open" ? "open" : "strict";
    const isAttendanceOpen = body.is_attendance_open === false || body.is_attendance_open === 0 ? 0 : 1;
    const isDownloadOpen = body.is_download_open === false || body.is_download_open === 0 ? 0 : 1;
    const templateUrl = (body.template_url || "").trim() || DEFAULT_TEMPLATE_URL;

    await db.execute({
      sql: `
        INSERT INTO events (
          id, slug, title, organizer, event_date, speaker,
          cert_number_format, start_number, last_number, number_padding,
          attendance_mode, is_attendance_open, is_download_open,
          template_url, layout_config, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        cleanSlug,
        title,
        organizer,
        eventDate,
        (body.speaker || "").trim(),
        certFormat,
        startNumber,
        numberPadding,
        attendanceMode,
        isAttendanceOpen,
        isDownloadOpen,
        templateUrl,
        serializeLayoutConfig(DEFAULT_LAYOUT_CONFIG),
        nowIso,
        nowIso,
      ],
    });

    revalidateEventRelatedCaches(cleanSlug);
    return NextResponse.json({ ok: true, id, slug: cleanSlug }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/events error:", error);
    return NextResponse.json(
      { error: "Gagal membuat webinar baru." },
      { status: 500 }
    );
  }
}
