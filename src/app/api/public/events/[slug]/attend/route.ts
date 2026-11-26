import { NextResponse } from "next/server";
import {
  AttendanceError,
  attendOpenParticipant,
  attendStrictParticipant,
} from "@/lib/attendance-service";
import { revalidateEventRelatedCaches } from "@/lib/cache";
import { getEventBySlug } from "@/lib/queries";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const event = await getEventBySlug(slug);
    if (!event) {
      return NextResponse.json(
        { error: "Webinar tidak ditemukan." },
        { status: 404 }
      );
    }

    if (event.is_attendance_open !== 1) {
      return NextResponse.json(
        { error: "Sesi absensi untuk webinar ini telah ditutup." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      participantId?: string;
      nama_asli?: string;
      instansi?: string;
      email?: string;
      phone?: string;
      role?: string;
    };

    if (event.attendance_mode === "strict") {
      if (!body.participantId) {
        return NextResponse.json(
          { error: "Silakan pilih identitas Anda dari daftar terlebih dahulu." },
          { status: 400 }
        );
      }
      const result = await attendStrictParticipant({
        slug,
        participantId: body.participantId,
      });
      revalidateEventRelatedCaches(slug);
      return NextResponse.json({
        ok: true,
        uuid_qr: result.participant.uuid_qr,
        nomor_sertifikat: result.participant.nomor_sertifikat,
        alreadyAttended: result.alreadyAttended,
      });
    }

    const result = await attendOpenParticipant({
      slug,
      namaAsli: body.nama_asli || "",
      instansi: body.instansi || "",
      email: body.email || "",
      phone: body.phone || "",
      role: body.role || "Peserta",
    });

    revalidateEventRelatedCaches(slug);
    return NextResponse.json({
      ok: true,
      uuid_qr: result.participant.uuid_qr,
      nomor_sertifikat: result.participant.nomor_sertifikat,
      alreadyAttended: result.alreadyAttended,
    });
  } catch (error) {
    if (error instanceof AttendanceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Attend error:", error);
    return NextResponse.json(
      { error: "Gagal memproses absensi." },
      { status: 500 }
    );
  }
}
