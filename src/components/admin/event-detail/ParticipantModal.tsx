"use client";

import { Check, Info, Loader2, UserPlus, Verified, X } from "lucide-react";
import { useState } from "react";
import type { ParticipantRecord } from "@/lib/types";

interface ParticipantModalProps {
  eventId: string;
  participant?: ParticipantRecord | null;
  onClose: () => void;
  onSaved: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export function ParticipantModal({
  eventId,
  participant,
  onClose,
  onSaved,
  onToast,
}: ParticipantModalProps) {
  const isEdit = Boolean(participant);
  const [namaAsli, setNamaAsli] = useState(participant?.nama_asli || "");
  const [instansi, setInstansi] = useState(participant?.instansi || "");
  const [role, setRole] = useState(participant?.role || "Peserta");
  const [email, setEmail] = useState(participant?.email || "");
  const [phone, setPhone] = useState(participant?.phone || "");
  const [markAttended, setMarkAttended] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/events/${eventId}/participants/${participant!.id}`
        : `/api/admin/events/${eventId}/participants`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? {
                action: "update",
                nama_asli: namaAsli,
                instansi,
                role,
                email,
                phone,
              }
            : {
                nama_asli: namaAsli,
                instansi,
                role,
                email,
                phone,
                mark_attended: markAttended,
              }
        ),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        onToast(data.error || "Gagal menyimpan data peserta.", "error");
        return;
      }

      onToast(
        isEdit
          ? "Data peserta berhasil diperbarui."
          : "Peserta berhasil ditambahkan."
      );
      onSaved();
    } catch {
      onToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-[520px] bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col my-auto">
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <UserPlus className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h3 className="text-[18px] font-bold text-[#0F172A]">
              {isEdit ? "Edit Data Peserta" : "Tambah Peserta Manual"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F8FBFF]"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
          {!isEdit && (
            <div className="p-3 rounded-lg bg-[#EBF5FF] border border-[#BAE6FD] flex items-start gap-2.5 text-[12px] text-[#075985]">
              <Info className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>
                Tambahkan pendaftar susulan, pemateri, atau panitia secara instan tanpa perlu import ulang.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Nama Lengkap{" "}
              <span className="text-[#64748B] font-normal">
                (Sesuai cetakan sertifikat)
              </span>
            </label>
            <input
              type="text"
              required
              value={namaAsli}
              onChange={(e) => setNamaAsli(e.target.value)}
              placeholder="Contoh: Dr. Hendra Wijaya, M.T."
              className="h-11 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[14px] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Instansi / Universitas / Asal Sekolah
            </label>
            <input
              type="text"
              value={instansi}
              onChange={(e) => setInstansi(e.target.value)}
              placeholder="Contoh: Institut Teknologi Sepuluh Nopember"
              className="h-11 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[14px] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#0F172A]">
              Peran
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-11 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[14px] focus:outline-none focus:bg-white focus:border-[#0284C7]"
            >
              <option value="Peserta">Peserta</option>
              <option value="Pemateri">Pemateri</option>
              <option value="Moderator">Moderator</option>
              <option value="Panitia">Panitia</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0F172A]">
                Email <span className="text-[#64748B] font-normal">(Opsional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@instansi.ac.id"
                className="h-11 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[14px] focus:outline-none focus:bg-white focus:border-[#0284C7]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0F172A]">
                No. WhatsApp{" "}
                <span className="text-[#64748B] font-normal">(Opsional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="h-11 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[14px] focus:outline-none focus:bg-white focus:border-[#0284C7]"
              />
            </div>
          </div>

          {!isEdit && (
            <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#E2E8F0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Verified className="w-5 h-5 text-[#0284C7] shrink-0" strokeWidth={1.6} />
                <span className="text-[13px] font-medium text-[#0F172A]">
                  Langsung Tandai Hadir & Terbitkan Nomor Sertifikat Otomatis
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={markAttended}
                onClick={() => setMarkAttended((p) => !p)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
                  markAttended ? "bg-[#0284C7]" : "bg-[#CBD5E1]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    markAttended ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-[13px] font-medium hover:bg-[#F8FBFF]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 text-white text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" strokeWidth={2} />
              )}
              <span>Simpan Peserta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
