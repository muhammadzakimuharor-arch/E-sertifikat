import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";
import { parseLayoutConfig } from "./certificate-layout";
import type { EventRecord, ParticipantRecord } from "./types";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return rgb(15 / 255, 23 / 255, 42 / 255);
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return rgb(15 / 255, 23 / 255, 42 / 255);
  }
  return rgb(r, g, b);
}

/**
 * Generates an A4 Landscape PDF on the server using pdf-lib + QRCode PNG.
 * Used as the direct-download API route `/api/public/certificates/[uuid]/pdf`.
 */
export async function buildServerCertificatePdf(params: {
  event: EventRecord;
  participant: ParticipantRecord;
  verifyUrl: string;
}): Promise<Uint8Array> {
  const { event, participant, verifyUrl } = params;
  const layout = parseLayoutConfig(event.layout_config);

  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const scale = pageWidth / 2000;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Background white + subtle sky border if template is raster or SVG
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(1, 1, 1),
  });

  let embeddedBg = false;
  if (event.template_url && event.template_url.startsWith("/uploads/")) {
    try {
      const localPath = path.join(
        process.cwd(),
        "public",
        event.template_url.replace(/^\/+/, "")
      );
      const buf = await fs.readFile(localPath);
      if (event.template_url.toLowerCase().endsWith(".png")) {
        const img = await pdfDoc.embedPng(buf);
        page.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        embeddedBg = true;
      } else if (
        event.template_url.toLowerCase().endsWith(".jpg") ||
        event.template_url.toLowerCase().endsWith(".jpeg")
      ) {
        const img = await pdfDoc.embedJpg(buf);
        page.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        embeddedBg = true;
      }
    } catch {
      embeddedBg = false;
    }
  } else if (
    event.template_url &&
    event.template_url.startsWith("https://") &&
    !event.template_url.toLowerCase().endsWith(".svg")
  ) {
    try {
      const res = await fetch(event.template_url);
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        const buf = await res.arrayBuffer();
        if (contentType.includes("png")) {
          const img = await pdfDoc.embedPng(buf);
          page.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });
          embeddedBg = true;
        } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
          const img = await pdfDoc.embedJpg(buf);
          page.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });
          embeddedBg = true;
        }
      }
    } catch {
      embeddedBg = false;
    }
  }

  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const sansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const monoBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  if (!embeddedBg) {
    page.drawRectangle({
      x: 20,
      y: 20,
      width: pageWidth - 40,
      height: pageHeight - 40,
      color: rgb(248 / 255, 251 / 255, 255 / 255),
      borderColor: rgb(186 / 255, 230 / 255, 253 / 255),
      borderWidth: 2,
    });
    page.drawRectangle({
      x: 30,
      y: 30,
      width: pageWidth - 60,
      height: pageHeight - 60,
      color: rgb(1, 1, 1),
      borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
      borderWidth: 1,
    });

    const headerTitle = "SERTIFIKAT PENGHARGAAN";
    const hw = sansBold.widthOfTextAtSize(headerTitle, 26);
    page.drawText(headerTitle, {
      x: (pageWidth - hw) / 2,
      y: pageHeight - 105,
      size: 26,
      font: sansBold,
      color: rgb(15 / 255, 23 / 255, 42 / 255),
    });

    const evTitle = event.title.slice(0, 75);
    const ewv = sansRegular.widthOfTextAtSize(evTitle, 12);
    page.drawText(evTitle, {
      x: (pageWidth - ewv) / 2,
      y: pageHeight - 130,
      size: 12,
      font: sansRegular,
      color: rgb(100 / 255, 116 / 255, 139 / 255),
    });

    page.drawText(event.organizer, {
      x: 65,
      y: 72,
      size: 11,
      font: sansBold,
      color: rgb(15 / 255, 23 / 255, 42 / 255),
    });
    page.drawText(`Tanggal: ${event.event_date}`, {
      x: 65,
      y: 55,
      size: 10,
      font: sansRegular,
      color: rgb(100 / 255, 116 / 255, 139 / 255),
    });
  }

  const drawTextLayer = (
    rawText: string,
    cfg: typeof layout.name,
    isMono = false
  ) => {
    if (!cfg.visible || !rawText) return;
    const text = cfg.uppercase ? rawText.toUpperCase() : rawText;
    const font = isMono
      ? monoBold
      : Number(cfg.fontWeight) >= 600
      ? sansBold
      : sansRegular;
    const fontSize = Math.max(8, cfg.fontSize * scale);
    const width = font.widthOfTextAtSize(text, fontSize);
    const xCenter = (cfg.xPct / 100) * pageWidth;
    const yPdf = pageHeight - (cfg.yPct / 100) * pageHeight - fontSize * 0.35;
    let drawX = xCenter - width / 2;
    if (cfg.align === "left") drawX = xCenter;
    if (cfg.align === "right") drawX = xCenter - width;

    page.drawText(text, {
      x: Math.max(36, Math.min(pageWidth - width - 36, drawX)),
      y: yPdf,
      size: fontSize,
      font,
      color: hexToRgb(cfg.color),
    });
  };

  drawTextLayer(participant.nomor_sertifikat || "", layout.certNumber, true);
  drawTextLayer(participant.nama_asli, layout.name, false);
  drawTextLayer(participant.role, layout.role, false);

  if (layout.qr.visible) {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrImg = await pdfDoc.embedPng(Buffer.from(qrBase64, "base64"));
    const qrSize = (layout.qr.sizePct / 100) * pageWidth;
    const qrX = (layout.qr.xPct / 100) * pageWidth - qrSize / 2;
    const qrY = pageHeight - (layout.qr.yPct / 100) * pageHeight - qrSize / 2;

    page.drawRectangle({
      x: qrX - 4,
      y: qrY - 4,
      width: qrSize + 8,
      height: qrSize + 8,
      color: rgb(1, 1, 1),
    });
    page.drawImage(qrImg, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
  }

  pdfDoc.setTitle(`Sertifikat - ${participant.nama_asli}`);
  pdfDoc.setCreator("VeriCert Platform");

  return pdfDoc.save();
}
