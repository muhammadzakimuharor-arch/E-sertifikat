import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/lib/db";
import { normalizeNamaKey } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const rawQuery = request.nextUrl.searchParams.get("q") || "";
    const trimmed = rawQuery.trim();
    const normalized = normalizeNamaKey(trimmed);

    if (trimmed.length < 3) {
      return NextResponse.json({
        results: [],
        message: "Ketik minimal 3 karakter nama atau nomor sertifikat.",
      });
    }

    const db = await ensureDbInitialized();
    const evRes = await db.execute({
      sql: `SELECT id, is_download_open FROM events WHERE slug = ? LIMIT 1`,
      args: [slug],
    });
    if (evRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Webinar tidak ditemukan." },
        { status: 404 }
      );
    }

    const ev = evRes.rows[0];
    const res = await db.execute({
      sql: `
        SELECT id, uuid_qr, nama_asli, instansi, role, nomor_sertifikat, attended_at
        FROM participants
        WHERE event_id = ?
          AND is_attended = 1
          AND (
            nama_key LIKE ?
            OR LOWER(COALESCE(nomor_sertifikat, '')) LIKE ?
          )
        ORDER BY attended_at DESC, nama_asli ASC
        LIMIT 10
      `,
      args: [
        String(ev.id),
        `%${normalized}%`,
        `%${trimmed.toLowerCase()}%`,
      ],
    });

    const results = res.rows.map((r) => ({
      id: String(r.id),
      uuid_qr: String(r.uuid_qr || ""),
      nama_asli: String(r.nama_asli),
      instansi: String(r.instansi ?? ""),
      role: String(r.role ?? "Peserta"),
      nomor_sertifikat: String(r.nomor_sertifikat ?? ""),
      attended_at: r.attended_at ? String(r.attended_at) : null,
    }));

    return NextResponse.json({
      results,
      is_download_open: Number(ev.is_download_open ?? 1) === 1,
    });
  } catch (error) {
    console.error("Search certificates error:", error);
    return NextResponse.json(
      { error: "Gagal mencari sertifikat." },
      { status: 500 }
    );
  }
}
