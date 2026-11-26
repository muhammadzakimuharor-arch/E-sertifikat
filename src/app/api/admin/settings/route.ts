import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { CACHE_TAGS, revalidateAppCaches } from "@/lib/cache";
import { ensureDbInitialized, getDbMode } from "@/lib/db";
import { getSiteSettings } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get("action");
    const db = await ensureDbInitialized();

    if (action === "backup") {
      const [events, participants, settings, logs] = await Promise.all([
        db.execute("SELECT * FROM events"),
        db.execute("SELECT * FROM participants"),
        db.execute("SELECT * FROM site_settings"),
        db.execute("SELECT * FROM verification_logs ORDER BY checked_at DESC LIMIT 500"),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        db_mode: getDbMode(),
        site_settings: settings.rows,
        events: events.rows,
        participants: participants.rows,
        verification_logs: logs.rows,
      };

      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="vericert-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json"`,
        },
      });
    }

    const settings = await getSiteSettings();
    const countsRes = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM events) AS events_count,
        (SELECT COUNT(*) FROM participants WHERE is_attended = 1) AS issued_certs_count,
        (SELECT COUNT(*) FROM verification_logs) AS logs_count
    `);
    const row = countsRes.rows[0];

    return NextResponse.json({
      settings,
      dbMode: getDbMode(),
      stats: {
        eventsCount: Number(row?.events_count ?? 0),
        issuedCertsCount: Number(row?.issued_certs_count ?? 0),
        logsCount: Number(row?.logs_count ?? 0),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Gagal memuat pengaturan." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: "site" | "password";
      org_name?: string;
      default_organizer?: string;
      contact_email?: string;
      logo_url?: string;
      verification_footer?: string;
      current_password?: string;
      new_password?: string;
    };

    const db = await ensureDbInitialized();

    if (body.type === "password") {
      const session = await getAdminSession();
      if (!session) {
        return NextResponse.json(
          { error: "Sesi tidak valid." },
          { status: 401 }
        );
      }

      const currentPassword = body.current_password || "";
      const newPassword = body.new_password || "";
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      const adminRes = await db.execute({
        sql: `SELECT id, password_hash FROM admins WHERE id = ? LIMIT 1`,
        args: [session.sub],
      });
      if (adminRes.rows.length === 0) {
        return NextResponse.json(
          { error: "Akun admin tidak ditemukan." },
          { status: 404 }
        );
      }

      const valid = await bcrypt.compare(
        currentPassword,
        String(adminRes.rows[0].password_hash)
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Kata sandi saat ini tidak sesuai." },
          { status: 400 }
        );
      }

      const nextHash = await bcrypt.hash(newPassword, 10);
      await db.execute({
        sql: `UPDATE admins SET password_hash = ? WHERE id = ?`,
        args: [nextHash, session.sub],
      });

      return NextResponse.json({ ok: true });
    }

    const pairs: [string, string][] = [
      ["org_name", (body.org_name || "").trim()],
      ["default_organizer", (body.default_organizer || "").trim()],
      ["contact_email", (body.contact_email || "").trim()],
      ["logo_url", (body.logo_url || "").trim()],
      ["verification_footer", (body.verification_footer || "").trim()],
    ];

    await db.batch(
      pairs.map(([key, value]) => ({
        sql: `INSERT INTO site_settings (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [key, value],
      })),
      "write"
    );

    revalidateAppCaches([CACHE_TAGS.SETTINGS, CACHE_TAGS.PUBLIC_HOME]);
    const updated = await getSiteSettings();
    return NextResponse.json({ ok: true, settings: updated });
  } catch (error) {
    console.error("PATCH /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan." },
      { status: 500 }
    );
  }
}
