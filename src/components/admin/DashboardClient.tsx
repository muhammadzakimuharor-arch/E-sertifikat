"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Plus,
  QrCode,
  Shield,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  Users,
  Verified,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ToastBanner, type ToastState } from "@/components/Toast";
import type { EventWithStats, VerificationLogRecord } from "@/lib/types";
import { formatDateIndo, formatRelativeTimeIndo } from "@/lib/utils";

interface DashboardClientProps {
  metrics: {
    totalEvents: number;
    activeEvents: number;
    totalParticipants: number;
    issuedCerts: number;
    totalScans: number;
  };
  initialEvents: EventWithStats[];
  recentLogs: VerificationLogRecord[];
  dailyAttendance: { day: string; count: number }[];
}

export function DashboardClient({
  metrics,
  initialEvents,
  recentLogs,
  dailyAttendance,
}: DashboardClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleToggleAttendance = async (ev: EventWithStats) => {
    setTogglingId(ev.id);
    const nextState = ev.is_attendance_open === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_attendance_open: nextState }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      setEvents((prev) =>
        prev.map((item) =>
          item.id === ev.id
            ? { ...item, is_attendance_open: nextState }
            : item
        )
      );
      showToast(
        nextState === 1
          ? `Absensi "${ev.title}" dibuka.`
          : `Absensi "${ev.title}" ditutup.`
      );
    } catch {
      showToast("Gagal memperbarui status absensi.", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const activeEvents = events.filter((e) => e.is_attendance_open === 1);
  const displayEvents = activeEvents.length > 0 ? activeEvents : events.slice(0, 3);

  // Build 7-day chart bars from dailyAttendance (fallback to clean weekday slots)
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const countMap = new Map(dailyAttendance.map((d) => [d.day, d.count]));
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: dayNames[d.getDay()],
      count: countMap.get(key) ?? 0,
      isToday: i === 6,
    };
  });
  const maxBarCount = Math.max(1, ...last7Days.map((b) => b.count));

  const attendanceRate =
    metrics.totalParticipants > 0
      ? Math.round((metrics.issuedCerts / metrics.totalParticipants) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-5 rounded-full bg-[#0284C7] inline-block" />
            <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F172A] tracking-tight">
              Dashboard Overview
            </h1>
          </div>
          <p className="text-[14px] text-[#64748B]">
            Ringkasan performa event, absensi, dan penerbitan sertifikat digital terverifikasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/logs"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] hover:border-[#BAE6FD] hover:bg-[#F8FBFF] font-medium text-[13px] transition-colors"
          >
            <Verified className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
            <span>Audit Verifikasi</span>
          </Link>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-[13px] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Buat Webinar Baru</span>
          </Link>
        </div>
      </div>

      {/* Row 1: KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between hover:border-[#BAE6FD] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
              <CalendarDays className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <span className="font-mono text-[11px] bg-[#EBF5FF] text-[#0284C7] border border-[#BAE6FD] px-2.5 py-0.5 rounded-full font-medium">
              {metrics.activeEvents} Aktif
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-semibold block">
              Total Webinar
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[28px] font-bold text-[#0F172A] tracking-tight">
                {metrics.totalEvents}
              </span>
              <span className="text-[13px] text-[#64748B] font-medium">
                Kegiatan
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center gap-2 text-[12px] text-[#64748B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
            <span>
              {metrics.activeEvents} Dibuka •{" "}
              {Math.max(0, metrics.totalEvents - metrics.activeEvents)} Ditutup
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between hover:border-[#BAE6FD] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
              <Users className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <span className="font-mono text-[11px] bg-[#EBF5FF] text-[#0284C7] border border-[#BAE6FD] px-2.5 py-0.5 rounded-full font-medium">
              {attendanceRate}% hadir
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-semibold block">
              Total Peserta Terdaftar
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[28px] font-bold text-[#0F172A] tracking-tight">
                {metrics.totalParticipants.toLocaleString("id-ID")}
              </span>
              <span className="text-[13px] text-[#64748B] font-medium">
                Peserta
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center gap-1.5 text-[12px] text-[#64748B]">
            <TrendingUp className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
            <span>Terindeks & bebas duplikat nama</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between hover:border-[#BAE6FD] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
              <Shield className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <span className="font-mono text-[11px] bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full font-medium">
              Terverifikasi
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-semibold block">
              Sertifikat Diterbitkan
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[28px] font-bold text-[#0F172A] tracking-tight">
                {metrics.issuedCerts.toLocaleString("id-ID")}
              </span>
              <span className="text-[13px] text-[#64748B] font-medium">
                Dokumen
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center gap-1.5 text-[12px] text-[#64748B]">
            <CheckCircle2 className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
            <span>UUID unik anti-pemalsuan</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between hover:border-[#BAE6FD] transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
              <QrCode className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <span className="font-mono text-[11px] bg-[#EBF5FF] text-[#0284C7] border border-[#BAE6FD] px-2.5 py-0.5 rounded-full font-medium">
              Audit Real-Time
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-semibold block">
              Total Scan Verifikasi QR
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[28px] font-bold text-[#0F172A] tracking-tight">
                {metrics.totalScans.toLocaleString("id-ID")}
              </span>
              <span className="text-[13px] text-[#64748B] font-medium">
                Pengecekan
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center gap-1.5 text-[12px] text-[#64748B]">
            <QrCode className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
            <span>Scan kamera QR & input manual</span>
          </div>
        </div>
      </div>

      {/* Row 2: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Webinars & Weekly Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[18px] font-semibold text-[#0F172A] tracking-tight">
                  Webinar Aktif Saat Ini
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-[#E0F2FE] text-[#0284C7] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse" />
                  {activeEvents.length} Absensi Dibuka
                </span>
              </div>
              <Link
                href="/admin/events"
                className="text-[13px] font-semibold text-[#0284C7] hover:text-[#0369A1] inline-flex items-center gap-1 transition-colors"
              >
                <span>Semua Webinar</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>

            {displayEvents.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#F8FBFF] border border-dashed border-[#BAE6FD] text-center">
                <p className="text-[14px] text-[#64748B] mb-3">
                  Belum ada kegiatan webinar yang dibuat.
                </p>
                <Link
                  href="/admin/events/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0284C7] text-white text-[13px] font-semibold"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  <span>Buat Webinar Pertama</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {displayEvents.map((ev) => {
                  const pct =
                    ev.total_participants > 0
                      ? Math.round(
                          (ev.attended_count / ev.total_participants) * 100
                        )
                      : 0;
                  const isOpen = ev.is_attendance_open === 1;
                  return (
                    <div
                      key={ev.id}
                      className="rounded-xl p-4 sm:p-5 bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] transition-colors flex flex-col gap-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-mono text-[11px] bg-white border border-[#E2E8F0] text-[#475569] px-2.5 py-0.5 rounded">
                              {formatDateIndo(ev.event_date, {
                                shortMonth: true,
                              })}
                            </span>
                            <span className="font-mono text-[11px] bg-[#EBF5FF] border border-[#BAE6FD] text-[#0284C7] px-2.5 py-0.5 rounded font-medium">
                              {ev.attendance_mode === "strict"
                                ? "Mode Ketat"
                                : "Mode Terbuka"}
                            </span>
                            <button
                              type="button"
                              disabled={togglingId === ev.id}
                              onClick={() => handleToggleAttendance(ev)}
                              className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full font-semibold border transition-colors cursor-pointer ${
                                isOpen
                                  ? "bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]"
                                  : "bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]"
                              }`}
                            >
                              {isOpen ? "Absensi Dibuka" : "Absensi Ditutup"}
                            </button>
                          </div>
                          <Link
                            href={`/admin/events/${ev.id}`}
                            className="text-[16px] font-semibold text-[#0F172A] hover:text-[#0284C7] transition-colors block truncate"
                          >
                            {ev.title}
                          </Link>
                          <p className="text-[12px] text-[#64748B] mt-0.5 truncate">
                            {ev.organizer}
                            {ev.speaker ? ` • Pemateri: ${ev.speaker}` : ""} •
                            Slug:{" "}
                            <span className="font-mono text-[#0284C7]">
                              {ev.slug}
                            </span>
                          </p>
                        </div>

                        <Link
                          href={`/admin/events/${ev.id}`}
                          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-white border border-[#E2E8F0] text-[#0284C7] hover:bg-[#0284C7] hover:text-white hover:border-[#0284C7] text-[13px] font-semibold transition-colors shrink-0"
                        >
                          <SlidersHorizontal
                            className="w-4 h-4"
                            strokeWidth={1.5}
                          />
                          <span>Kelola Event</span>
                        </Link>
                      </div>

                      <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-lg flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-[#0F172A] font-medium flex items-center gap-1.5">
                            <UserCheck
                              className="w-4 h-4 text-[#0284C7]"
                              strokeWidth={1.5}
                            />
                            Tingkat Kehadiran Realtime
                          </span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-[#0F172A] font-bold">
                              {ev.attended_count}
                            </span>
                            <span className="text-[#64748B]">
                              / {ev.total_participants} Hadir
                            </span>
                            <span className="text-[#0284C7] font-bold">
                              ({pct}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-[#EBF5FF] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0284C7] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Weekly Attendance Chart */}
            <div className="bg-[#F8FBFF] border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#0F172A]">
                  Trafik Absensi 7 Hari Terakhir
                </span>
                <span className="font-mono text-[11px] text-[#64748B]">
                  Realtime DB
                </span>
              </div>
              <div className="h-28 w-full flex items-end justify-between gap-2 sm:gap-3 pt-4 px-1">
                {last7Days.map((bar) => {
                  const heightPct =
                    bar.count === 0
                      ? 12
                      : Math.max(20, Math.round((bar.count / maxBarCount) * 100));
                  return (
                    <div
                      key={bar.key}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                      title={`${bar.key}: ${bar.count} hadir`}
                    >
                      <span className="font-mono text-[10px] text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity">
                        {bar.count}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          bar.isToday || bar.count > 0
                            ? "bg-[#0284C7] group-hover:bg-[#0369A1]"
                            : "bg-[#BAE6FD]"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span
                        className={`font-mono text-[11px] ${
                          bar.isToday
                            ? "text-[#0284C7] font-bold"
                            : "text-[#64748B]"
                        }`}
                      >
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Verification Feed */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#0284C7]" strokeWidth={1.5} />
                <h2 className="text-[16px] font-semibold text-[#0F172A]">
                  Aktivitas Verifikasi QR
                </h2>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse" />
            </div>
            <p className="text-[12px] text-[#64748B] -mt-2">
              Log otentikasi dokumen via pemindaian QR dan cek nomor manual.
            </p>

            <div className="flex flex-col gap-2.5">
              {recentLogs.length === 0 ? (
                <p className="text-[13px] text-[#64748B] py-4 text-center">
                  Belum ada aktivitas verifikasi.
                </p>
              ) : (
                recentLogs.map((log) => {
                  const isValid = log.status === "valid";
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] transition-colors flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-[#0F172A] truncate">
                          {log.participant_name || "Kode Tidak Terdaftar"}
                        </span>
                        <span
                          className={`font-mono text-[11px] px-2 py-0.5 rounded-full shrink-0 font-medium inline-flex items-center gap-1 ${
                            isValid
                              ? "bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]"
                              : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                          }`}
                        >
                          {isValid ? (
                            <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
                          ) : (
                            <XCircle className="w-3 h-3" strokeWidth={1.75} />
                          )}
                          {isValid ? "Terverifikasi" : "Tidak Sah"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] gap-2">
                        <span className="text-[#0284C7] truncate">
                          {log.cert_number || log.queried_code}
                        </span>
                        <span className="text-[#64748B] shrink-0">
                          {formatRelativeTimeIndo(log.checked_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3.5 rounded-lg bg-[#EBF5FF] border border-[#BAE6FD] flex items-start gap-2.5">
              <Shield
                className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5"
                strokeWidth={1.5}
              />
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold text-[#0F172A]">
                  Proteksi Anti-Pemalsuan Aktif
                </span>
                <span className="text-[11px] text-[#475569] leading-snug mt-0.5">
                  Setiap sertifikat memiliki UUID unik acak & nomor urut atomik
                  yang diverifikasi langsung terhadap ledger VeriCert.
                </span>
              </div>
            </div>

            <Link
              href="/admin/logs"
              className="text-center text-[13px] font-semibold text-[#0284C7] hover:bg-[#EBF5FF] py-2.5 rounded-lg border border-[#BAE6FD] transition-colors"
            >
              Buka Seluruh Log Verifikasi →
            </Link>
          </div>
        </div>
      </div>

      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
