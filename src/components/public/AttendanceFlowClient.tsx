"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { EventRecord } from "@/lib/types";
import { formatDateIndo, getInitials } from "@/lib/utils";

interface StrictSearchCandidate {
  id: string;
  nama_asli: string;
  instansi: string;
  role: string;
  masked_email: string;
  masked_phone: string;
  is_attended: boolean;
  uuid_qr: string | null;
}

export function AttendanceFlowClient({ event }: { event: EventRecord }) {
  const router = useRouter();

  // Strict Mode States
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<StrictSearchCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<StrictSearchCandidate | null>(null);
  const [confirmed, setConfirmed] = useState(true);

  // Open Mode States
  const [openName, setOpenName] = useState("");
  const [openInstansi, setOpenInstansi] = useState("");
  const [openEmail, setOpenEmail] = useState("");
  const [openPhone, setOpenPhone] = useState("");
  const [openAgree, setOpenAgree] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event.attendance_mode !== "strict") return;
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setCandidates([]);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const res = await fetch(
          `/api/public/events/${event.slug}/search-registered?q=${encodeURIComponent(
            trimmed
          )}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          results?: StrictSearchCandidate[];
        };
        setCandidates(data.results || []);
        setHasSearched(true);
      } catch {
        // Ignore abort
      } finally {
        setSearching(false);
      }
    }, 240);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, event.slug, event.attendance_mode]);

  const handleStrictSubmit = async () => {
    if (!selected || !confirmed) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/public/events/${event.slug}/attend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: selected.id }),
      });
      const data = (await res.json()) as {
        uuid_qr?: string;
        error?: string;
      };
      if (!res.ok || !data.uuid_qr) {
        setError(data.error || "Gagal memproses absensi.");
        setSubmitting(false);
        return;
      }
      router.push(`/event/${event.slug}/sertifikat/${data.uuid_qr}`);
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
      setSubmitting(false);
    }
  };

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openAgree) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/public/events/${event.slug}/attend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_asli: openName,
          instansi: openInstansi,
          email: openEmail,
          phone: openPhone,
          role: "Peserta",
        }),
      });
      const data = (await res.json()) as {
        uuid_qr?: string;
        error?: string;
      };
      if (!res.ok || !data.uuid_qr) {
        setError(data.error || "Gagal mengirim presensi.");
        setSubmitting(false);
        return;
      }
      router.push(`/event/${event.slug}/sertifikat/${data.uuid_qr}`);
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba kembali.");
      setSubmitting(false);
    }
  };

  // Closed Attendance View
  if (event.is_attendance_open !== 1) {
    return (
      <div className="max-w-[580px] mx-auto py-10 sm:py-16 px-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-10 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] text-[#475569] font-mono text-[11px] font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
            <span>Sesi Absensi Berakhir</span>
          </div>

          <h2 className="text-[16px] font-semibold text-[#0F172A]">
            {event.title}
          </h2>
          <p className="text-[12px] text-[#64748B] mt-1">
            {event.organizer} • {formatDateIndo(event.event_date)}
          </p>

          <div className="my-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
              <Lock className="w-8 h-8" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
            Sesi Absensi Telah Ditutup
          </h1>
          <p className="text-[14px] text-[#64748B] mt-2 leading-relaxed">
            Pengisian daftar hadir untuk kegiatan ini telah ditutup oleh panitia penyelenggara.
          </p>

          <div className="bg-[#F8FBFF] border border-[#E2E8F0] rounded-xl p-4 my-6 text-left flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0F172A]">
                Sudah mengisi absensi sebelumnya?
              </h3>
              <p className="text-[12px] text-[#64748B] mt-0.5 leading-relaxed">
                Anda tetap dapat mencari dan mengunduh ulang e-sertifikat resmi Anda kapan saja melalui portal pencarian sertifikat.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href={`/event/${event.slug}/cari`}
              className="w-full min-h-[46px] bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" strokeWidth={1.75} />
              <span>Cari & Unduh E-Sertifikat Saya</span>
            </Link>
            <Link
              href="/"
              className="w-full min-h-[44px] bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#475569] font-medium text-[13px] rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              <span>Kembali ke Halaman Utama</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto py-8 sm:py-12 px-4">
      {/* Event Banner Card */}
      <section className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 mb-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] text-[12px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse" />
            {event.attendance_mode === "strict"
              ? "Mode Ketat • Khusus Peserta Terdaftar"
              : "Mode Terbuka • Auto-Register Mandiri"}
          </span>
        </div>
        <h1 className="text-[18px] sm:text-[20px] font-bold text-[#0F172A] tracking-tight">
          {event.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#64748B] mt-1.5">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
            {formatDateIndo(event.event_date, { withWeekday: true })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
            {event.organizer}
          </span>
        </div>
      </section>

      {/* STRICT MODE */}
      {event.attendance_mode === "strict" ? (
        <>
          {/* 3-Step Wizard */}
          <nav
            aria-label="Alur Absensi Peserta"
            className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 sm:p-4 mb-5 flex items-center justify-between text-[12px] sm:text-[13px]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  selected
                    ? "bg-[#E0F2FE] text-[#0284C7]"
                    : "bg-[#0284C7] text-white"
                }`}
              >
                {selected ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span
                className={`truncate ${
                  selected
                    ? "text-[#64748B] hidden sm:inline"
                    : "text-[#0284C7] font-bold"
                }`}
              >
                Cari Nama
              </span>
            </div>

            <div
              className={`flex-1 mx-2 sm:mx-3 h-[2px] rounded-full ${
                selected ? "bg-[#0284C7]" : "bg-[#E2E8F0]"
              }`}
            />

            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  selected
                    ? "bg-[#0284C7] text-white"
                    : "bg-[#F1F5F9] text-[#64748B]"
                }`}
              >
                2
              </div>
              <span
                className={`truncate ${
                  selected
                    ? "text-[#0284C7] font-bold"
                    : "text-[#64748B] hidden sm:inline"
                }`}
              >
                Konfirmasi
              </span>
            </div>

            <div className="flex-1 mx-2 sm:mx-3 h-[2px] bg-[#E2E8F0] rounded-full" />

            <div className="flex items-center gap-2 min-w-0 opacity-75">
              <div className="w-7 h-7 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center font-semibold shrink-0">
                3
              </div>
              <span className="text-[#64748B] hidden sm:inline truncate">
                Sertifikat
              </span>
            </div>
          </nav>

          {!selected ? (
            /* STEP 1: SEARCH NAME */
            <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-8">
              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 text-[#0284C7] font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
                  <UserCheck className="w-4 h-4" strokeWidth={1.6} />
                  <span>Validasi Registrasi Peserta</span>
                </div>
                <h2 className="text-[22px] sm:text-[26px] font-bold text-[#0F172A] tracking-tight">
                  Temukan Nama Anda di Daftar Peserta
                </h2>
                <p className="text-[14px] text-[#64748B] mt-1.5 leading-relaxed">
                  Hanya peserta terdaftar yang dapat mengisi absensi dan mengunduh e-sertifikat resmi.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="search-peserta"
                  className="text-[13px] font-semibold text-[#0F172A] flex items-center justify-between"
                >
                  <span>Nama Lengkap Anda</span>
                  <span className="font-mono text-[11px] text-[#64748B] font-normal">
                    Min. 3 huruf
                  </span>
                </label>

                <div className="relative flex items-center">
                  <Search
                    className="w-5 h-5 text-[#0284C7] absolute left-3.5 pointer-events-none"
                    strokeWidth={1.6}
                  />
                  <input
                    id="search-peserta"
                    type="text"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ketik minimal 3 huruf nama Anda..."
                    className="w-full min-h-[46px] pl-11 pr-10 bg-white border border-[#0284C7] rounded-xl text-[15px] text-[#0F172A] focus:outline-none focus:ring-4 focus:ring-[#E0F2FE]"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-3 p-1 text-[#64748B] hover:text-[#0F172A]"
                      aria-label="Hapus pencarian"
                    >
                      <XCircle className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  )}
                </div>

                <p className="text-[12px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                  <Info className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  <span>
                    Pencarian tidak membedakan huruf besar/kecil.
                  </span>
                </p>

                {/* Results List */}
                {searching && (
                  <div className="mt-3 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] flex items-center justify-center gap-2 text-[13px] text-[#64748B]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0284C7]" />
                    <span>Mencari data peserta...</span>
                  </div>
                )}

                {!searching && hasSearched && candidates.length === 0 && (
                  <div className="mt-3 p-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] text-[13px] flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Nama <strong>&ldquo;{query.trim()}&rdquo;</strong> tidak
                      ditemukan di daftar peserta acara ini. Periksa ejaan atau
                      hubungi panitia.
                    </span>
                  </div>
                )}

                {!searching && candidates.length > 0 && (
                  <div className="mt-2 rounded-xl border border-[#BAE6FD] bg-white overflow-hidden divide-y divide-[#E2E8F0] shadow-sm">
                    <div className="px-4 py-2 bg-[#F8FBFF] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                      <span>Ditemukan {candidates.length} kecocokan</span>
                      <span className="text-[#0284C7]">Ketuk untuk pilih</span>
                    </div>

                    {candidates.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FBFF] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0284C7] font-bold text-[13px] flex items-center justify-center shrink-0">
                            {getInitials(c.nama_asli)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-[#0F172A] truncate">
                              {c.nama_asli}
                            </p>
                            <p className="text-[12px] text-[#64748B] truncate">
                              {c.instansi || "Peserta Terdaftar"} • {c.role}
                            </p>
                          </div>
                        </div>

                        {c.is_attended && c.uuid_qr ? (
                          <Link
                            href={`/event/${event.slug}/sertifikat/${c.uuid_qr}`}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] text-[12px] font-semibold shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Sudah Hadir • Unduh</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelected(c)}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[12px] font-semibold shrink-0 cursor-pointer"
                          >
                            <span>Pilih Identitas</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[#F8FBFF] border border-[#E2E8F0] flex items-start gap-3 text-[12px] text-[#475569]">
                <Info
                  className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5"
                  strokeWidth={1.6}
                />
                <span>
                  <strong className="text-[#0F172A]">
                    Sudah mengisi absensi sebelumnya?
                  </strong>{" "}
                  Cari nama Anda di atas atau buka{" "}
                  <Link
                    href={`/event/${event.slug}/cari`}
                    className="text-[#0284C7] underline font-semibold"
                  >
                    Portal Cari & Unduh Sertifikat
                  </Link>
                  .
                </span>
              </div>
            </section>
          ) : (
            /* STEP 2: IDENTITY CONFIRMATION */
            <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-8">
              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                  <h2 className="text-[20px] font-bold text-[#0F172A]">
                    Konfirmasi Data Kehadiran Anda
                  </h2>
                </div>
                <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">
                  Periksa kembali data Anda sebelum mengirimkan absensi. Nama ini akan langsung dicetak pada e-sertifikat resmi.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[13px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-[#F8FBFF] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 mb-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-1.5 text-[#0284C7] text-[13px] font-semibold">
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.6} />
                    <span>Data Terdaftar di Sistem</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 bg-white border border-[#E2E8F0] p-3.5 rounded-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold block mb-1">
                      Nama Lengkap (Tercetak di Sertifikat)
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[18px] font-bold text-[#0F172A]">
                        {selected.nama_asli}
                      </span>
                      <CheckCircle2
                        className="w-5 h-5 text-[#0284C7] shrink-0"
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold block mb-1">
                      Instansi / Afiliasi
                    </span>
                    <span className="text-[14px] font-semibold text-[#0F172A]">
                      {selected.instansi || "—"}
                    </span>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold block mb-1">
                      Peran Registrasi
                    </span>
                    <span className="text-[14px] font-semibold text-[#0284C7]">
                      {selected.role}
                    </span>
                  </div>

                  <div className="sm:col-span-2 bg-white border border-[#E2E8F0] p-3 rounded-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold block mb-1">
                      Kontak Terdaftar (Proteksi Privasi)
                    </span>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-[#475569]">
                      <Lock className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{selected.masked_email}</span>
                      <span>•</span>
                      <span>{selected.masked_phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <label className="bg-[#EBF5FF] border border-[#BAE6FD] rounded-xl p-4 flex items-start gap-3 cursor-pointer select-none mb-5">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-[#0284C7] cursor-pointer"
                />
                <span className="text-[13px] text-[#0F172A] leading-snug">
                  Saya menyatakan hadir dalam sesi kegiatan ini dan mengonfirmasi bahwa ejaan nama di atas sudah benar untuk dicetak pada e-sertifikat resmi.
                </span>
              </label>

              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  disabled={!confirmed || submitting}
                  onClick={handleStrictSubmit}
                  className="w-full min-h-[48px] bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white font-semibold text-[15px] rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Memproses & Menerbitkan Sertifikat...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
                      <span>Konfirmasi Hadir & Terbitkan Sertifikat</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setError("");
                  }}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0284C7] py-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Bukan identitas Anda? Cari ulang nama lain</span>
                </button>
              </div>
            </section>
          )}
        </>
      ) : (
        /* OPEN MODE (Auto-Register) */
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-8 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-[#0284C7] text-[12px] font-semibold uppercase tracking-wider mb-1">
              <UserCheck className="w-4 h-4" strokeWidth={1.6} />
              <span>Formulir Presensi Terpadu</span>
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A]">
              Isi Identitas & Terbitkan E-Sertifikat
            </h2>
            <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">
              Isi data diri Anda dengan cermat. Sistem akan otomatis mencatat kehadiran dan menerbitkan e-sertifikat berverifikasi QR.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#EBF5FF] border border-[#BAE6FD] flex items-start gap-2.5 text-[12px] text-[#075985]">
            <Info className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <span>
              <strong>Perhatian:</strong> Pastikan ejaan nama lengkap dan gelar sudah sesuai karena akan langsung dicetak pada sertifikat.
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[13px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleOpenSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="openName"
                className="text-[13px] font-semibold text-[#0F172A]"
              >
                Nama Lengkap & Gelar (Tercetak di Sertifikat){" "}
                <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="openName"
                type="text"
                required
                maxLength={80}
                value={openName}
                onChange={(e) => setOpenName(e.target.value)}
                placeholder="Contoh: Siti Aisyah, S.Pd."
                className="w-full min-h-[46px] px-3.5 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[15px] text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="openInstansi"
                className="text-[13px] font-semibold text-[#0F172A]"
              >
                Instansi / Universitas / Asal Sekolah{" "}
                <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="openInstansi"
                type="text"
                required
                value={openInstansi}
                onChange={(e) => setOpenInstansi(e.target.value)}
                placeholder="Contoh: Universitas Airlangga"
                className="w-full min-h-[46px] px-3.5 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[15px] text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="openEmail"
                  className="text-[13px] font-semibold text-[#0F172A]"
                >
                  Alamat Email{" "}
                  <span className="text-[#64748B] font-normal">(Opsional)</span>
                </label>
                <input
                  id="openEmail"
                  type="email"
                  value={openEmail}
                  onChange={(e) => setOpenEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full min-h-[46px] px-3.5 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[14px] text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="openPhone"
                  className="text-[13px] font-semibold text-[#0F172A]"
                >
                  No. WhatsApp{" "}
                  <span className="text-[#64748B] font-normal">(Opsional)</span>
                </label>
                <input
                  id="openPhone"
                  type="tel"
                  value={openPhone}
                  onChange={(e) => setOpenPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full min-h-[46px] px-3.5 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[14px] text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7]"
                />
              </div>
            </div>

            <div className="bg-[#F8FBFF] border border-[#E2E8F0] p-3.5 rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] block">
                  Pratinjau Nama Pada Sertifikat
                </span>
                <span className="text-[15px] font-bold text-[#0F172A] truncate block">
                  {openName.trim() || "Nama Anda Akan Tampil di Sini"}
                </span>
              </div>
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-semibold shrink-0">
                QR Auto-Sign
              </span>
            </div>

            <label className="bg-[#EBF5FF] border border-[#BAE6FD] rounded-xl p-3.5 flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={openAgree}
                onChange={(e) => setOpenAgree(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[#0284C7]"
              />
              <span className="text-[12px] text-[#0F172A] leading-relaxed">
                Saya menyatakan telah menghadiri kegiatan ini dan menyetujui penerbitan e-sertifikat resmi dengan ejaan nama di atas.
              </span>
            </label>

            <button
              type="submit"
              disabled={!openAgree || submitting}
              className="w-full min-h-[48px] bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white font-semibold text-[15px] rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses & Menerbitkan E-Sertifikat...</span>
                </>
              ) : (
                <>
                  <span>Kirim Presensi & Terbitkan E-Sertifikat</span>
                  <ArrowRight className="w-5 h-5" strokeWidth={1.75} />
                </>
              )}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
