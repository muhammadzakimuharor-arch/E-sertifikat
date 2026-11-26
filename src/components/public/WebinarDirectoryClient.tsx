"use client";

import {
  Building2,
  Calendar,
  Download,
  Lock,
  Search,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { EventRecord } from "@/lib/types";
import { formatDateIndo } from "@/lib/utils";

export function WebinarDirectoryClient({
  events,
}: {
  events: EventRecord[];
}) {
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const open = events.filter((e) => e.is_attendance_open === 1).length;
    const closed = events.filter((e) => e.is_attendance_open !== 1).length;
    return { all: events.length, open, closed };
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      if (filter === "open" && ev.is_attendance_open !== 1) return false;
      if (filter === "closed" && ev.is_attendance_open === 1) return false;
      if (!q) return true;
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.organizer.toLowerCase().includes(q) ||
        ev.speaker.toLowerCase().includes(q)
      );
    });
  }, [events, filter, search]);

  return (
    <div className="max-w-[1360px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col gap-8">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-7 flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#0284C7] font-semibold">
              Jadwal Agenda Publik
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[30px] font-bold text-[#0F172A] tracking-tight">
            Daftar Kegiatan Webinar Aktif & Selesai
          </h1>
          <p className="text-[14px] text-[#64748B] mt-1">
            Pilih acara yang Anda ikuti untuk mengisi absensi kehadiran atau mencari & mengunduh ulang e-sertifikat resmi.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-4 h-9 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-[#0284C7] text-white font-semibold"
                  : "bg-[#F8FBFF] border border-[#E2E8F0] text-[#475569] hover:border-[#BAE6FD]"
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilter("open")}
              className={`px-4 h-9 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === "open"
                  ? "bg-[#0284C7] text-white font-semibold"
                  : "bg-[#F8FBFF] border border-[#E2E8F0] text-[#475569] hover:border-[#BAE6FD]"
              }`}
            >
              Absensi Dibuka ({counts.open})
            </button>
            <button
              type="button"
              onClick={() => setFilter("closed")}
              className={`px-4 h-9 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === "closed"
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
              className="w-full h-10 pl-10 pr-4 bg-[#F8FBFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center">
          <p className="text-[15px] font-semibold text-[#0F172A]">
            Tidak ada webinar yang cocok
          </p>
          <p className="text-[13px] text-[#64748B] mt-1">
            Coba kata kunci pencarian lain atau ubah filter status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ev) => {
            const isOpen = ev.is_attendance_open === 1;
            return (
              <article
                key={ev.id}
                className="bg-white rounded-xl border border-[#E2E8F0] hover:border-[#BAE6FD] p-5 sm:p-6 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold ${
                        isOpen
                          ? "bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]"
                          : "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                      }`}
                    >
                      {isOpen ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse" />
                      ) : (
                        <Lock className="w-3 h-3" strokeWidth={1.6} />
                      )}
                      {isOpen ? "Absensi Dibuka" : "Sesi Ditutup"}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-md bg-[#F8FBFF] border border-[#E2E8F0] text-[#475569] font-mono text-[11px] font-medium">
                      {ev.attendance_mode === "strict"
                        ? "Mode Ketat"
                        : "Mode Terbuka"}
                    </span>
                  </div>

                  <h2 className="text-[18px] font-bold text-[#0F172A] leading-snug">
                    {ev.title}
                  </h2>

                  <div className="flex items-center gap-2 mt-3 text-[13px] text-[#475569]">
                    <Calendar
                      className="w-4 h-4 text-[#0284C7] shrink-0"
                      strokeWidth={1.5}
                    />
                    <span>{formatDateIndo(ev.event_date)}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[13px] text-[#64748B]">
                    <Building2
                      className="w-4 h-4 text-[#64748B] shrink-0"
                      strokeWidth={1.5}
                    />
                    <span className="truncate">{ev.organizer}</span>
                  </div>

                  {ev.speaker && (
                    <p className="text-[12px] text-[#64748B] mt-2 truncate">
                      Pemateri:{" "}
                      <span className="font-medium text-[#0F172A]">
                        {ev.speaker}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-col gap-2.5">
                  {isOpen && (
                    <Link
                      href={`/event/${ev.slug}/absen`}
                      className="w-full min-h-[44px] px-4 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" strokeWidth={1.75} />
                      <span>Isi Absensi</span>
                    </Link>
                  )}
                  <Link
                    href={`/event/${ev.slug}/cari`}
                    className={`w-full min-h-[44px] px-4 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                      isOpen
                        ? "bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0284C7]"
                        : "bg-[#E0F2FE] border border-[#BAE6FD] hover:bg-[#BAE6FD] text-[#0284C7]"
                    }`}
                  >
                    {isOpen ? (
                      <Search className="w-4 h-4" strokeWidth={1.6} />
                    ) : (
                      <Download className="w-4 h-4" strokeWidth={1.6} />
                    )}
                    <span>
                      {isOpen
                        ? "Cari Sertifikat"
                        : "Cari & Unduh Sertifikat"}
                    </span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
