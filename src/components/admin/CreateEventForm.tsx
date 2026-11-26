"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  Eye,
  Info,
  Loader2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCertificateNumber, slugify } from "@/lib/utils";

export function CreateEventForm({
  defaultOrganizer = "Panitia Pelaksana Webinar Nasional",
}: {
  defaultOrganizer?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState(defaultOrganizer);
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [speaker, setSpeaker] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [certFormat, setCertFormat] = useState("{NO}/2/PANITIA/XI/2026");
  const [startNumber, setStartNumber] = useState(1);
  const [numberPadding, setNumberPadding] = useState(3);
  const [attendanceMode, setAttendanceMode] = useState<"strict" | "open">(
    "strict"
  );
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(true);
  const [isDownloadOpen, setIsDownloadOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEdited) {
      setSlug(slugify(val));
    }
  };

  const livePreview = formatCertificateNumber(
    certFormat,
    startNumber,
    numberPadding
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          organizer,
          event_date: eventDate,
          speaker,
          slug: slug || slugify(title),
          cert_number_format: certFormat,
          start_number: startNumber,
          number_padding: numberPadding,
          attendance_mode: attendanceMode,
          is_attendance_open: isAttendanceOpen,
          is_download_open: isDownloadOpen,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error || "Gagal membuat webinar.");
        return;
      }
      router.push(`/admin/events/${data.id}?tab=design`);
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto pb-12">
      <nav className="flex items-center gap-2 text-[13px] text-[#64748B] mb-2">
        <Link href="/admin/events" className="hover:text-[#0284C7]">
          Manajemen Webinar
        </Link>
        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        <span className="text-[#0F172A] font-semibold">Buat Webinar Baru</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
            Buat Webinar Baru
          </h1>
          <p className="text-[14px] text-[#64748B] mt-1">
            Konfigurasi informasi acara, skema nomor sertifikat, dan mode absensi peserta.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center gap-2 text-[13px]">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.6} />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-8 flex flex-col gap-8"
      >
        {/* Section 1 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <span className="w-1.5 h-5 bg-[#0284C7] rounded-full" />
            <h2 className="text-[18px] font-semibold text-[#0F172A]">
              1. Informasi Dasar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0F172A]">
                Judul Acara / Webinar <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Contoh: Webinar Nasional AI 2026"
                className="h-11 px-3 rounded-lg bg-white border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0F172A]">
                Penyelenggara / Instansi{" "}
                <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Contoh: Fakultas Ilmu Komputer"
                className="h-11 px-3 rounded-lg bg-white border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0F172A]">
                Tanggal Pelaksanaan <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="h-11 px-3 rounded-lg bg-white border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0F172A]">
                Pemateri / Narasumber
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="Contoh: Dr. Raditya Pratama, M.Sc."
                className="h-11 px-3 rounded-lg bg-white border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Custom URL Slug <span className="text-[#DC2626]">*</span>
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center rounded-lg border border-[#E2E8F0] overflow-hidden focus-within:border-[#0284C7] focus-within:ring-3 focus-within:ring-[#E0F2FE]">
              <span className="px-3 py-2.5 font-mono text-[12px] text-[#0284C7] bg-[#EBF5FF] border-b sm:border-b-0 sm:border-r border-[#BAE6FD] select-none shrink-0">
                /event/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="webinar-nasional-2026"
                className="w-full h-11 px-3 bg-white font-mono text-[13px] text-[#0F172A] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#0284C7] rounded-full" />
              <h2 className="text-[18px] font-semibold text-[#0F172A]">
                2. Skema Nomor Sertifikat
              </h2>
            </div>
            <span className="text-[12px] text-[#0284C7] flex items-center gap-1">
              <Info className="w-4 h-4" strokeWidth={1.5} />
              Gunakan tag <code className="font-mono font-bold">{"{NO}"}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0F172A]">
                Format Penomoran
              </label>
              <input
                type="text"
                required
                value={certFormat}
                onChange={(e) => setCertFormat(e.target.value)}
                className="h-11 px-3 rounded-lg bg-white border border-[#E2E8F0] font-mono text-[13px] focus:outline-none focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0F172A]">
                Nomor Urut Awal
              </label>
              <input
                type="number"
                min={1}
                max={99999}
                value={startNumber}
                onChange={(e) =>
                  setStartNumber(Math.max(1, Number(e.target.value) || 1))
                }
                className="h-11 px-3 rounded-lg bg-white border border-[#E2E8F0] font-mono text-[14px] focus:outline-none focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0F172A]">
                Digit Padding
              </label>
              <select
                value={numberPadding}
                onChange={(e) => setNumberPadding(Number(e.target.value))}
                className="h-11 px-3 rounded-lg bg-white border border-[#E2E8F0] font-mono text-[13px] focus:outline-none focus:border-[#0284C7] cursor-pointer"
              >
                <option value={1}>1 Digit (1, 2, ...)</option>
                <option value={2}>2 Digit (01, 02, ...)</option>
                <option value={3}>3 Digit (001, 002, ...)</option>
                <option value={4}>4 Digit (0001, ...)</option>
                <option value={5}>5 Digit (00001, ...)</option>
              </select>
            </div>
          </div>

          <div className="bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[13px] text-[#475569]">
              <Eye className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
              <span>Contoh nomor peserta pertama:</span>
            </div>
            <div className="bg-white border border-[#BAE6FD] px-3 py-1.5 rounded-md font-mono text-[13px] font-bold text-[#0284C7] self-start sm:self-auto">
              {livePreview}
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <span className="w-1.5 h-5 bg-[#0284C7] rounded-full" />
            <h2 className="text-[18px] font-semibold text-[#0F172A]">
              3. Kebijakan & Mode Absensi Peserta
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setAttendanceMode("strict")}
              className={`text-left rounded-xl p-5 flex gap-3.5 border transition-all cursor-pointer ${
                attendanceMode === "strict"
                  ? "bg-[#EBF5FF] border-[#0284C7] ring-2 ring-[#BAE6FD]"
                  : "bg-white border-[#E2E8F0] hover:border-[#BAE6FD]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  attendanceMode === "strict"
                    ? "bg-[#0284C7] text-white"
                    : "border border-[#CBD5E1] bg-white"
                }`}
              >
                {attendanceMode === "strict" && (
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-[#0F172A]">
                    Mode Ketat (Wajib Terdaftar)
                  </span>
                  <span className="font-mono text-[11px] bg-[#E0F2FE] text-[#0284C7] px-2 py-0.5 rounded-full font-medium">
                    Disarankan
                  </span>
                </div>
                <p className="text-[13px] text-[#64748B] leading-relaxed">
                  Hanya peserta yang sudah diinput atau di-import admin yang dapat mencari nama dan mengisi absensi.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAttendanceMode("open")}
              className={`text-left rounded-xl p-5 flex gap-3.5 border transition-all cursor-pointer ${
                attendanceMode === "open"
                  ? "bg-[#EBF5FF] border-[#0284C7] ring-2 ring-[#BAE6FD]"
                  : "bg-white border-[#E2E8F0] hover:border-[#BAE6FD]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  attendanceMode === "open"
                    ? "bg-[#0284C7] text-white"
                    : "border border-[#CBD5E1] bg-white"
                }`}
              >
                {attendanceMode === "open" && (
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-[#0F172A]">
                    Mode Terbuka (Auto-Register)
                  </span>
                  <span className="font-mono text-[11px] bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded-full font-medium">
                    Publik
                  </span>
                </div>
                <p className="text-[13px] text-[#64748B] leading-relaxed">
                  Peserta mengisi langsung nama lengkap dan instansi saat absensi tanpa perlu daftar awal dari admin.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Section 4 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <span className="w-1.5 h-5 bg-[#0284C7] rounded-full" />
            <h2 className="text-[18px] font-semibold text-[#0F172A]">
              4. Kontrol Akses Publik
            </h2>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FBFF] border border-[#E2E8F0]">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#E0F2FE] text-[#0284C7] shrink-0">
                <UserCheck className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#0F172A]">
                  Buka Sesi Absensi
                </p>
                <p className="text-[12px] text-[#64748B]">
                  Peserta dapat langsung mengakses formulir presensi via tautan publik.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAttendanceOpen}
              onClick={() => setIsAttendanceOpen((p) => !p)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
                isAttendanceOpen ? "bg-[#0284C7]" : "bg-[#CBD5E1]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isAttendanceOpen ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FBFF] border border-[#E2E8F0]">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#E0F2FE] text-[#0284C7] shrink-0">
                <Download className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#0F172A]">
                  Izinkan Unduh Sertifikat
                </p>
                <p className="text-[12px] text-[#64748B]">
                  Peserta yang hadir dapat langsung mengunduh file PDF e-sertifikat.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isDownloadOpen}
              onClick={() => setIsDownloadOpen((p) => !p)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
                isDownloadOpen ? "bg-[#0284C7]" : "bg-[#CBD5E1]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isDownloadOpen ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        <div className="pt-4 border-t border-[#E2E8F0] flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
          <Link
            href="/admin/events"
            className="h-11 px-5 rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FBFF] font-medium text-[14px] flex items-center justify-center"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 px-6 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-70 text-white font-semibold text-[14px] flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <span>Simpan & Lanjutkan ke Desain</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
