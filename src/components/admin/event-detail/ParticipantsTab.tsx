"use client";

import {
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { EventWithStats, ParticipantRecord } from "@/lib/types";
import { formatTimeOnlyWib } from "@/lib/utils";

const ImportParticipantsModal = dynamic(
  () =>
    import("./ImportParticipantsModal").then(
      (m) => m.ImportParticipantsModal
    ),
  { ssr: false }
);

const ParticipantModal = dynamic(
  () => import("./ParticipantModal").then((m) => m.ParticipantModal),
  { ssr: false }
);

interface ParticipantsTabProps {
  event: EventWithStats;
  participants: ParticipantRecord[];
  importOpen: boolean;
  setImportOpen: (open: boolean) => void;
  onRefresh: () => Promise<void>;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export function ParticipantsTab({
  event,
  participants,
  importOpen,
  setImportOpen,
  onRefresh,
  onToast,
}: ParticipantsTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "hadir" | "belum">(
    "all"
  );
  const [page, setPage] = useState(1);
  const [editingParticipant, setEditingParticipant] =
    useState<ParticipantRecord | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pageSize = 20;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return participants.filter((p) => {
      if (statusFilter === "hadir" && p.is_attended !== 1) return false;
      if (statusFilter === "belum" && p.is_attended === 1) return false;
      if (!q) return true;
      return (
        p.nama_asli.toLowerCase().includes(q) ||
        p.instansi.toLowerCase().includes(q) ||
        (p.nomor_sertifikat || "").toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    });
  }, [participants, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const existingKeys = useMemo(
    () => new Set(participants.map((p) => p.nama_key)),
    [participants]
  );

  const handleMarkAttended = async (p: ParticipantRecord) => {
    setBusyId(p.id);
    try {
      const res = await fetch(
        `/api/admin/events/${event.id}/participants/${p.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_attended" }),
        }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        onToast(data.error || "Gagal menandai hadir.", "error");
        return;
      }
      onToast(`"${p.nama_asli}" ditandai hadir & sertifikat diterbitkan.`);
      await onRefresh();
    } catch {
      onToast("Gagal terhubung ke server.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (p: ParticipantRecord) => {
    if (!window.confirm(`Hapus peserta "${p.nama_asli}"?`)) return;
    setBusyId(p.id);
    try {
      const res = await fetch(
        `/api/admin/events/${event.id}/participants/${p.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      onToast(`"${p.nama_asli}" dihapus.`);
      await onRefresh();
    } catch {
      onToast("Gagal menghapus peserta.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, instansi, atau nomor sertifikat..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-white border border-[#E2E8F0] text-[13px] text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "hadir" | "belum");
              setPage(1);
            }}
            className="h-10 px-3 rounded-lg bg-white border border-[#E2E8F0] text-[13px] font-medium text-[#0F172A] focus:outline-none focus:border-[#0284C7] cursor-pointer"
          >
            <option value="all">Semua Status ({participants.length})</option>
            <option value="hadir">Sudah Hadir</option>
            <option value="belum">Belum Hadir</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/api/admin/events/${event.id}/participants/export`}
            className="h-10 px-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0F172A] text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-[#0284C7]" strokeWidth={1.5} />
            <span>Export Excel</span>
          </a>

          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="h-10 px-3.5 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] hover:bg-[#BAE6FD] text-[#0284C7] text-[13px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            <span>Import CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="h-10 px-4 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Tambah Manual</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#F8FBFF] border-b border-[#E2E8F0] h-11 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="px-4">Nama Lengkap & Instansi</th>
                <th className="px-4">Kontak</th>
                <th className="px-4">Peran</th>
                <th className="px-4">Status Absensi</th>
                <th className="px-4">Nomor Sertifikat & UUID</th>
                <th className="px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 px-4 text-center text-[13px] text-[#64748B]"
                  >
                    Belum ada data peserta yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const isHadir = p.is_attended === 1;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#F8FBFF] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-[#0F172A]">
                            {p.nama_asli}
                          </span>
                          <span className="text-[12px] text-[#64748B]">
                            {p.instansi || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-[13px] text-[#0F172A]">
                            {p.email || "—"}
                          </span>
                          <span className="font-mono text-[11px] text-[#64748B]">
                            {p.phone || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded border border-[#E2E8F0] bg-[#F8FBFF] text-[#475569] text-[12px] font-medium">
                          {p.role}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {isHadir ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-mono text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                            Hadir{" "}
                            {p.attended_at
                              ? `• ${formatTimeOnlyWib(p.attended_at)}`
                              : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] font-mono text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                            Belum Hadir
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {isHadir ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-[12px] font-semibold text-[#0F172A]">
                              {p.nomor_sertifikat}
                            </span>
                            <span className="font-mono text-[11px] text-[#64748B]">
                              {p.uuid_qr ? `${p.uuid_qr.slice(0, 8)}...` : "—"}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-[12px] text-[#94A3B8]">
                            — Menunggu absensi
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {!isHadir && (
                            <button
                              type="button"
                              disabled={busyId === p.id}
                              onClick={() => handleMarkAttended(p)}
                              title="Hadirkan Manual & Terbitkan Sertifikat"
                              className="p-2 rounded-lg text-[#0284C7] hover:bg-[#E0F2FE] transition-colors cursor-pointer"
                            >
                              <CheckCircle2
                                className="w-4 h-4"
                                strokeWidth={1.6}
                              />
                            </button>
                          )}
                          {isHadir && p.uuid_qr && (
                            <Link
                              href={`/event/${event.slug}/sertifikat/${p.uuid_qr}`}
                              target="_blank"
                              title="Lihat Sertifikat"
                              className="p-2 rounded-lg text-[#64748B] hover:text-[#0284C7] hover:bg-[#EBF5FF] transition-colors"
                            >
                              <Eye className="w-4 h-4" strokeWidth={1.5} />
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingParticipant(p)}
                            title="Edit Peserta"
                            className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FBFF] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => handleDelete(p)}
                            title="Hapus Peserta"
                            className="p-2 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
        <span className="text-[12px] text-[#64748B]">
          Menampilkan{" "}
          <strong className="text-[#0F172A]">
            {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)}
          </strong>{" "}
          dari <strong className="text-[#0F172A]">{filtered.length}</strong>{" "}
          peserta
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-[12px] font-medium text-[#0F172A] disabled:opacity-40 hover:bg-[#F8FBFF]"
          >
            Prev
          </button>
          <span className="font-mono text-[12px] px-2 text-[#64748B]">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-[12px] font-medium text-[#0F172A] disabled:opacity-40 hover:bg-[#F8FBFF]"
          >
            Next
          </button>
        </div>
      </div>

      {importOpen && (
        <ImportParticipantsModal
          eventId={event.id}
          existingNamaKeys={existingKeys}
          onClose={() => setImportOpen(false)}
          onImported={async (count) => {
            setImportOpen(false);
            onToast(`${count} peserta baru berhasil diimpor.`);
            await onRefresh();
          }}
          onToast={onToast}
        />
      )}

      {(addModalOpen || editingParticipant) && (
        <ParticipantModal
          eventId={event.id}
          participant={editingParticipant}
          onClose={() => {
            setAddModalOpen(false);
            setEditingParticipant(null);
          }}
          onSaved={async () => {
            setAddModalOpen(false);
            setEditingParticipant(null);
            await onRefresh();
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}
