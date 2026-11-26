import { NextResponse } from "next/server";
import {
  AttendanceError,
  adminMarkParticipantAttended,
} from "@/lib/attendance-service";
import { revalidateEventRelatedCaches } from "@/lib/cache";
import { ensureDbInitialized } from "@/lib/db";
import { mapParticipantRow } from "@/lib/queries";
import { normalizeNamaKey } from "@/lib/utils";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await context.params;
    const body = (await request.json()) as {
      action?: "mark_attended" | "update";
      nama_asli?: string;
      instansi?: string;
      email?: string;
      phone?: string;
      role?: string;
    };

    if (body.action === "mark_attended") {
      const result = await adminMarkParticipantAttended(id, participantId);
      revalidateEventRelatedCaches();
      return NextResponse.json({
        ok: true,
        participant: result.participant,
        alreadyAttended: result.alreadyAttended,
      });
    }

    const db = await ensureDbInitialized();
    const existingRes = await db.execute({
      sql: `SELECT * FROM participants WHERE id = ? AND event_id = ? LIMIT 1`,
      args: [participantId, id],
    });
    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    const cleanName = (body.nama_asli || "").trim().replace(/\s+/g, " ");
    if (!cleanName) {
      return NextResponse.json(
        { error: "Nama lengkap peserta tidak boleh kosong." },
        { status: 400 }
      );
    }
    const namaKey = normalizeNamaKey(cleanName);

    const dupRes = await db.execute({
      sql: `SELECT id FROM participants WHERE event_id = ? AND nama_key = ? AND id != ? LIMIT 1`,
      args: [id, namaKey, participantId],
    });
    if (dupRes.rows.length > 0) {
      return NextResponse.json(
        { error: `Nama "${cleanName}" sudah digunakan peserta lain pada acara ini.` },
        { status: 409 }
      );
    }

    await db.execute({
      sql: `
        UPDATE participants
        SET nama_asli = ?, nama_key = ?, instansi = ?, email = ?, phone = ?, role = ?
        WHERE id = ? AND event_id = ?
      `,
      args: [
        cleanName,
        namaKey,
        (body.instansi ?? "").trim(),
        (body.email ?? "").trim(),
        (body.phone ?? "").trim(),
        (body.role ?? "Peserta").trim() || "Peserta",
        participantId,
        id,
      ],
    });

    const updatedRes = await db.execute({
      sql: `SELECT * FROM participants WHERE id = ? LIMIT 1`,
      args: [participantId],
    });

    revalidateEventRelatedCaches();
    return NextResponse.json({
      ok: true,
      participant: mapParticipantRow(updatedRes.rows[0]),
    });
  } catch (error) {
    if (error instanceof AttendanceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("PATCH participant error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data peserta." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await context.params;
    const db = await ensureDbInitialized();
    await db.execute({
      sql: `DELETE FROM participants WHERE id = ? AND event_id = ?`,
      args: [participantId, id],
    });
    revalidateEventRelatedCaches();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE participant error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus peserta." },
      { status: 500 }
    );
  }
}
