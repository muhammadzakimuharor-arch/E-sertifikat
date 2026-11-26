"use client";

import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import {
  CERT_CANVAS_HEIGHT,
  CERT_CANVAS_WIDTH,
  DEFAULT_TEMPLATE_URL,
} from "./certificate-layout";
import type { LayoutConfig, TextLayerConfig } from "./types";

export interface CertificateRenderPayload {
  templateUrl: string;
  layout: LayoutConfig;
  participantName: string;
  certNumber: string;
  role: string;
  verifyUrl: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar template: ${src}`));
    img.src = src;
  });
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  layer: TextLayerConfig
) {
  if (!layer.visible || !text) return;

  const content = layer.uppercase ? text.toUpperCase() : text;
  const x = (layer.xPct / 100) * CERT_CANVAS_WIDTH;
  const y = (layer.yPct / 100) * CERT_CANVAS_HEIGHT;
  const maxWidth = (layer.maxWidthPct / 100) * CERT_CANVAS_WIDTH;

  ctx.save();
  ctx.fillStyle = layer.color || "#0F172A";
  ctx.textAlign = layer.align || "center";
  ctx.textBaseline = "middle";
  ctx.font = `${layer.fontWeight || "700"} ${layer.fontSize || 42}px "${layer.fontFamily || "Plus Jakarta Sans"}", sans-serif`;

  const words = content.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth || !currentLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = (layer.fontSize || 42) * 1.22;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, idx) => {
    ctx.fillText(line, x, startY + idx * lineHeight, maxWidth);
  });

  ctx.restore();
}

/**
 * Renders the exact certificate composition (template + dynamic text + scannable QR)
 * onto a high-resolution 2000x1414 HTML5 canvas and wraps it into an A4 Landscape PDF.
 */
export async function generateCertificatePdfBytes(
  payload: CertificateRenderPayload
): Promise<Uint8Array> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CERT_CANVAS_WIDTH;
  canvas.height = CERT_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context tidak tersedia.");
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CERT_CANVAS_WIDTH, CERT_CANVAS_HEIGHT);

  const templateSrc = payload.templateUrl?.trim() || DEFAULT_TEMPLATE_URL;
  try {
    const bgImg = await loadImage(templateSrc);
    ctx.drawImage(bgImg, 0, 0, CERT_CANVAS_WIDTH, CERT_CANVAS_HEIGHT);
  } catch {
    if (templateSrc !== DEFAULT_TEMPLATE_URL) {
      const fallbackImg = await loadImage(DEFAULT_TEMPLATE_URL);
      ctx.drawImage(fallbackImg, 0, 0, CERT_CANVAS_WIDTH, CERT_CANVAS_HEIGHT);
    }
  }

  drawWrappedText(ctx, payload.certNumber, payload.layout.certNumber);
  drawWrappedText(ctx, payload.participantName, payload.layout.name);
  drawWrappedText(ctx, payload.role, payload.layout.role);

  if (payload.layout.qr.visible) {
    const qrSize = (payload.layout.qr.sizePct / 100) * CERT_CANVAS_WIDTH;
    const qrCenterX = (payload.layout.qr.xPct / 100) * CERT_CANVAS_WIDTH;
    const qrCenterY = (payload.layout.qr.yPct / 100) * CERT_CANVAS_HEIGHT;

    const qrDataUrl = await QRCode.toDataURL(payload.verifyUrl, {
      width: Math.max(256, Math.round(qrSize)),
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    const qrImg = await loadImage(qrDataUrl);
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    const pad = 10;
    ctx.fillRect(
      qrCenterX - qrSize / 2 - pad,
      qrCenterY - qrSize / 2 - pad,
      qrSize + pad * 2,
      qrSize + pad * 2
    );
    ctx.drawImage(
      qrImg,
      qrCenterX - qrSize / 2,
      qrCenterY - qrSize / 2,
      qrSize,
      qrSize
    );
    ctx.restore();
  }

  const pngDataUrl = canvas.toDataURL("image/png");
  const base64 = pngDataUrl.split(",")[1];
  const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const pdfDoc = await PDFDocument.create();
  // A4 Landscape in points: 841.89 x 595.28
  const page = pdfDoc.addPage([841.89, 595.28]);
  const embeddedPng = await pdfDoc.embedPng(pngBytes);
  page.drawImage(embeddedPng, {
    x: 0,
    y: 0,
    width: 841.89,
    height: 595.28,
  });

  pdfDoc.setTitle(`Sertifikat - ${payload.participantName}`);
  pdfDoc.setCreator("VeriCert Platform");

  return pdfDoc.save();
}

export async function downloadCertificatePdf(
  payload: CertificateRenderPayload,
  fallbackServerPdfUrl?: string
): Promise<void> {
  const safeFile =
    payload.participantName
      .replace(/[^a-zA-Z0-9\s_-]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "Peserta";
  const filename = `Sertifikat_${safeFile}.pdf`;

  try {
    const pdfBytes = await generateCertificatePdfBytes(payload);
    const blob = new Blob([pdfBytes as BlobPart], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (err) {
    if (fallbackServerPdfUrl) {
      window.open(fallbackServerPdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    throw err;
  }
}
