import { NextResponse } from "next/server";
import {
  AttendanceError,
  adminCreateParticipant,
} from "@/lib/attendance-service";
import { revalidateEventRelatedCaches } from "@/lib/cache";
import { getEventParticipants } from "@/lib/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const participants = await getEventParticipants(id);
    return NextResponse.json({ participants });
  } catch (error) {
    console.error("GET participants error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar peserta." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      nama_asli?: string;
      instansi?: string;
      email?: string;
      phone?: string;
      role?: string;
      mark_attended?: boolean;
    };

    const participant = await adminCreateParticipant({
      eventId: id,
      namaAsli: body.nama_asli || "",
      instansi: body.instansi || "",
      email: body.email || "",
      phone: body.phone || "",
      role: body.role || "Peserta",
      markAttended: Boolean(body.mark_attended),
    });

    revalidateEventRelatedCaches();
    return NextResponse.json({ ok: true, participant }, { status: 201 });
  } catch (error) {
    if (error instanceof AttendanceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("POST participant error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan peserta." },
      { status: 500 }
    );
  }
}
