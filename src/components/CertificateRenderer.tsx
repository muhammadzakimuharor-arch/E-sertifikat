"use client";

import { useEffect, useRef, useState } from "react";
import {
  CERT_CANVAS_WIDTH,
  DEFAULT_TEMPLATE_URL,
} from "@/lib/certificate-layout";
import type { LayoutConfig, TextLayerConfig } from "@/lib/types";
import { QrCodeImage } from "./QrCodeImage";

export type StudioLayerKey = "name" | "certNumber" | "role" | "qr";

interface CertificateRendererProps {
  templateUrl?: string;
  layout: LayoutConfig;
  participantName: string;
  certNumber: string;
  role: string;
  verifyUrl: string;
  interactive?: boolean;
  selectedLayer?: StudioLayerKey;
  onSelectLayer?: (layer: StudioLayerKey) => void;
  onMoveLayer?: (layer: StudioLayerKey, xPct: number, yPct: number) => void;
  className?: string;
}

export function CertificateRenderer({
  templateUrl,
  layout,
  participantName,
  certNumber,
  role,
  verifyUrl,
  interactive = false,
  selectedLayer,
  onSelectLayer,
  onMoveLayer,
  className = "",
}: CertificateRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState<number>(760);
  const [imgSrc, setImgSrc] = useState<string>(
    templateUrl?.trim() || DEFAULT_TEMPLATE_URL
  );

  useEffect(() => {
    setImgSrc(templateUrl?.trim() || DEFAULT_TEMPLATE_URL);
  }, [templateUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setStageWidth(rect.width);
    };
    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = stageWidth / CERT_CANVAS_WIDTH;

  const startDrag = (
    e: React.PointerEvent<HTMLDivElement>,
    layer: StudioLayerKey,
    currentX: number,
    currentY: number
  ) => {
    if (!interactive || !onMoveLayer) return;
    e.stopPropagation();
    e.preventDefault();
    onSelectLayer?.(layer);

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const handleMove = (moveEvent: PointerEvent) => {
      const dxPct = ((moveEvent.clientX - startClientX) / rect.width) * 100;
      const dyPct = ((moveEvent.clientY - startClientY) / rect.height) * 100;
      const nextX = Math.max(2, Math.min(98, Math.round((currentX + dxPct) * 10) / 10));
      const nextY = Math.max(2, Math.min(98, Math.round((currentY + dyPct) * 10) / 10));
      onMoveLayer(layer, nextX, nextY);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const renderTextLayer = (
    key: Exclude<StudioLayerKey, "qr">,
    text: string,
    cfg: TextLayerConfig
  ) => {
    if (!cfg.visible) return null;
    const isSelected = interactive && selectedLayer === key;
    const displayText = cfg.uppercase ? text.toUpperCase() : text;

    let transform = "translate(-50%, -50%)";
    if (cfg.align === "left") transform = "translate(0%, -50%)";
    if (cfg.align === "right") transform = "translate(-100%, -50%)";

    const fontStack =
      cfg.fontFamily === "JetBrains Mono"
        ? "var(--font-jetbrains), 'JetBrains Mono', monospace"
        : cfg.fontFamily === "Georgia" || cfg.fontFamily === "Times New Roman"
        ? `"${cfg.fontFamily}", Georgia, serif`
        : "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif";

    return (
      <div
        key={key}
        onPointerDown={(e) => startDrag(e, key, cfg.xPct, cfg.yPct)}
        onClick={(e) => {
          if (interactive) {
            e.stopPropagation();
            onSelectLayer?.(key);
          }
        }}
        style={{
          left: `${cfg.xPct}%`,
          top: `${cfg.yPct}%`,
          width: `${cfg.maxWidthPct}%`,
          transform,
          fontSize: `${Math.max(8, cfg.fontSize * scale)}px`,
          fontFamily: fontStack,
          fontWeight: cfg.fontWeight,
          color: cfg.color,
          textAlign: cfg.align,
          lineHeight: 1.22,
        }}
        className={`absolute z-10 break-words select-none transition-shadow ${
          interactive
            ? `cursor-move touch-none rounded px-1.5 py-0.5 ${
                isSelected
                  ? "outline-2 outline-dashed outline-[#0284C7] bg-[#E0F2FE]/30"
                  : "hover:outline-1 hover:outline-dashed hover:outline-[#7DD3FC]"
              }`
            : "pointer-events-none"
        }`}
      >
        {isSelected && (
          <>
            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#0284C7] rounded-xs" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#0284C7] rounded-xs" />
            <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#0284C7] rounded-xs" />
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#0284C7] rounded-xs" />
          </>
        )}
        {displayText}
      </div>
    );
  };

  const qrPixelSize = Math.max(28, (layout.qr.sizePct / 100) * stageWidth);
  const isQrSelected = interactive && selectedLayer === "qr";

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[2000/1414] bg-white rounded-lg overflow-hidden border border-[#E2E8F0] shadow-sm select-none ${className}`}
    >
      {/* Blank Certificate Background Template */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt="Template Sertifikat"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        onError={() => {
          if (imgSrc !== DEFAULT_TEMPLATE_URL) {
            setImgSrc(DEFAULT_TEMPLATE_URL);
          }
        }}
      />

      {renderTextLayer("certNumber", certNumber, layout.certNumber)}
      {renderTextLayer("name", participantName, layout.name)}
      {renderTextLayer("role", role, layout.role)}

      {layout.qr.visible && (
        <div
          onPointerDown={(e) =>
            startDrag(e, "qr", layout.qr.xPct, layout.qr.yPct)
          }
          onClick={(e) => {
            if (interactive) {
              e.stopPropagation();
              onSelectLayer?.("qr");
            }
          }}
          style={{
            left: `${layout.qr.xPct}%`,
            top: `${layout.qr.yPct}%`,
            width: `${qrPixelSize}px`,
            height: `${qrPixelSize}px`,
            transform: "translate(-50%, -50%)",
          }}
          className={`absolute z-10 bg-white p-[3px] rounded-md shadow-xs flex items-center justify-center ${
            interactive
              ? `cursor-move touch-none ${
                  isQrSelected
                    ? "outline-2 outline-dashed outline-[#0284C7] ring-2 ring-[#E0F2FE]"
                    : "hover:outline-1 hover:outline-dashed hover:outline-[#7DD3FC]"
                }`
              : "pointer-events-none"
          }`}
        >
          <QrCodeImage
            value={verifyUrl}
            size={Math.round(qrPixelSize)}
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
