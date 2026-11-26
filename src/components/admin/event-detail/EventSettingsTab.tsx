"use client";

import { AlertTriangle, Check, Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AttendanceMode, EventWithStats } from "@/lib/types";
import { formatCertificateNumber, slugify } from "@/lib/utils";

interface EventSettingsTabProps {
  event: EventWithStats;
  onEventUpdated: (ev: EventWithStats) => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export function EventSettingsTab({
  event,
  onEventUpdated,
  onToast,
}: EventSettingsTabProps) {
  const router = useRouter();
  const [title, setTitle] = useState(event.title);
  const [organizer, setOrganizer] = useState(event.organizer);
  const [eventDate, setEventDate] = useState(event.event_date);
  const [speaker, setSpeaker] = useState(event.speaker);
  const [slug, setSlug] = useState(event.slug);
  const [certFormat, setCertFormat] = useState(event.cert_number_format);
  const [startNumber, setStartNumber] = useState(event.start_number);
  const [padding, setPadding] = useState(event.number_padding);
  const [mode, setMode] = useState<AttendanceMode>(event.attendance_mode);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          organizer,
          event_date: eventDate,
          speaker,
          slug: slugify(slug),
          cert_number_format: certFormat,
          start_number: startNumber,
          number_padding: padding,
          attendance_mode: mode,
        }),
      });
      const data = (await res.json()) as {
        event?: EventWithStats;
        error?: string;
      };
      if (!res.ok || !data.event) {
        onToast(data.error || "Gagal menyimpan pengaturan.", "error");
        return;
      }
      onEventUpdated(data.event);
      onToast("Pengaturan webinar berhasil diperbarui.");
    } catch {
      onToast("Gagal terhubung ke server.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Hapus permanen webinar "${event.title}" beserta seluruh data pesertanya? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.push("/admin/events");
      router.refresh();
    } catch {
      onToast("Gagal menghapus webinar.", "error");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-6"
      >
        <h2 className="text-[18px] font-bold text-[#0F172A] pb-3 border-b border-[#E2E8F0]">
          Informasi & Konfigurasi Webinar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Judul Acara
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Penyelenggara
            </label>
            <input
              type="text"
              required
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Tanggal Pelaksanaan
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
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
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Slug URL Publik
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] font-mono text-[13px] focus:outline-none focus:border-[#0284C7]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#E2E8F0]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Format Nomor Sertifikat
            </label>
            <input
              type="text"
              required
              value={certFormat}
              onChange={(e) => setCertFormat(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] font-mono text-[13px] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Nomor Awal
            </label>
            <input
              type="number"
              min={1}
              value={startNumber}
              onChange={(e) =>
                setStartNumber(Math.max(1, Number(e.target.value) || 1))
              }
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] font-mono text-[13px] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Digit Padding
            </label>
            <select
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] font-mono text-[13px]"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Digit
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] flex items-center justify-between text-[12px]">
          <span className="text-[#64748B]">
            Nomor Berikutnya:{" "}
            <strong className="font-mono text-[#0284C7]">
              {formatCertificateNumber(
                certFormat,
                Math.max(event.last_number + 1, startNumber),
                padding
              )}
            </strong>
          </span>
          <span className="font-mono text-[#64748B]">
            Last Sequence: {event.last_number}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["strict", "open"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`text-left p-4 rounded-xl border flex items-start gap-3 cursor-pointer ${
                mode === m
                  ? "bg-[#EBF5FF] border-[#0284C7]"
                  : "bg-white border-[#E2E8F0]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  mode === m
                    ? "bg-[#0284C7] text-white"
                    : "border border-[#CBD5E1]"
                }`}
              >
                {mode === m && <Check className="w-3.5 h-3.5" />}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#0F172A]">
                  {m === "strict"
                    ? "Mode Ketat (Wajib Terdaftar)"
                    : "Mode Terbuka (Auto-Register)"}
                </p>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  {m === "strict"
                    ? "Hanya peserta yang sudah di-import / ditambah admin."
                    : "Peserta mendaftar mandiri saat mengisi presensi."}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-[#FECACA] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.6} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#0F172A]">
              Hapus Webinar Permanen
            </h3>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Menghapus acara ini juga menghapus seluruh peserta dan kode verifikasi terkait.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="h-10 px-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" strokeWidth={1.6} />
          )}
          <span>Hapus Webinar</span>
        </button>
      </div>
    </div>
  );
}
