"use client";

import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  Fingerprint,
  Home,
  Loader2,
  Lock,
  Printer,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CertificateRenderer } from "@/components/CertificateRenderer";
import { parseLayoutConfig } from "@/lib/certificate-layout";
import { downloadCertificatePdf } from "@/lib/certificate-pdf";
import type { EventRecord, ParticipantRecord } from "@/lib/types";
import {
  buildCredentialDigest,
  formatDateIndo,
  formatDateTimeWib,
} from "@/lib/utils";

interface VerifyValidClientProps {
  event: EventRecord;
  participant: ParticipantRecord;
}

export function VerifyValidClient({
  event,
  participant,
}: VerifyValidClientProps) {
  const [appOrigin, setAppOrigin] = useState(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  const uuid = participant.uuid_qr || "";
  const certNumber = participant.nomor_sertifikat || "";
  const verifyUrl = `${appOrigin}/verify/${uuid}`;
  const layout = parseLayoutConfig(event.layout_config);
  const digest = buildCredentialDigest(uuid, certNumber);
  const canDownload = event.is_download_open === 1;

  const handleCopy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
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
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-[820px] mx-auto py-8 sm:py-12 px-4 sm:px-6 flex flex-col gap-5">
      {/* Top Breadcrumb */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <div className="flex items-center gap-1.5 text-[#64748B]">
          <Link href="/" className="hover:text-[#0284C7] flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Portal Verifikasi</span>
          </Link>
          <span>/</span>
          <span className="text-[#0F172A] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7]" />
            Kredensial Terverifikasi
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] font-mono text-[11px] text-[#16A34A] font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          Valid 100%
        </span>
      </div>

      {/* Main Credential Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm print-only-card">
        <div className="h-1.5 w-full bg-[#0284C7]" />

        {/* Hero Banner */}
        <div className="bg-[#EBF5FF] border-b border-[#BAE6FD] p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white border border-[#BAE6FD] flex items-center justify-center mx-auto mb-3 text-[#0284C7] relative shadow-xs">
            <ShieldCheck className="w-8 h-8" strokeWidth={1.6} />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center border-2 border-white">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#BAE6FD] font-mono text-[11px] text-[#0284C7] font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
            <span>KREDENSIAL RESMI TERDAFTAR</span>
          </div>

          <h1 className="text-[22px] sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
            SERTIFIKAT ASLI & TERVERIFIKASI
          </h1>
          <p className="text-[14px] text-[#475569] max-w-xl mx-auto mt-1.5 leading-relaxed">
            Dokumen ini tercatat secara sah pada basis data resmi VeriCert dan dilindungi identitas kriptografis unik.
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 bg-white border border-[#BAE6FD] px-3.5 py-1.5 rounded-full text-[12px] text-[#0F172A] font-medium">
            <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Status Kunci: Valid & Aktif</span>
          </div>
        </div>

        {/* Metadata Body */}
        <div className="p-5 sm:p-8 flex flex-col gap-6">
          {/* Recipient Info */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#0284C7]" />
                Informasi Penerima Kredensial
              </span>
              <span className="font-mono text-[11px] text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full font-medium">
                Identitas Cocok
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8FBFF] border border-[#E2E8F0] p-4 rounded-xl">
              <div>
                <span className="text-[11px] text-[#64748B] block">
                  Nama Lengkap Penerima
                </span>
                <span className="text-[16px] font-bold text-[#0F172A]">
                  {participant.nama_asli}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block mb-1">
                  Peran Kehadiran
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] text-[12px] font-semibold">
                  {participant.role}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block">
                  Asal Instansi / Afiliasi
                </span>
                <span className="text-[14px] font-semibold text-[#0F172A]">
                  {participant.instansi || "—"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block mb-1">
                  Nomor Registrasi Sertifikat
                </span>
                <div className="inline-flex items-center justify-between gap-2 bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg w-full">
                  <span className="font-mono text-[13px] font-semibold text-[#0284C7] break-all">
                    {certNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy("cert", certNumber)}
                    className="p-1 text-[#64748B] hover:text-[#0284C7] shrink-0 cursor-pointer"
                    title="Salin Nomor"
                  >
                    {copiedKey === "cert" ? (
                      <Check className="w-4 h-4 text-[#16A34A]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Event Info */}
          <div>
            <div className="flex items-center gap-1.5 mb-3 text-[12px] font-bold uppercase tracking-wider text-[#475569]">
              <Calendar className="w-4 h-4 text-[#0284C7]" />
              <span>Detail Acara & Penerbit</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8FBFF] border border-[#E2E8F0] p-4 rounded-xl">
              <div className="md:col-span-2">
                <span className="text-[11px] text-[#64748B] block">
                  Nama Kegiatan Webinar
                </span>
                <span className="text-[16px] font-bold text-[#0F172A]">
                  {event.title}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block">
                  Lembaga Penyelenggara
                </span>
                <span className="text-[14px] font-semibold text-[#0F172A] inline-flex items-center gap-1">
                  {event.organizer}
                  <CheckCircle2 className="w-4 h-4 text-[#0284C7]" />
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block">
                  Pemateri / Narasumber
                </span>
                <span className="text-[14px] font-medium text-[#0F172A]">
                  {event.speaker || "Panitia Pelaksana"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block">
                  Tanggal Pelaksanaan
                </span>
                <span className="text-[13px] font-medium text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-[#0284C7]" />
                  {formatDateIndo(event.event_date)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block">
                  Waktu Penerbitan
                </span>
                <span className="text-[13px] font-medium text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-[#0284C7]" />
                  {formatDateTimeWib(participant.attended_at)}
                </span>
              </div>
            </div>
          </div>

          {/* UUID Proof */}
          <div className="bg-[#F8FBFF] border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-bold text-[#475569] flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-[#0284C7]" />
                UUID Kredensial & Sidik Digital
              </span>
              <button
                type="button"
                onClick={() => handleCopy("uuid", uuid)}
                className="text-[11px] font-mono text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "uuid" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin UUID</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg font-mono text-[12px] flex flex-col gap-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-[#64748B]">UUID:</span>
                <span className="text-[#0F172A] font-semibold break-all">
                  {uuid}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-[#64748B]">Digest:</span>
                <span className="text-[#0284C7] break-all">{digest}</span>
              </div>
            </div>
          </div>

          {/* Verified Document Preview Thumbnail */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#0284C7]" />
                Pratinjau Dokumen Resmi
              </span>
            </div>
            <div className="p-2 sm:p-4 rounded-xl bg-[#F8FBFF] border border-[#E2E8F0]">
              <CertificateRenderer
                templateUrl={event.template_url}
                layout={layout}
                participantName={participant.nama_asli}
                certNumber={certNumber}
                role={participant.role}
                verifyUrl={verifyUrl}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="no-print bg-[#F8FBFF] border-t border-[#E2E8F0] p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href="/cek"
            className="text-[13px] font-semibold text-[#0284C7] hover:underline inline-flex items-center gap-1.5 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cek Sertifikat Lain</span>
          </Link>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-4 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0F172A] text-[13px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#0284C7]" />
              <span>Cetak Bukti Verifikasi</span>
            </button>

            {canDownload && (
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadPdf}
                className="min-h-[44px] px-5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Unduh PDF Asli</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
