"use client";

import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignLeft,
  AlignRight,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Info,
  Link2,
  Loader2,
  QrCode,
  Save,
  Sparkles,
  ArrowLeftRight,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  CertificateRenderer,
  type StudioLayerKey,
} from "@/components/CertificateRenderer";
import {
  CERT_CANVAS_HEIGHT,
  CERT_CANVAS_WIDTH,
  DEFAULT_TEMPLATE_URL,
  SECONDARY_TEMPLATE_URL,
  AVAILABLE_FONTS,
  parseLayoutConfig,
  serializeLayoutConfig,
} from "@/lib/certificate-layout";
import { downloadCertificatePdf } from "@/lib/certificate-pdf";
import type {
  EventWithStats,
  LayoutConfig,
  ParticipantRecord,
  TextAlign,
  TextLayerConfig,
} from "@/lib/types";
import { formatCertificateNumber } from "@/lib/utils";

interface CertificateStudioTabProps {
  event: EventWithStats;
  participants: ParticipantRecord[];
  appOrigin: string;
  onEventUpdated: (ev: EventWithStats) => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}

const LAYER_LABELS: Record<StudioLayerKey, string> = {
  name: "Nama Peserta",
  certNumber: "Nomor Sertifikat",
  qr: "QR Code Verifikasi",
  role: "Peran / Kategori",
};

export function CertificateStudioTab({
  event,
  participants,
  appOrigin,
  onEventUpdated,
  onToast,
}: CertificateStudioTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [templateUrl, setTemplateUrl] = useState(
    event.template_url || DEFAULT_TEMPLATE_URL
  );
  const [layout, setLayout] = useState<LayoutConfig>(() =>
    parseLayoutConfig(event.layout_config)
  );
  const [selectedLayer, setSelectedLayer] = useState<StudioLayerKey>("name");
  const [zoom, setZoom] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(
    event.template_url || DEFAULT_TEMPLATE_URL
  );
  const [storageNotice, setStorageNotice] = useState<string>("");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [scanSimulated, setScanSimulated] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const sampleAttended = participants.find(
    (p) => p.is_attended === 1 && p.uuid_qr
  );
  const sampleName = sampleAttended?.nama_asli || "Ahmad Fauzi, S.Kom.";
  const sampleCertNumber =
    sampleAttended?.nomor_sertifikat ||
    formatCertificateNumber(
      event.cert_number_format,
      event.start_number,
      event.number_padding
    );
  const sampleRole = sampleAttended?.role || "Peserta";
  const sampleUuid =
    sampleAttended?.uuid_qr || "a8f92c10-4b7e-491a-9d3c-81f20e5b4412";
  const verifyUrl = `${appOrigin}/verify/${sampleUuid}`;

  const handleMoveLayer = (
    layer: StudioLayerKey,
    xPct: number,
    yPct: number
  ) => {
    setLayout((prev) => ({
      ...prev,
      [layer]: {
        ...prev[layer],
        xPct,
        yPct,
      },
    }));
  };

  const updateTextProp = <K extends keyof TextLayerConfig>(
    layer: Exclude<StudioLayerKey, "qr">,
    key: K,
    value: TextLayerConfig[K]
  ) => {
    setLayout((prev) => ({
      ...prev,
      [layer]: {
        ...prev[layer],
        [key]: value,
      },
    }));
  };

  const toggleLayerVisibility = (layer: StudioLayerKey) => {
    setLayout((prev) => ({
      ...prev,
      [layer]: {
        ...prev[layer],
        visible: !prev[layer].visible,
      },
    }));
  };

  const handleSaveLayout = async (nextTemplateUrl?: string) => {
    setSaving(true);
    const tplToSave = nextTemplateUrl ?? templateUrl;
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_url: tplToSave,
          layout_config: serializeLayoutConfig(layout),
        }),
      });
      const data = (await res.json()) as {
        event?: EventWithStats;
        error?: string;
      };
      if (!res.ok || !data.event) {
        onToast(data.error || "Gagal menyimpan tata letak.", "error");
        return;
      }
      onEventUpdated(data.event);
      onToast("Desain template & tata letak sertifikat disimpan.");
    } catch {
      onToast("Gagal terhubung ke server.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadTemplateFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload-template", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        url?: string;
        storageMode?: "cloudinary" | "local";
        error?: string;
      };
      if (!res.ok || !data.url) {
        onToast(data.error || "Gagal mengunggah gambar template.", "error");
        return;
      }
      setTemplateUrl(data.url);
      setCustomUrlInput(data.url);
      setStorageNotice(
        data.storageMode === "cloudinary"
          ? "Gambar diunggah ke Cloudinary CDN."
          : "Mode Lokal Dev: gambar disimpan di /public/uploads/ (isi CLOUDINARY_* di .env untuk CDN produksi)."
      );
      setTemplateModalOpen(false);
      await handleSaveLayout(data.url);
    } catch {
      onToast("Terjadi kesalahan saat mengunggah file.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrlTemplate = async () => {
    const clean = customUrlInput.trim();
    if (!clean) {
      onToast("URL template tidak boleh kosong.", "error");
      return;
    }
    setTemplateUrl(clean);
    setTemplateModalOpen(false);
    await handleSaveLayout(clean);
  };

  const handleDownloadSamplePdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadCertificatePdf(
        {
          templateUrl,
          layout,
          participantName: sampleName,
          certNumber: sampleCertNumber,
          role: sampleRole,
          verifyUrl,
        },
        sampleAttended
          ? `/api/public/certificates/${sampleUuid}/pdf`
          : undefined
      );
      onToast("Sampel PDF sertifikat berhasil diunduh.");
    } catch {
      onToast(
        "Gagal merender PDF dari gambar eksternal (periksa header CORS URL gambar).",
        "error"
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const activeLayer = layout[selectedLayer];
  const isTextLayer = selectedLayer !== "qr";
  const activeTextLayer = isTextLayer
    ? (layout[selectedLayer] as TextLayerConfig)
    : null;

  const pxX = Math.round((activeLayer.xPct / 100) * CERT_CANVAS_WIDTH);
  const pxY = Math.round((activeLayer.yPct / 100) * CERT_CANVAS_HEIGHT);

  return (
    <div className="flex flex-col gap-4">
      {/* Studio Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E2E8F0] rounded-xl px-4 sm:px-5 py-3">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2 bg-[#F8FBFF] border border-[#E2E8F0] px-3 py-1.5 rounded-lg max-w-full">
            <ImageIcon className="w-4 h-4 text-[#0284C7] shrink-0" strokeWidth={1.5} />
            <span className="font-mono text-[12px] text-[#0F172A] truncate max-w-[200px] sm:max-w-[280px]">
              {templateUrl.split("/").pop() || "template.svg"} • 2000×1414px
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCustomUrlInput(templateUrl);
              setTemplateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] hover:bg-[#EBF5FF] text-[#0F172A] text-[13px] font-medium transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
            <span>Ganti Template</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg p-0.5">
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="bg-transparent font-mono text-[12px] text-[#0F172A] px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value={0.75}>75%</option>
              <option value={1}>100%</option>
              <option value={1.15}>115%</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setScanSimulated(false);
              setPreviewModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0F172A] text-[13px] font-medium transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
            <span>Preview PDF Sample</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveLayout()}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 text-white text-[13px] font-semibold transition-colors cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" strokeWidth={1.6} />
            )}
            <span>Simpan Tata Letak</span>
          </button>
        </div>
      </div>

      {storageNotice && (
        <div className="px-4 py-2.5 rounded-xl bg-[#EBF5FF] border border-[#BAE6FD] text-[#075985] text-[12px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-[#0284C7]" strokeWidth={1.6} />
            <span>{storageNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStorageNotice("")}
            className="p-0.5 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3-Pane Responsive Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4 items-start">
        {/* Left Pane: Template + Layers */}
        <aside className="order-2 lg:order-1 bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Template Dasar
            </span>
            <div className="relative rounded-lg overflow-hidden bg-[#F8FBFF] border border-[#E2E8F0] aspect-[2000/1414]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={templateUrl}
                alt="Preview Template"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="w-full h-9 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0F172A] text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
              <span>Unggah / Ganti</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Elemen & Layer
              </span>
              <span className="font-mono text-[11px] text-[#64748B]">4</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {(["name", "certNumber", "qr", "role"] as StudioLayerKey[]).map(
                (key) => {
                  const isActive = selectedLayer === key;
                  const isVisible = layout[key].visible;
                  const badge =
                    key === "qr" ? "[QR]" : key === "certNumber" ? "[#]" : "[T]";

                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors ${
                        isActive
                          ? "bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]"
                          : "bg-white border-[#E2E8F0] hover:bg-[#F8FBFF] text-[#0F172A]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedLayer(key)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0284C7] font-semibold shrink-0">
                          {badge}
                        </span>
                        <span className="text-[13px] font-medium truncate">
                          {LAYER_LABELS[key]}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleLayerVisibility(key)}
                        title={isVisible ? "Sembunyikan" : "Tampilkan"}
                        className="p-1 rounded hover:bg-white/70 text-[#64748B] cursor-pointer"
                      >
                        {isVisible ? (
                          <Eye className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
                        ) : (
                          <EyeOff className="w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </aside>

        {/* Center Pane: Interactive Drag Canvas */}
        <section
          className="order-1 lg:order-2 bg-[#F8FBFF] border border-[#E2E8F0] rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-auto min-h-[340px] sm:min-h-[520px]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(2, 132, 199, 0.14) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <div className="self-start mb-3 inline-flex items-center gap-2 bg-white border border-[#E2E8F0] px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
            <span className="font-mono text-[11px] text-[#475569]">
              Kanvas Studio • Seret elemen langsung di atas sertifikat
            </span>
          </div>

          <div
            className="w-full max-w-[780px] transition-transform duration-150 origin-top"
            style={{
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            }}
          >
            <CertificateRenderer
              templateUrl={templateUrl}
              layout={layout}
              participantName={sampleName}
              certNumber={sampleCertNumber}
              role={sampleRole}
              verifyUrl={verifyUrl}
              interactive
              selectedLayer={selectedLayer}
              onSelectLayer={setSelectedLayer}
              onMoveLayer={handleMoveLayer}
            />
          </div>
        </section>

        {/* Right Pane: Property Inspector */}
        <aside className="order-3 bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-5">
          <div className="flex items-center justify-between bg-[#F8FBFF] border border-[#E2E8F0] px-3 py-2 rounded-lg">
            <span className="text-[12px] text-[#64748B]">Terpilih:</span>
            <span className="text-[13px] font-bold text-[#0284C7]">
              {LAYER_LABELS[selectedLayer]}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Posisi & Perataan
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg px-2.5 h-10">
                <span className="font-mono text-[11px] text-[#64748B]">X</span>
                <input
                  type="number"
                  min={0}
                  max={CERT_CANVAS_WIDTH}
                  value={pxX}
                  onChange={(e) => {
                    const px = Math.max(
                      0,
                      Math.min(CERT_CANVAS_WIDTH, Number(e.target.value) || 0)
                    );
                    handleMoveLayer(
                      selectedLayer,
                      Math.round((px / CERT_CANVAS_WIDTH) * 1000) / 10,
                      activeLayer.yPct
                    );
                  }}
                  className="w-14 bg-transparent text-right font-mono text-[12px] text-[#0F172A] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg px-2.5 h-10">
                <span className="font-mono text-[11px] text-[#64748B]">Y</span>
                <input
                  type="number"
                  min={0}
                  max={CERT_CANVAS_HEIGHT}
                  value={pxY}
                  onChange={(e) => {
                    const px = Math.max(
                      0,
                      Math.min(CERT_CANVAS_HEIGHT, Number(e.target.value) || 0)
                    );
                    handleMoveLayer(
                      selectedLayer,
                      activeLayer.xPct,
                      Math.round((px / CERT_CANVAS_HEIGHT) * 1000) / 10
                    );
                  }}
                  className="w-14 bg-transparent text-right font-mono text-[12px] text-[#0F172A] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleMoveLayer(selectedLayer, 50, activeLayer.yPct)
              }
              className="w-full h-10 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] hover:bg-[#EBF5FF] text-[#0F172A] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlignHorizontalJustifyCenter
                className="w-4 h-4 text-[#0284C7]"
                strokeWidth={1.5}
              />
              <span>Ratakan Tengah Horizontal</span>
            </button>
          </div>

          {activeTextLayer ? (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Tipografi
              </span>

              <select
                value={activeTextLayer.fontFamily}
                onChange={(e) =>
                  updateTextProp(
                    selectedLayer as Exclude<StudioLayerKey, "qr">,
                    "fontFamily",
                    e.target.value
                  )
                }
                className="w-full h-10 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[13px] text-[#0F172A] focus:outline-none"
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg px-2.5 h-10">
                  <span className="text-[12px] text-[#64748B]">Ukuran</span>
                  <input
                    type="number"
                    min={14}
                    max={140}
                    value={activeTextLayer.fontSize}
                    onChange={(e) =>
                      updateTextProp(
                        selectedLayer as Exclude<StudioLayerKey, "qr">,
                        "fontSize",
                        Math.max(12, Math.min(160, Number(e.target.value) || 24))
                      )
                    }
                    className="w-12 bg-transparent text-right font-mono text-[12px] text-[#0F172A] focus:outline-none"
                  />
                </div>

                <select
                  value={activeTextLayer.fontWeight}
                  onChange={(e) =>
                    updateTextProp(
                      selectedLayer as Exclude<StudioLayerKey, "qr">,
                      "fontWeight",
                      e.target.value as TextLayerConfig["fontWeight"]
                    )
                  }
                  className="h-10 px-2 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[12px] text-[#0F172A] focus:outline-none"
                >
                  <option value="400">Regular 400</option>
                  <option value="500">Medium 500</option>
                  <option value="600">SemiBold 600</option>
                  <option value="700">Bold 700</option>
                  <option value="800">ExtraBold 800</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg px-3 h-10">
                <span className="text-[12px] text-[#64748B]">Warna Teks</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="color"
                    value={activeTextLayer.color}
                    onChange={(e) =>
                      updateTextProp(
                        selectedLayer as Exclude<StudioLayerKey, "qr">,
                        "color",
                        e.target.value
                      )
                    }
                    className="w-6 h-6 rounded border border-[#E2E8F0] cursor-pointer"
                  />
                  <span className="font-mono text-[12px] text-[#0F172A]">
                    {activeTextLayer.color.toUpperCase()}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg p-1">
                  {(["left", "center", "right"] as TextAlign[]).map((align) => {
                    const Icon =
                      align === "left"
                        ? AlignLeft
                        : align === "center"
                        ? AlignCenter
                        : AlignRight;
                    const active = activeTextLayer.align === align;
                    return (
                      <button
                        key={align}
                        type="button"
                        onClick={() =>
                          updateTextProp(
                            selectedLayer as Exclude<StudioLayerKey, "qr">,
                            "align",
                            align
                          )
                        }
                        className={`flex-1 py-1 rounded flex justify-center cursor-pointer ${
                          active
                            ? "bg-white text-[#0284C7] shadow-xs"
                            : "text-[#64748B]"
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.6} />
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg px-2.5 h-10">
                  <span className="text-[11px] text-[#64748B]">Lebar %</span>
                  <input
                    type="number"
                    min={20}
                    max={95}
                    value={activeTextLayer.maxWidthPct}
                    onChange={(e) =>
                      updateTextProp(
                        selectedLayer as Exclude<StudioLayerKey, "qr">,
                        "maxWidthPct",
                        Math.max(20, Math.min(95, Number(e.target.value) || 60))
                      )
                    }
                    className="w-10 bg-transparent text-right font-mono text-[12px] text-[#0F172A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 bg-[#F8FBFF] border border-[#E2E8F0] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    updateTextProp(
                      selectedLayer as Exclude<StudioLayerKey, "qr">,
                      "uppercase",
                      false
                    )
                  }
                  className={`py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                    !activeTextLayer.uppercase
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "text-[#64748B]"
                  }`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateTextProp(
                      selectedLayer as Exclude<StudioLayerKey, "qr">,
                      "uppercase",
                      true
                    )
                  }
                  className={`py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                    activeTextLayer.uppercase
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "text-[#64748B]"
                  }`}
                >
                  Kapital
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 bg-[#F8FBFF] border border-[#E2E8F0] rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Properti QR Code
                </span>
                <QrCode className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#475569]">Ukuran QR (% Lebar)</span>
                  <span className="font-mono font-semibold text-[#0284C7]">
                    {layout.qr.sizePct}% (
                    {Math.round((layout.qr.sizePct / 100) * CERT_CANVAS_WIDTH)}{" "}
                    px)
                  </span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={22}
                  step={0.5}
                  value={layout.qr.sizePct}
                  onChange={(e) =>
                    setLayout((prev) => ({
                      ...prev,
                      qr: { ...prev.qr, sizePct: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-[#0284C7] cursor-pointer"
                />
              </div>

              <div className="text-[11px] text-[#64748B] leading-relaxed">
                QR mengarah ke{" "}
                <span className="font-mono text-[#0284C7]">
                  /verify/[uuid_qr]
                </span>{" "}
                untuk validasi langsung.
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Template Upload / URL Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-6 flex flex-col gap-5 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#0F172A]">
                Pilih atau Unggah Template Sertifikat
              </h3>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F8FBFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) =>
                handleUploadTemplateFile(e.target.files?.[0] || null)
              }
            />

            <div className="p-4 rounded-xl bg-[#F8FBFF] border-2 border-dashed border-[#BAE6FD] flex flex-col items-center text-center gap-2.5">
              <Upload className="w-7 h-7 text-[#0284C7]" strokeWidth={1.5} />
              <p className="text-[13px] font-semibold text-[#0F172A]">
                Unggah Gambar Template Kosong (PNG / JPG / SVG)
              </p>
              <p className="text-[12px] text-[#64748B]">
                Otomatis masuk Cloudinary bila dikonfigurasi, atau folder lokal{" "}
                <code className="font-mono">/public/uploads/</code> di mode dev.
              </p>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-4 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold flex items-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{uploading ? "Mengunggah..." : "Pilih Gambar"}</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#0F172A] flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#0284C7]" />
                <span>Atau Tempel URL Gambar Publik (Cloudinary / CDN)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="flex-1 h-10 px-3 rounded-lg border border-[#E2E8F0] font-mono text-[12px] focus:outline-none focus:border-[#0284C7]"
                />
                <button
                  type="button"
                  onClick={handleApplyUrlTemplate}
                  className="h-10 px-4 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-semibold text-[13px] hover:bg-[#BAE6FD] cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#64748B]">
                Template Bawaan VeriCert:
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Calm Sky Classic", url: DEFAULT_TEMPLATE_URL },
                  { label: "Workshop Modern", url: SECONDARY_TEMPLATE_URL },
                ].map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={async () => {
                      setTemplateUrl(preset.url);
                      setCustomUrlInput(preset.url);
                      setTemplateModalOpen(false);
                      await handleSaveLayout(preset.url);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      templateUrl === preset.url
                        ? "border-[#0284C7] bg-[#EBF5FF]"
                        : "border-[#E2E8F0] hover:border-[#BAE6FD]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full aspect-[2000/1414] object-cover rounded border border-[#E2E8F0] mb-1.5"
                    />
                    <span className="text-[12px] font-semibold text-[#0F172A] block truncate">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Hasil Sertifikat & Test Scan Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-[880px] bg-white rounded-2xl border border-[#E2E8F0] shadow-xl flex flex-col overflow-hidden my-auto max-h-[92vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F172A]">
                    Preview Hasil Sertifikat & Test Scan
                  </h3>
                  <p className="font-mono text-[11px] text-[#64748B]">
                    RENDER FINAL • LANDSCAPE A4 (2000 × 1414 PX)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-2 rounded-lg text-[#64748B] hover:bg-[#F8FBFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 bg-[#F8FBFF] overflow-y-auto flex flex-col gap-4">
              <CertificateRenderer
                templateUrl={templateUrl}
                layout={layout}
                participantName={sampleName}
                certNumber={sampleCertNumber}
                role={sampleRole}
                verifyUrl={verifyUrl}
              />

              {scanSimulated && (
                <div className="p-3.5 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#075985]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className="w-5 h-5 text-[#0284C7] shrink-0"
                      strokeWidth={1.75}
                    />
                    <span>
                      Simulasi Scan QR mengarah ke{" "}
                      <a
                        href={verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono underline font-semibold text-[#0284C7]"
                      >
                        /verify/{sampleUuid}
                      </a>
                    </span>
                  </div>
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[12px] font-semibold bg-white px-3 py-1 rounded-lg border border-[#BAE6FD] text-[#0284C7]"
                  >
                    Buka Halaman Verifikasi →
                  </a>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 py-4 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div className="text-[12px] text-[#64748B]">
                Sampel: <strong className="text-[#0F172A]">{sampleName}</strong>{" "}
                • <span className="font-mono">{sampleCertNumber}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScanSimulated(true)}
                  className="h-10 px-4 rounded-lg border border-[#BAE6FD] bg-[#EBF5FF] text-[#0284C7] text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" strokeWidth={1.5} />
                  <span>Test Scan QR</span>
                </button>
                <button
                  type="button"
                  disabled={downloadingPdf}
                  onClick={handleDownloadSamplePdf}
                  className="h-10 px-5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold flex items-center gap-2 cursor-pointer"
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" strokeWidth={1.6} />
                  )}
                  <span>Unduh Sampel PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
