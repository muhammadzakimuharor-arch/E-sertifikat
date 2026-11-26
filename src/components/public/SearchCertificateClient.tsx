"use client";

import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FolderOpen,
  Lightbulb,
  Loader2,
  School,
  Search,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CertificateRenderer } from "@/components/CertificateRenderer";
import { parseLayoutConfig } from "@/lib/certificate-layout";
import { downloadCertificatePdf } from "@/lib/certificate-pdf";
import type { EventRecord } from "@/lib/types";
import { formatDateTimeWib, getInitials } from "@/lib/utils";

interface SearchCertResult {
  id: string;
  uuid_qr: string;
  nama_asli: string;
  instansi: string;
  role: string;
  nomor_sertifikat: string;
  attended_at: string | null;
}

export function SearchCertificateClient({ event }: { event: EventRecord }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchCertResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<SearchCertResult | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [appOrigin, setAppOrigin] = useState(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/public/events/${event.slug}/search-certificates?q=${encodeURIComponent(
            trimmed
          )}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { results?: SearchCertResult[] };
        setResults(data.results || []);
        setHasSearched(true);
      } catch {
        // Ignore abort
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, event.slug]);

  const layout = parseLayoutConfig(event.layout_config);

  const handleDownload = async (item: SearchCertResult) => {
    setDownloadingId(item.id);
    try {
      await downloadCertificatePdf(
        {
          templateUrl: event.template_url,
          layout,
          participantName: item.nama_asli,
          certNumber: item.nomor_sertifikat,
          role: item.role,
          verifyUrl: `${appOrigin}/verify/${item.uuid_qr}`,
        },
        `/api/public/certificates/${item.uuid_qr}/pdf`
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-[880px] mx-auto py-8 sm:py-12 px-4 sm:px-6 flex flex-col">
      {/* Breadcrumb */}
      <nav className="flex items-center flex-wrap gap-2 text-[12px] text-[#64748B] mb-5">
        <Link
          href="/webinar"
          className="hover:text-[#0284C7] flex items-center gap-1"
        >
          <FolderOpen className="w-4 h-4" strokeWidth={1.5} />
          <span>Daftar Webinar</span>
        </Link>
        <span>/</span>
        <span className="truncate max-w-[240px] sm:max-w-md">{event.title}</span>
        <span>/</span>
        <span className="text-[#0284C7] font-semibold">Cari Sertifikat</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-2.5 mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono text-[11px] font-semibold w-fit">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Portal Pencarian Dokumen Peserta
        </span>
        <h1 className="text-[24px] sm:text-[32px] font-bold text-[#0F172A] tracking-tight">
          Cari & Unduh Ulang E-Sertifikat
        </h1>
        <p className="text-[14px] text-[#64748B] max-w-2xl leading-relaxed">
          Ketik minimal 3 huruf nama lengkap atau nomor sertifikat Anda pada webinar{" "}
          <strong className="text-[#0F172A]">{event.title}</strong>.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-xl p-2 sm:p-2.5 border border-[#BAE6FD] focus-within:border-[#0284C7] focus-within:ring-4 focus-within:ring-[#E0F2FE] transition-all mb-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search
              className="w-5 h-5 text-[#0284C7] absolute left-3 pointer-events-none"
              strokeWidth={1.6}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masukkan nama lengkap atau nomor sertifikat (min. 3 karakter)..."
              className="w-full min-h-[44px] pl-10 pr-9 bg-transparent text-[15px] text-[#0F172A] placeholder:text-[#64748B] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A]"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-1 mb-6 text-[12px] text-[#64748B]">
        <Lightbulb className="w-4 h-4 text-[#0284C7] shrink-0" strokeWidth={1.5} />
        <span>
          Menampilkan maksimal 10 hasil peserta yang telah menyelesaikan absensi.
        </span>
      </div>

      {/* Results */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 flex items-center justify-center gap-2 text-[14px] text-[#64748B]">
          <Loader2 className="w-5 h-5 animate-spin text-[#0284C7]" />
          <span>Mencari sertifikat...</span>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
          <p className="text-[15px] font-semibold text-[#0F172A]">
            Sertifikat tidak ditemukan
          </p>
          <p className="text-[13px] text-[#64748B] mt-1">
            Pastikan Anda sudah mengisi absensi dan ejaan nama sesuai saat pendaftaran.
          </p>
          {event.is_attendance_open === 1 && (
            <Link
              href={`/event/${event.slug}/absen`}
              className="inline-flex items-center justify-center mt-4 h-10 px-4 rounded-lg bg-[#0284C7] text-white text-[13px] font-semibold"
            >
              Isi Absensi Sekarang
            </Link>
          )}
        </div>
      ) : results.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] text-[13px]">
            <span className="font-semibold text-[#0F172A]">
              Hasil Pencarian ({results.length})
            </span>
          </div>

          {results.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-xl p-4 sm:p-6 border border-[#E2E8F0] hover:border-[#BAE6FD] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-bold text-[14px] flex items-center justify-center shrink-0">
                  {getInitials(item.nama_asli)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-[17px] font-bold text-[#0F172A]">
                      {item.nama_asli}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] font-mono text-[11px] font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Sah & Terverifikasi
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#64748B] mt-1">
                    <span className="inline-flex items-center gap-1">
                      <School className="w-3.5 h-3.5" />
                      {item.instansi || "—"}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Peran:{" "}
                      <strong className="text-[#0F172A]">{item.role}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2.5 border-t border-dashed border-[#E2E8F0]">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F8FBFF] border border-[#E2E8F0] font-mono text-[12px] text-[#0284C7] font-medium">
                      <span>{item.nomor_sertifikat}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            item.nomor_sertifikat
                          );
                          setCopiedId(item.id);
                          setTimeout(() => setCopiedId(null), 1600);
                        }}
                        className="p-0.5 hover:text-[#0369A1] cursor-pointer"
                        title="Salin Nomor"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {item.attended_at && (
                      <span className="text-[11px] text-[#64748B]">
                        Terbit: {formatDateTimeWib(item.attended_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="min-h-[44px] px-4 rounded-lg border border-[#BAE6FD] bg-white hover:bg-[#EBF5FF] text-[#0284C7] text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Pratinjau</span>
                </button>
                <Link
                  href={`/event/${event.slug}/sertifikat/${item.uuid_qr}`}
                  className="min-h-[44px] px-4 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Buka & Unduh</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-3xl overflow-hidden shadow-xl my-auto">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                Pratinjau Sertifikat — {previewItem.nama_asli}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F8FBFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 bg-[#F8FBFF]">
              <CertificateRenderer
                templateUrl={event.template_url}
                layout={layout}
                participantName={previewItem.nama_asli}
                certNumber={previewItem.nomor_sertifikat}
                role={previewItem.role}
                verifyUrl={`${appOrigin}/verify/${previewItem.uuid_qr}`}
              />
            </div>

            <div className="px-5 py-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="h-10 px-4 rounded-lg border border-[#E2E8F0] text-[#0F172A] text-[13px] font-medium"
              >
                Tutup
              </button>
              {event.is_download_open === 1 && (
                <button
                  type="button"
                  disabled={downloadingId === previewItem.id}
                  onClick={() => handleDownload(previewItem)}
                  className="h-10 px-5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  {downloadingId === previewItem.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Unduh PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
