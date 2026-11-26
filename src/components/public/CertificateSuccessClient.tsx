"use client";

import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Fingerprint,
  Info,
  Link2,
  Loader2,
  Lock,
  Printer,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CertificateRenderer } from "@/components/CertificateRenderer";
import { ToastBanner, type ToastState } from "@/components/Toast";
import { parseLayoutConfig } from "@/lib/certificate-layout";
import { downloadCertificatePdf } from "@/lib/certificate-pdf";
import type { EventRecord, ParticipantRecord } from "@/lib/types";
import { buildCredentialDigest, formatDateTimeWib } from "@/lib/utils";

interface CertificateSuccessClientProps {
  event: EventRecord;
  participant: ParticipantRecord;
}

export function CertificateSuccessClient({
  event,
  participant,
}: CertificateSuccessClientProps) {
  const [appOrigin, setAppOrigin] = useState(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );
  const [downloading, setDownloading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const uuid = participant.uuid_qr || "";
  const certNumber = participant.nomor_sertifikat || "";
  const verifyUrl = `${appOrigin}/verify/${uuid}`;
  const layout = parseLayoutConfig(event.layout_config);
  const digest = buildCredentialDigest(uuid, certNumber);
  const canDownload = event.is_download_open === 1;

  const copyValue = async (key: string, text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(key);
      showToast(`${label} berhasil disalin!`);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      showToast("Gagal menyalin ke clipboard.", "error");
    }
  };

  const handleDownloadPdf = async () => {
    if (!canDownload) return;
    setDownloading(true);
    try {
      await downloadCertificatePdf(
        {
          templateUrl: event.template_url,
          layout,
          participantName: participant.nama_asli,
          certNumber,
          role: participant.role,
          verifyUrl,
        },
        `/api/public/certificates/${uuid}/pdf`
      );
      showToast("E-Sertifikat PDF berhasil diunduh!");
    } catch {
      showToast("Gagal membuat file PDF sertifikat.", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto py-8 sm:py-10 px-4 sm:px-6 flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#64748B]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link href="/" className="hover:text-[#0284C7]">
            Beranda
          </Link>
          <span>/</span>
          <Link
            href={`/event/${event.slug}/cari`}
            className="hover:text-[#0284C7] truncate max-w-[180px] sm:max-w-xs"
          >
            {event.title}
          </Link>
          <span>/</span>
          <span className="text-[#0F172A] font-medium">E-Sertifikat</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] font-mono text-[11px] text-[#0284C7]">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          Kredensial Terbit & Sah
        </span>
      </div>

      {/* Success Banner */}
      <section className="no-print bg-[#EBF5FF] border border-[#BAE6FD] rounded-xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-[18px] sm:text-[20px] font-bold text-[#0F172A] tracking-tight">
              Absensi Berhasil Tercatat & Terverifikasi!
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#475569] mt-0.5">
              E-Sertifikat elektronik Anda telah diterbitkan secara otomatis dan diamankan dengan QR verifikasi unik.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] font-mono text-[11px] font-semibold self-start md:self-center shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          Status: Terbit & Sah
        </span>
      </section>

      {/* Dual-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: High-Res Certificate Canvas */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 flex flex-col gap-4 print-only-card">
            <div className="no-print flex flex-wrap items-center justify-between gap-2 bg-[#F8FBFF] border border-[#E2E8F0] px-3.5 py-2.5 rounded-lg">
              <div className="flex items-center gap-2 text-[#0F172A]">
                <Award className="w-5 h-5 text-[#0284C7]" strokeWidth={1.6} />
                <span className="text-[14px] font-semibold">
                  Pratinjau E-Sertifikat Resmi
                </span>
                <span className="hidden sm:inline text-[12px] text-[#64748B]">
                  (A4 Landscape • 300 DPI)
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] text-[12px] text-[#475569] hover:text-[#0284C7] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Cetak</span>
              </button>
            </div>

            <CertificateRenderer
              templateUrl={event.template_url}
              layout={layout}
              participantName={participant.nama_asli}
              certNumber={certNumber}
              role={participant.role}
              verifyUrl={verifyUrl}
            />

            <p className="no-print text-[12px] text-[#64748B] text-center flex items-center justify-center gap-1.5">
              <Info className="w-4 h-4 text-[#0284C7] shrink-0" />
              <span>
                File PDF yang diunduh mencakup resolusi cetak tinggi dengan QR code yang dapat dipindai langsung.
              </span>
            </p>
          </div>
        </div>

        {/* Right: Metadata & Actions */}
        <div className="no-print lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 lg:sticky lg:top-24 flex flex-col gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono text-[11px] font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.6} />
                <span>TERVERIFIKASI RESMI DI LEDGER</span>
              </div>
              <h2 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
                Kredensial Digital Anda
              </h2>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                {event.title}
              </p>
            </div>

            <div className="divide-y divide-[#E2E8F0] bg-[#F8FBFF] border border-[#E2E8F0] rounded-xl px-3.5 py-1">
              <div className="py-3">
                <span className="text-[11px] text-[#64748B] block">
                  Nama Lengkap Penerima
                </span>
                <span className="text-[15px] font-bold text-[#0F172A]">
                  {participant.nama_asli}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-2">
                <span className="text-[12px] text-[#64748B]">
                  Peran Kehadiran
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono text-[11px] font-semibold">
                  {participant.role}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-[#64748B] block">
                    Nomor Sertifikat
                  </span>
                  <span className="font-mono text-[13px] font-semibold text-[#0F172A] break-all">
                    {certNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyValue("cert", certNumber, "Nomor sertifikat")
                  }
                  className="p-2 rounded-lg text-[#64748B] hover:text-[#0284C7] hover:bg-white shrink-0 cursor-pointer"
                  title="Salin Nomor"
                >
                  {copiedField === "cert" ? (
                    <Check className="w-4 h-4 text-[#16A34A]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="py-3">
                <span className="text-[11px] text-[#64748B] block">
                  Tanggal Terbit
                </span>
                <span className="text-[13px] font-medium text-[#0F172A]">
                  {formatDateTimeWib(participant.attended_at)}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-[#64748B] block">
                    ID Unik Verifikasi (UUID)
                  </span>
                  <span className="font-mono text-[11px] text-[#475569] break-all">
                    {uuid}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue("uuid", uuid, "UUID")}
                  className="p-2 rounded-lg text-[#64748B] hover:text-[#0284C7] hover:bg-white shrink-0 cursor-pointer"
                  title="Salin UUID"
                >
                  {copiedField === "uuid" ? (
                    <Check className="w-4 h-4 text-[#16A34A]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="py-3">
                <span className="text-[11px] text-[#64748B] block">
                  Integritas Kriptografis
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#0284C7] mt-0.5">
                  <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{digest}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {canDownload ? (
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownloadPdf}
                  className="w-full min-h-[48px] bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Menyiapkan PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" strokeWidth={1.75} />
                      <span>Unduh Sertifikat (PDF)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] text-[12px] flex items-start gap-2">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Unduhan file PDF sementara dinonaktifkan oleh panitia acara.
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  copyValue("verifyLink", verifyUrl, "Link verifikasi publik")
                }
                className="w-full min-h-[44px] bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] hover:bg-[#EBF5FF] text-[#0284C7] font-semibold text-[13px] rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Link2 className="w-4 h-4" strokeWidth={1.6} />
                <span>Salin Link Verifikasi</span>
              </button>

              <Link
                href={`/verify/${uuid}`}
                className="w-full py-2 text-center text-[#0284C7] hover:underline font-medium text-[13px] inline-flex items-center justify-center gap-1.5"
              >
                <span>Buka Halaman Verifikasi Publik</span>
                <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
