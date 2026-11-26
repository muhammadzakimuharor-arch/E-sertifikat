import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/lib/db";
import { maskEmail, maskPhone, normalizeNamaKey } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const rawQuery = request.nextUrl.searchParams.get("q") || "";
    const normalized = normalizeNamaKey(rawQuery);

    if (normalized.length < 3) {
      return NextResponse.json({
        results: [],
        message: "Ketik minimal 3 huruf nama Anda.",
      });
    }

    const db = await ensureDbInitialized();
    const evRes = await db.execute({
      sql: `SELECT id, attendance_mode, is_attendance_open FROM events WHERE slug = ? LIMIT 1`,
      args: [slug],
    });
    if (evRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Webinar tidak ditemukan." },
        { status: 404 }
      );
    }

    const ev = evRes.rows[0];
    const searchRes = await db.execute({
      sql: `
        SELECT id, nama_asli, instansi, email, phone, role, is_attended, uuid_qr
        FROM participants
        WHERE event_id = ? AND nama_key LIKE ?
        ORDER BY is_attended ASC, nama_asli ASC
        LIMIT 10
      `,
      args: [String(ev.id), `%${normalized}%`],
    });

    const results = searchRes.rows.map((r) => {
      const attended = Number(r.is_attended ?? 0) === 1;
      return {
        id: String(r.id),
        nama_asli: String(r.nama_asli),
        instansi: String(r.instansi ?? ""),
        role: String(r.role ?? "Peserta"),
        masked_email: maskEmail(r.email ? String(r.email) : ""),
        masked_phone: maskPhone(r.phone ? String(r.phone) : ""),
        is_attended: attended,
        uuid_qr: attended && r.uuid_qr ? String(r.uuid_qr) : null,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search registered error:", error);
    return NextResponse.json(
      { error: "Gagal mencari data peserta." },
      { status: 500 }
    );
  }
}
