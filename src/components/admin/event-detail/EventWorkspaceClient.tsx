"use client";

import {
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ToastBanner, type ToastState } from "@/components/Toast";
import type { EventWithStats, ParticipantRecord } from "@/lib/types";
import { formatDateIndo } from "@/lib/utils";
import { EventOverviewTab } from "./EventOverviewTab";

const ParticipantsTab = dynamic(
  () => import("./ParticipantsTab").then((m) => m.ParticipantsTab),
  {
    loading: () => (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[13px] text-[#64748B]">
        Memuat manajemen peserta...
      </div>
    ),
  }
);

const CertificateStudioTab = dynamic(
  () => import("./CertificateStudioTab").then((m) => m.CertificateStudioTab),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[13px] text-[#64748B]">
        Memuat editor sertifikat visual...
      </div>
    ),
  }
);

const EventSettingsTab = dynamic(
  () => import("./EventSettingsTab").then((m) => m.EventSettingsTab),
  {
    loading: () => (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[13px] text-[#64748B]">
        Memuat pengaturan acara...
      </div>
    ),
  }
);

export type EventTabKey = "overview" | "participants" | "design" | "settings";

interface EventWorkspaceClientProps {
  initialEvent: EventWithStats;
  initialParticipants: ParticipantRecord[];
  initialTab: EventTabKey;
}

export function EventWorkspaceClient({
  initialEvent,
  initialParticipants,
  initialTab,
}: EventWorkspaceClientProps) {
  const [event, setEvent] = useState<EventWithStats>(initialEvent);
  const [participants, setParticipants] =
    useState<ParticipantRecord[]>(initialParticipants);
  const [activeTab, setActiveTab] = useState<EventTabKey>(initialTab);
  const [importOpen, setImportOpen] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [appOrigin, setAppOrigin] = useState(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const refreshEventAndParticipants = async () => {
    const res = await fetch(`/api/admin/events/${event.id}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      event?: EventWithStats;
      participants?: ParticipantRecord[];
    };
    if (data.event) setEvent(data.event);
    if (data.participants) setParticipants(data.participants);
  };

  const handleToggleFlag = async (
    field: "is_attendance_open" | "is_download_open"
  ) => {
    setToggling(field);
    const nextVal = event[field] === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextVal }),
      });
      const data = (await res.json()) as { event?: EventWithStats };
      if (!res.ok || !data.event) throw new Error();
      setEvent(data.event);
      if (field === "is_attendance_open") {
        showToast(
          nextVal === 1 ? "Sesi absensi dibuka." : "Sesi absensi ditutup."
        );
      } else {
        showToast(
          nextVal === 1
            ? "Unduh sertifikat diaktifkan."
            : "Unduh sertifikat dinonaktifkan."
        );
      }
    } catch {
      showToast("Gagal memperbarui status.", "error");
    } finally {
      setToggling(null);
    }
  };

  const tabs: {
    key: EventTabKey;
    label: string;
    icon: typeof BarChart3;
  }[] = [
    { key: "overview", label: "Ringkasan", icon: BarChart3 },
    {
      key: "participants",
      label: `Data Peserta (${participants.length})`,
      icon: Users,
    },
    { key: "design", label: "Desain Sertifikat & QR", icon: Award },
    { key: "settings", label: "Pengaturan Event", icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-[#64748B]">
        <Link href="/admin/events" className="hover:text-[#0284C7]">
          Manajemen Webinar
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={1.5} />
        <span className="text-[#0F172A] font-medium truncate">
          {event.title}
        </span>
      </nav>

      {/* Persistent Event Header */}
      <section className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-mono text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.6} />
                {event.attendance_mode === "strict"
                  ? "Mode Ketat"
                  : "Mode Terbuka"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F8FBFF] border border-[#E2E8F0] text-[#475569] text-[12px]">
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                {formatDateIndo(event.event_date)}
              </span>
              <span className="font-mono text-[11px] text-[#64748B]">
                /event/{event.slug}
              </span>
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F172A] tracking-tight">
              {event.title}
            </h1>
          </div>

          {/* Live Toggle Switches */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center justify-between gap-3 bg-[#F8FBFF] border border-[#E2E8F0] px-4 py-2.5 rounded-xl min-w-[195px] flex-1 sm:flex-initial">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#64748B]">Status Absensi</span>
                <span
                  className={`font-mono text-[12px] font-bold ${
                    event.is_attendance_open === 1
                      ? "text-[#0284C7]"
                      : "text-[#64748B]"
                  }`}
                >
                  {event.is_attendance_open === 1 ? "DIBUKA" : "DITUTUP"}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                disabled={toggling === "is_attendance_open"}
                aria-checked={event.is_attendance_open === 1}
                onClick={() => handleToggleFlag("is_attendance_open")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
                  event.is_attendance_open === 1
                    ? "bg-[#0284C7]"
                    : "bg-[#CBD5E1]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    event.is_attendance_open === 1
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 bg-[#F8FBFF] border border-[#E2E8F0] px-4 py-2.5 rounded-xl min-w-[195px] flex-1 sm:flex-initial">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#64748B]">
                  Unduh Sertifikat
                </span>
                <span
                  className={`font-mono text-[12px] font-bold ${
                    event.is_download_open === 1
                      ? "text-[#0284C7]"
                      : "text-[#64748B]"
                  }`}
                >
                  {event.is_download_open === 1 ? "AKTIF" : "NONAKTIF"}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                disabled={toggling === "is_download_open"}
                aria-checked={event.is_download_open === 1}
                onClick={() => handleToggleFlag("is_download_open")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
                  event.is_download_open === 1 ? "bg-[#0284C7]" : "bg-[#CBD5E1]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    event.is_download_open === 1
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 pb-3 pt-1 border-b-2 text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? "border-[#0284C7] text-[#0284C7] font-semibold"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A] font-medium"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.6} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <EventOverviewTab
          event={event}
          participants={participants}
          appOrigin={appOrigin}
          onSwitchTab={setActiveTab}
          onOpenImport={() => setImportOpen(true)}
          onToast={showToast}
        />
      )}

      {activeTab === "participants" && (
        <ParticipantsTab
          event={event}
          participants={participants}
          importOpen={importOpen}
          setImportOpen={setImportOpen}
          onRefresh={refreshEventAndParticipants}
          onToast={showToast}
        />
      )}

      {activeTab === "design" && (
        <CertificateStudioTab
          event={event}
          participants={participants}
          appOrigin={appOrigin}
          onEventUpdated={setEvent}
          onToast={showToast}
        />
      )}

      {activeTab === "settings" && (
        <EventSettingsTab
          event={event}
          onEventUpdated={setEvent}
          onToast={showToast}
        />
      )}

      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
