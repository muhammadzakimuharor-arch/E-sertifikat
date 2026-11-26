"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QrCodeImageProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function QrCodeImage({
  value,
  size = 220,
  className = "",
  alt = "QR Code Verifikasi",
}: QrCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value || "https://vericert.id", {
      width: Math.max(180, size * 2),
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg animate-pulse ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`block select-none ${className}`}
      draggable={false}
    />
  );
}
