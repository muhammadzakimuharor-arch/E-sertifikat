"use client";

import {
  Brush,
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  PieChart,
  QrCode,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { QrCodeImage } from "@/components/QrCodeImage";
import type { EventWithStats, ParticipantRecord } from "@/lib/types";
import { formatRelativeTimeIndo, getInitials } from "@/lib/utils";

interface EventOverviewTabProps {
  event: EventWithStats;
  participants: ParticipantRecord[];
  appOrigin: string;
  onSwitchTab: (tab: "overview" | "participants" | "design" | "settings") => void;
  onOpenImport: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export function EventOverviewTab({
  event,
  participants,
  appOrigin,
  onSwitchTab,
  onOpenImport,
  onToast,
}: EventOverviewTabProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const absenUrl = `${appOrigin}/event/${event.slug}/absen`;
  const cariUrl = `${appOrigin}/event/${event.slug}/cari`;
  const cekUrl = `${appOrigin}/cek`;

  const attended = participants.filter((p) => p.is_attended === 1);
  const total = participants.length;
  const notAttended = Math.max(0, total - attended.length);
  const pct = total > 0 ? Math.round((attended.length / total) * 1000) / 10 : 0;

  const lastCert =
    attended.find((p) => p.nomor_sertifikat)?.nomor_sertifikat || "Belum ada";

  const copyLink = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      onToast("Tautan berhasil disalin ke clipboard.");
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      onToast("Gagal menyalin tautan.", "error");
    }
  };

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const linkRows = [
    {
      key: "absen",
      label: "Link Form Absensi",
      badge: "Langsung Sinkron",
      url: absenUrl,
    },
    {
      key: "cari",
      label: "Link Cari & Unduh Sertifikat",
      badge: "Pencarian Nama / Nomor",
      url: cariUrl,
    },
    {
      key: "cek",
      label: "Link Cek Keaslian Sertifikat (Validator Publik)",
      badge: "Pemeriksa QR Standar",
      url: cekUrl,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 cols */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#0284C7]" strokeWidth={1.5} />
              <h2 className="text-[17px] font-semibold text-[#0F172A]">
                Tautan Publik untuk Peserta
              </h2>
            </div>
            <span className="text-[12px] text-[#64748B]">
              Akses Mobile-First Siap Bagikan
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {linkRows.map((row) => (
              <div key={row.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[#0F172A]">
                    {row.label}
                  </span>
                  <span className="font-mono text-[11px] text-[#0284C7]">
                    {row.badge}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F8FBFF] border border-[#E2E8F0] px-3.5 py-2.5 rounded-lg">
                  <span className="font-mono text-[12px] sm:text-[13px] text-[#0F172A] truncate">
                    {row.url}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0284C7] hover:border-[#BAE6FD] transition-colors"
                      title="Buka halaman"
                    >
                      <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyLink(row.key, row.url)}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] font-semibold text-[12px] transition-colors cursor-pointer"
                    >
                      {copiedKey === row.key ? (
                        <>
                          <Check className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" strokeWidth={1.6} />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="w-full min-h-[48px] bg-[#E0F2FE] hover:bg-[#BAE6FD] border border-[#BAE6FD] text-[#0284C7] font-semibold text-[14px] py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-5 h-5" strokeWidth={1.6} />
            <span>Tampilkan QR Absensi Layar Penuh</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">
              Protokol Validasi Otomatis
            </h3>
            <span className="font-mono text-[11px] text-[#0284C7] bg-[#EBF5FF] px-2.5 py-0.5 rounded-full">
              Transaksi Atomik
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#F8FBFF] border border-[#E2E8F0] p-3.5 rounded-lg flex flex-col gap-1">
              <ShieldCheck className="w-5 h-5 text-[#0284C7]" strokeWidth={1.5} />
              <span className="text-[13px] font-semibold text-[#0F172A]">
                UUID Anti-Duplikat
              </span>
              <span className="text-[12px] text-[#64748B]">
                Setiap peserta mendapat UUID kriptografis unik saat hadir.
              </span>
            </div>
            <div className="bg-[#F8FBFF] border border-[#E2E8F0] p-3.5 rounded-lg flex flex-col gap-1">
              <QrCode className="w-5 h-5 text-[#0284C7]" strokeWidth={1.5} />
              <span className="text-[13px] font-semibold text-[#0F172A]">
                Penomoran Sekuensial
              </span>
              <span className="text-[12px] text-[#64748B]">
                Nomor sertifikat berurutan otomatis tanpa bentrok antrean.
              </span>
            </div>
            <div className="bg-[#F8FBFF] border border-[#E2E8F0] p-3.5 rounded-lg flex flex-col gap-1">
              <Download className="w-5 h-5 text-[#0284C7]" strokeWidth={1.5} />
              <span className="text-[13px] font-semibold text-[#0F172A]">
                PDF On-Demand
              </span>
              <span className="text-[12px] text-[#64748B]">
                File PDF dirender langsung sesuai desain tanpa membebani DB.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right 5 cols */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#0284C7]" strokeWidth={1.5} />
              <h2 className="text-[17px] font-semibold text-[#0F172A]">
                Statistik Kehadiran
              </h2>
            </div>
            <span className="font-mono text-[11px] bg-[#EBF5FF] text-[#0284C7] px-2.5 py-0.5 rounded font-medium">
              {total} Terdaftar
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-5 bg-[#F8FBFF] border border-[#E2E8F0] p-5 rounded-xl">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="#E0F2FE"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="#0284C7"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-[22px] font-bold text-[#0F172A]">
                  {pct}%
                </span>
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
                  Hadir
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 w-full sm:w-auto">
              <div className="flex items-start gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#0284C7] mt-1.5 shrink-0" />
                <div>
                  <p className="text-[22px] font-bold text-[#0F172A] leading-none">
                    {attended.length}{" "}
                    <span className="text-[12px] font-normal text-[#64748B]">
                      Peserta
                    </span>
                  </p>
                  <p className="text-[12px] font-semibold text-[#0284C7] mt-1">
                    Telah Hadir & Terverifikasi
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#CBD5E1] mt-1.5 shrink-0" />
                <div>
                  <p className="text-[18px] font-semibold text-[#64748B] leading-none">
                    {notAttended}{" "}
                    <span className="text-[12px] font-normal text-[#64748B]">
                      Peserta
                    </span>
                  </p>
                  <p className="text-[12px] text-[#64748B] mt-1">
                    Belum Mengisi Absensi
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg p-4 flex flex-col gap-2.5 text-[13px]">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
              <span className="text-[#64748B]">Nomor Sertifikat Terakhir</span>
              <span className="font-mono font-semibold text-[#0284C7] truncate">
                {lastCert}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#64748B]">Mode Absensi</span>
              <span className="font-semibold text-[#0F172A]">
                {event.attendance_mode === "strict"
                  ? "Mode Ketat (Terdaftar)"
                  : "Mode Terbuka (Auto-Register)"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onSwitchTab("participants");
                onOpenImport();
              }}
              className="h-10 px-4 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] hover:bg-[#F8FBFF] text-[#0F172A] text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
              <span>Import Excel/CSV</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchTab("design")}
              className="h-10 px-4 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Brush className="w-4 h-4" strokeWidth={1.5} />
              <span>Editor Sertifikat</span>
            </button>
          </div>
        </div>

        {/* Recent Recipients */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">
              Penerima Sertifikat Terakhir
            </h3>
            <span className="font-mono text-[11px] text-[#0284C7] font-semibold">
              Live
            </span>
          </div>

          {attended.length === 0 ? (
            <p className="text-[13px] text-[#64748B] py-3 text-center">
              Belum ada peserta yang mengisi absensi.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {attended.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xs shrink-0">
                      {getInitials(p.nama_asli)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                        {p.nama_asli}
                      </p>
                      <p className="font-mono text-[11px] text-[#64748B] truncate">
                        {p.nomor_sertifikat}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-[#0284C7] shrink-0">
                    {p.attended_at
                      ? formatRelativeTimeIndo(p.attended_at)
                      : "Hadir"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Absensi Fullscreen Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] max-w-md w-full p-6 sm:p-8 shadow-xl flex flex-col items-center gap-5 relative">
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F8FBFF] hover:text-[#0F172A]"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <div className="text-center">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#0284C7] font-bold">
                Pemindaian Cepat Peserta
              </span>
              <h3 className="text-[22px] font-bold text-[#0F172A] mt-1">
                Pindai untuk Mengisi Absensi
              </h3>
              <p className="text-[13px] text-[#64748B] mt-1">
                {event.title}
              </p>
            </div>

            <div className="p-5 bg-[#F8FBFF] border border-[#BAE6FD] rounded-2xl flex flex-col items-center">
              <div className="p-3 bg-white rounded-xl border border-[#E2E8F0]">
                <QrCodeImage value={absenUrl} size={220} />
              </div>
              <span className="mt-3 font-mono text-[11px] text-[#64748B] text-center break-all">
                {absenUrl}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="flex-1 h-11 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FBFF] text-[#0F172A] font-semibold text-[13px]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => copyLink("qr-modal", absenUrl)}
                className="flex-1 h-11 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-[13px] flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" strokeWidth={1.5} />
                <span>Salin Tautan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
