import { after, NextResponse } from "next/server";
import { CACHE_TAGS, revalidateAppCaches } from "@/lib/cache";
import { ensureDbInitialized } from "@/lib/db";
import { recordVerificationLog } from "@/lib/queries";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = (body.code || "").trim();

    if (!code) {
      return NextResponse.json(
        { error: "Masukkan nomor sertifikat atau kode verifikasi." },
        { status: 400 }
      );
    }

    const db = await ensureDbInitialized();
    const lookupRes = await db.execute({
      sql: `
        SELECT
          p.id, p.uuid_qr, p.nama_asli, p.nomor_sertifikat,
          e.title AS event_title
        FROM participants p
        JOIN events e ON e.id = p.event_id
        WHERE p.is_attended = 1
          AND (
            LOWER(TRIM(COALESCE(p.nomor_sertifikat, ''))) = LOWER(?)
            OR LOWER(TRIM(COALESCE(p.uuid_qr, ''))) = LOWER(?)
          )
        LIMIT 1
      `,
      args: [code, code],
    });

    if (lookupRes.rows.length > 0) {
      const row = lookupRes.rows[0];
      after(async () => {
        try {
          await recordVerificationLog({
            queriedCode: code,
            method: "manual",
            status: "valid",
            participantId: String(row.id),
            participantName: String(row.nama_asli),
            eventTitle: String(row.event_title),
            certNumber: String(row.nomor_sertifikat || ""),
          });
          revalidateAppCaches([
            CACHE_TAGS.PUBLIC_HOME,
            CACHE_TAGS.LOGS,
            CACHE_TAGS.ADMIN_DASHBOARD,
          ]);
        } catch (err) {
          console.error("Async manual verify log error:", err);
        }
      });

      return NextResponse.json({
        valid: true,
        uuid_qr: String(row.uuid_qr),
      });
    }

    after(async () => {
      try {
        await recordVerificationLog({
          queriedCode: code,
          method: "manual",
          status: "invalid",
        });
        revalidateAppCaches([
          CACHE_TAGS.PUBLIC_HOME,
          CACHE_TAGS.LOGS,
          CACHE_TAGS.ADMIN_DASHBOARD,
        ]);
      } catch (err) {
        console.error("Async manual invalid verify log error:", err);
      }
    });

    return NextResponse.json({
      valid: false,
      code,
    });
  } catch (error) {
    console.error("Manual verify error:", error);
    return NextResponse.json(
      { error: "Gagal memproses verifikasi sertifikat." },
      { status: 500 }
    );
  }
}
