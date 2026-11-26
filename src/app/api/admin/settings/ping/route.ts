import { NextResponse } from "next/server";
import { ensureDbInitialized, getDbMode } from "@/lib/db";

export async function POST() {
  try {
    const start = performance.now();
    const db = await ensureDbInitialized();
    await db.execute("SELECT 1 AS ping");
    const latencyMs = Math.round((performance.now() - start) * 10) / 10;

    return NextResponse.json({
      ok: true,
      dbMode: getDbMode(),
      latencyMs,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DB ping error:", error);
    return NextResponse.json(
      { error: "Koneksi database gagal." },
      { status: 500 }
    );
  }
}
