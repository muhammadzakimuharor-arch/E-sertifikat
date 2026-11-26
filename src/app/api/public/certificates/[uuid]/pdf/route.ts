import { NextRequest, NextResponse } from "next/server";
import { buildServerCertificatePdf } from "@/lib/certificate-pdf-server";
import { getParticipantByUuid } from "@/lib/queries";
import { getAppUrl } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await context.params;
    const record = await getParticipantByUuid(uuid);
    if (!record) {
      return NextResponse.json(
        { error: "Sertifikat tidak ditemukan." },
        { status: 404 }
      );
    }

    if (record.event.is_download_open !== 1) {
      return NextResponse.json(
        { error: "Unduhan sertifikat untuk acara ini sedang dinonaktifkan." },
        { status: 403 }
      );
    }

    const appUrl = getAppUrl(request.nextUrl.origin);
    const verifyUrl = `${appUrl}/verify/${uuid}`;
    const pdfBytes = await buildServerCertificatePdf({
      event: record.event,
      participant: record.participant,
      verifyUrl,
    });

    const safeName =
      record.participant.nama_asli
        .replace(/[^a-zA-Z0-9\s_-]/g, "")
        .trim()
        .replace(/\s+/g, "_") || "Peserta";

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Sertifikat_${safeName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Server PDF error:", error);
    return NextResponse.json(
      { error: "Gagal membuat file PDF sertifikat." },
      { status: 500 }
    );
  }
}
