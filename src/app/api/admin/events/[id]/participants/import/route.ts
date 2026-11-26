import { NextResponse } from "next/server";
import { revalidateEventRelatedCaches } from "@/lib/cache";
import { ensureDbInitialized } from "@/lib/db";
import { normalizeNamaKey } from "@/lib/utils";

interface ImportRowInput {
  nama_asli: string;
  instansi?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      rows?: ImportRowInput[];
      skipDuplicates?: boolean;
    };

    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada baris data peserta untuk diimpor." },
        { status: 400 }
      );
    }

    const db = await ensureDbInitialized();
    const evRes = await db.execute({
      sql: `SELECT id FROM events WHERE id = ? LIMIT 1`,
      args: [id],
    });
    if (evRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Webinar tidak ditemukan." },
        { status: 404 }
      );
    }

    const existingRes = await db.execute({
      sql: `SELECT nama_key FROM participants WHERE event_id = ?`,
      args: [id],
    });
    const existingKeys = new Set(
      existingRes.rows.map((r) => String(r.nama_key))
    );

    let inserted = 0;
    let skipped = 0;
    const nowIso = new Date().toISOString();
    const statements: { sql: string; args: (string | number | null)[] }[] = [];

    for (const item of rows) {
      const cleanName = (item.nama_asli || "").trim().replace(/\s+/g, " ");
      if (!cleanName) {
        skipped += 1;
        continue;
      }
      const namaKey = normalizeNamaKey(cleanName);
      if (existingKeys.has(namaKey)) {
        skipped += 1;
        continue;
      }
      existingKeys.add(namaKey);

      statements.push({
        sql: `
          INSERT INTO participants (
            id, event_id, uuid_qr, nama_asli, nama_key, instansi, email, phone,
            role, is_attended, attended_at, nomor_sertifikat, created_at
          ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?)
        `,
        args: [
          crypto.randomUUID(),
          id,
          cleanName,
          namaKey,
          (item.instansi || "").trim(),
          (item.email || "").trim(),
          (item.phone || "").trim(),
          (item.role || "Peserta").trim() || "Peserta",
          nowIso,
        ],
      });
      inserted += 1;
    }

    // Execute inserts in chunked atomic HTTP batches (100 rows per batch) so large imports stay under 200ms on Turso.
    for (let i = 0; i < statements.length; i += 100) {
      await db.batch(statements.slice(i, i + 100), "write");
    }

    revalidateEventRelatedCaches();
    return NextResponse.json({
      ok: true,
      inserted,
      skipped,
      total: rows.length,
    });
  } catch (error) {
    console.error("Import participants error:", error);
    return NextResponse.json(
      { error: "Gagal mengimpor data peserta." },
      { status: 500 }
    );
  }
}
