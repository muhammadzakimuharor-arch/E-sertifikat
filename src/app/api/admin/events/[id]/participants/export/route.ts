import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getEventById, getEventParticipants } from "@/lib/queries";
import { formatDateTimeWib } from "@/lib/utils";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json(
        { error: "Webinar tidak ditemukan." },
        { status: 404 }
      );
    }

    const participants = await getEventParticipants(id);
    const sheetData = participants.map((p, idx) => ({
      No: idx + 1,
      "Nama Lengkap": p.nama_asli,
      Instansi: p.instansi,
      Email: p.email,
      "No. WhatsApp": p.phone,
      Peran: p.role,
      "Status Absensi": p.is_attended === 1 ? "Sudah Hadir" : "Belum Hadir",
      "Waktu Hadir": p.attended_at ? formatDateTimeWib(p.attended_at) : "—",
      "Nomor Sertifikat": p.nomor_sertifikat || "—",
      "UUID Verifikasi": p.uuid_qr || "—",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      sheetData.length > 0
        ? sheetData
        : [
            {
              No: 1,
              "Nama Lengkap": "",
              Instansi: "",
              Email: "",
              "No. WhatsApp": "",
              Peran: "",
              "Status Absensi": "",
              "Waktu Hadir": "",
              "Nomor Sertifikat": "",
              "UUID Verifikasi": "",
            },
          ]
    );
    XLSX.utils.book_append_sheet(wb, ws, "Data Peserta");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const filename = `Peserta_${event.slug}.xlsx`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export participants error:", error);
    return NextResponse.json(
      { error: "Gagal mengekspor Excel." },
      { status: 500 }
    );
  }
}
