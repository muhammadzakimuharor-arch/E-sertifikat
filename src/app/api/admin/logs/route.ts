import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/lib/db";
import { formatDateTimeWib } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const status = searchParams.get("status") || "all";
    const method = searchParams.get("method") || "all";
    const range = searchParams.get("range") || "all";
    const format = searchParams.get("format");

    const where: string[] = [];
    const args: string[] = [];

    if (status === "valid" || status === "invalid") {
      where.push("status = ?");
      args.push(status);
    }
    if (method === "qr" || method === "manual") {
      where.push("method = ?");
      args.push(method);
    }
    if (range === "24h") {
      where.push("checked_at >= ?");
      args.push(new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    } else if (range === "7d") {
      where.push("checked_at >= ?");
      args.push(new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString());
    } else if (range === "30d") {
      where.push("checked_at >= ?");
      args.push(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
    }
    if (q) {
      const like = `%${q}%`;
      where.push(
        "(LOWER(queried_code) LIKE ? OR LOWER(COALESCE(participant_name, '')) LIKE ? OR LOWER(COALESCE(cert_number, '')) LIKE ? OR LOWER(COALESCE(event_title, '')) LIKE ?)"
      );
      args.push(like, like, like, like);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const res = await db.execute({
      sql: `SELECT * FROM verification_logs ${whereSql} ORDER BY checked_at DESC LIMIT 500`,
      args,
    });

    const logs = res.rows.map((row) => ({
      id: String(row.id),
      queried_code: String(row.queried_code),
      method: String(row.method) === "manual" ? "manual" : "qr",
      status: String(row.status) === "valid" ? "valid" : "invalid",
      participant_id: row.participant_id ? String(row.participant_id) : null,
      participant_name: row.participant_name
        ? String(row.participant_name)
        : null,
      event_title: row.event_title ? String(row.event_title) : null,
      cert_number: row.cert_number ? String(row.cert_number) : null,
      checked_at: String(row.checked_at),
    }));

    if (format === "csv") {
      const header = [
        "Waktu Cek",
        "Kode Diperiksa",
        "Metode",
        "Status",
        "Nama Peserta",
        "Nomor Sertifikat",
        "Nama Webinar",
      ];
      const csvRows = [header.join(",")];
      for (const l of logs) {
        const escape = (val: string) => `"${val.replaceAll('"', '""')}"`;
        csvRows.push(
          [
            escape(formatDateTimeWib(l.checked_at)),
            escape(l.queried_code),
            escape(l.method === "qr" ? "Scan QR" : "Input Manual"),
            escape(l.status === "valid" ? "Terverifikasi" : "Tidak Ditemukan"),
            escape(l.participant_name || "-"),
            escape(l.cert_number || "-"),
            escape(l.event_title || "-"),
          ].join(",")
        );
      }
      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="log-verifikasi-vericert.csv"`,
        },
      });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/admin/logs error:", error);
    return NextResponse.json(
      { error: "Gagal memuat log verifikasi." },
      { status: 500 }
    );
  }
}
