"use client";

import {
  Award,
  Calendar,
  Plus,
  QrCode,
  Search,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ToastBanner, type ToastState } from "@/components/Toast";
import type { EventWithStats } from "@/lib/types";
import { formatCertificateNumber, formatDateIndo } from "@/lib/utils";

interface EventsListClientProps {
  initialEvents: EventWithStats[];
}

export function EventsListClient({ initialEvents }: EventsListClientProps) {
  const [events] = useState(initialEvents);
  const [filterTab, setFilterTab] = useState<"all" | "active" | "closed">("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  };

  const counts = useMemo(() => {
    const active = events.filter((e) => e.is_attendance_open === 1).length;
    const closed = events.filter((e) => e.is_attendance_open !== 1).length;
    return { all: events.length, active, closed };
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      if (filterTab === "active" && ev.is_attendance_open !== 1) return false;
      if (filterTab === "closed" && ev.is_attendance_open === 1) return false;
      if (!q) return true;
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.organizer.toLowerCase().includes(q) ||
        ev.slug.toLowerCase().includes(q)
      );
    });
  }, [events, filterTab, search]);

  const handleCopyAttendLink = async (slug: string) => {
    const url = `${window.location.origin}/event/${slug}/absen`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(`Link absensi disalin: /event/${slug}/absen`);
    } catch {
      showToast("Gagal menyalin tautan.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filter Strip */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#0284C7] font-semibold bg-[#E0F2FE] px-2.5 py-0.5 rounded">
                Event Console
              </span>
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
              Manajemen Webinar
            </h1>
            <p className="text-[14px] text-[#64748B]">
              Daftar seluruh kegiatan webinar, pengaturan sesi absensi, dan template e-sertifikat.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-[13px] transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span>Buat Webinar Baru</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-4 h-9 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                filterTab === "all"
                  ? "bg-[#0284C7] text-white font-semibold"
                  : "bg-[#F8FBFF] border border-[#E2E8F0] text-[#475569] hover:border-[#BAE6FD]"
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("active")}
              className={`px-4 h-9 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                filterTab === "active"
                  ? "bg-[#0284C7] text-white font-semibold"
                  : "bg-[#F8FBFF] border border-[#E2E8F0] text-[#475569] hover:border-[#BAE6FD]"
              }`}
            >
              Aktif ({counts.active})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("closed")}
              className={`px-4 h-9 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                filterTab === "closed"
                  ? "bg-[#0284C7] text-white font-semibold"
                  : "bg-[#F8FBFF] border border-[#E2E8F0] text-[#475569] hover:border-[#BAE6FD]"
              }`}
            >
              Selesai ({counts.closed})
            </button>
          </div>

          <div className="relative w-full lg:w-80">
            <Search
              className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul webinar atau penyelenggara..."
              className="w-full h-10 pl-10 pr-4 bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
          <p className="text-[15px] font-semibold text-[#0F172A]">
            Tidak ada webinar yang cocok
          </p>
          <p className="text-[13px] text-[#64748B] mt-1">
            Ubah kata kunci pencarian atau buat kegiatan webinar baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ev) => {
            const isOpen = ev.is_attendance_open === 1;
            const pct =
              ev.total_participants > 0
                ? Math.round((ev.attended_count / ev.total_participants) * 100)
                : 0;
            const sampleNumber = formatCertificateNumber(
              ev.cert_number_format,
              ev.start_number,
              ev.number_padding
            );

            return (
              <div
                key={ev.id}
                className="bg-white rounded-xl border border-[#E2E8F0] hover:border-[#BAE6FD] p-5 flex flex-col justify-between transition-colors group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold ${
                        isOpen
                          ? "bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]"
                          : "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                      }`}
                    >
                      {isOpen && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse" />
                      )}
                      {isOpen ? "Absensi Dibuka" : "Selesai"}
                    </span>

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-[#EBF5FF] text-[#0369A1] font-medium">
                      {ev.attendance_mode === "strict"
                        ? "Mode Ketat"
                        : "Mode Terbuka"}
                    </span>
                  </div>

                  <div>
                    <Link
                      href={`/admin/events/${ev.id}`}
                      className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#0284C7] transition-colors line-clamp-2"
                    >
                      {ev.title}
                    </Link>
                    <p className="text-[12px] text-[#64748B] flex items-center gap-1.5 mt-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                      <span className="truncate">
                        {formatDateIndo(ev.event_date, { shortMonth: true })} •{" "}
                        {ev.organizer}
                      </span>
                    </p>
                  </div>

                  <div className="bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg p-3 flex flex-col gap-1">
                    <span className="font-mono text-[11px] text-[#64748B]">
                      Contoh Nomor Sertifikat:
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] text-[#0F172A] font-semibold truncate">
                        {sampleNumber}
                      </span>
                      <QrCode
                        className="w-4 h-4 text-[#0284C7] shrink-0"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-[#0F172A] font-medium">
                        {ev.attended_count} Hadir
                      </span>
                      <span className="text-[#64748B]">
                        {ev.total_participants} Terdaftar ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#EBF5FF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0284C7] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#E2E8F0]">
                  <Link
                    href={`/admin/events/${ev.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white h-10 px-3 rounded-lg text-[12px] font-semibold transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.6} />
                    <span>Kelola Event</span>
                  </Link>
                  <Link
                    href={`/admin/events/${ev.id}?tab=design`}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] hover:bg-[#EBF5FF] text-[#0F172A] h-10 px-3 rounded-lg text-[12px] font-semibold transition-colors"
                    title="Desain Sertifikat"
                  >
                    <Award className="w-3.5 h-3.5 text-[#0284C7]" strokeWidth={1.6} />
                    <span>Sertifikat</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleCopyAttendLink(ev.slug)}
                    title="Salin Link Absensi"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] hover:text-[#0284C7] text-[#64748B] transition-colors shrink-0"
                  >
                    <Share2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
