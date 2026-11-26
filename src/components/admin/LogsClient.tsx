"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FilterX,
  Keyboard,
  QrCode,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { VerificationLogRecord } from "@/lib/types";
import { formatDateTimeWib } from "@/lib/utils";

interface LogsClientProps {
  initialLogs: VerificationLogRecord[];
}

export function LogsClient({ initialLogs }: LogsClientProps) {
  const [logs, setLogs] = useState<VerificationLogRecord[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<VerificationLogRecord | null>(
    null
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (methodFilter !== "all") params.set("method", methodFilter);
        if (rangeFilter !== "all") params.set("range", rangeFilter);

        const res = await fetch(`/api/admin/logs?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { logs?: VerificationLogRecord[] };
        if (data.logs) setLogs(data.logs);
      } catch {
        // Ignore aborted requests
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, statusFilter, methodFilter, rangeFilter]);

  const validCount = logs.filter((l) => l.status === "valid").length;
  const invalidCount = logs.filter((l) => l.status === "invalid").length;
  const qrCount = logs.filter((l) => l.method === "qr").length;
  const validRate =
    logs.length > 0 ? Math.round((validCount / logs.length) * 1000) / 10 : 100;
  const qrShare =
    logs.length > 0 ? Math.round((qrCount / logs.length) * 100) : 0;

  const exportParams = new URLSearchParams({ format: "csv" });
  if (search.trim()) exportParams.set("q", search.trim());
  if (statusFilter !== "all") exportParams.set("status", statusFilter);
  if (methodFilter !== "all") exportParams.set("method", methodFilter);
  if (rangeFilter !== "all") exportParams.set("range", rangeFilter);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
    setRangeFilter("all");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F172A] tracking-tight">
              Log Verifikasi & Aktivitas Sistem
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] font-mono text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              Audit Stream ON
            </span>
          </div>
          <p className="text-[14px] text-[#64748B]">
            Pemantauan audit pemindaian QR Code dan verifikasi nomor sertifikat publik secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#475569] text-[13px] font-medium cursor-pointer"
          >
            <FilterX className="w-4 h-4" strokeWidth={1.5} />
            <span>Bersihkan Filter</span>
          </button>
          <a
            href={`/api/admin/logs?${exportParams.toString()}`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold"
          >
            <Download className="w-4 h-4" strokeWidth={1.6} />
            <span>Ekspor Log (CSV)</span>
          </a>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold block">
              Total Aktivitas
            </span>
            <span className="text-[26px] font-bold text-[#0F172A]">
              {logs.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
            <QrCode className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold block">
              Tingkat Sah (Valid)
            </span>
            <span className="text-[26px] font-bold text-[#0F172A]">
              {validRate}%
            </span>
            <span className="text-[11px] text-[#16A34A] block">
              {validCount} dokumen terverifikasi
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold block">
              Tidak Ditemukan / Anomali
            </span>
            <span className="text-[26px] font-bold text-[#DC2626]">
              {invalidCount}
            </span>
            <span className="text-[11px] text-[#DC2626]/80 block">
              Percobaan kode tidak sah
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold block">
              Via Scan QR
            </span>
            <span className="text-[26px] font-bold text-[#0F172A]">
              {qrShare}%
            </span>
            <span className="text-[11px] text-[#64748B] block">
              {qrCount} QR • {logs.length - qrCount} Manual
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#EBF5FF] text-[#0284C7] flex items-center justify-center">
            <QrCode className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor sertifikat, UUID, nama peserta, atau webinar..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[13px] focus:outline-none focus:bg-white focus:border-[#0284C7]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[13px] text-[#0F172A]"
          >
            <option value="all">Semua Status</option>
            <option value="valid">Terverifikasi</option>
            <option value="invalid">Tidak Ditemukan</option>
          </select>

          <select
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[13px] text-[#0F172A]"
          >
            <option value="all">Semua Waktu</option>
            <option value="24h">24 Jam Terakhir</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[13px] text-[#0F172A]"
          >
            <option value="all">Semua Metode</option>
            <option value="qr">Scan QR</option>
            <option value="manual">Input Manual</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-[#F8FBFF] border-b border-[#E2E8F0] h-11 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="px-4">Waktu Cek</th>
                <th className="px-4">Kode / Nomor Sertifikat</th>
                <th className="px-4">Nama Peserta</th>
                <th className="px-4">Nama Webinar</th>
                <th className="px-4">Metode</th>
                <th className="px-4">Status</th>
                <th className="px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-[#64748B]"
                  >
                    Memuat log verifikasi...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-[#64748B]"
                  >
                    Tidak ada log verifikasi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isValid = log.status === "valid";
                  return (
                    <tr
                      key={log.id}
                      className={
                        isValid
                          ? "hover:bg-[#F8FBFF] transition-colors"
                          : "bg-[#FEF2F2]/30 hover:bg-[#FEF2F2]/60 transition-colors"
                      }
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[12px] text-[#475569]">
                        {formatDateTimeWib(log.checked_at)}
                      </td>
                      <td className="px-4 py-3.5 max-w-[240px]">
                        <div className="flex flex-col">
                          <span
                            className={`font-mono text-[12px] font-semibold truncate ${
                              isValid ? "text-[#0F172A]" : "text-[#DC2626]"
                            }`}
                          >
                            {log.cert_number || log.queried_code}
                          </span>
                          {log.cert_number && (
                            <span className="font-mono text-[11px] text-[#0284C7] truncate">
                              {log.queried_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#0F172A]">
                        {log.participant_name || "Anonim / Tidak Terdaftar"}
                      </td>
                      <td className="px-4 py-3.5 max-w-[220px] truncate text-[#475569]">
                        {log.event_title || "— Tidak Terdaftar —"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FBFF] border border-[#E2E8F0] text-[#0F172A] text-[12px]">
                          {log.method === "qr" ? (
                            <QrCode className="w-3.5 h-3.5 text-[#0284C7]" />
                          ) : (
                            <Keyboard className="w-3.5 h-3.5 text-[#64748B]" />
                          )}
                          <span>
                            {log.method === "qr" ? "Scan QR" : "Input Manual"}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isValid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-mono text-[11px] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-mono text-[11px] font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            Tidak Ditemukan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                            isValid
                              ? "text-[#0284C7] hover:bg-[#E0F2FE]"
                              : "text-[#DC2626] hover:bg-[#FEF2F2]"
                          }`}
                        >
                          <span>Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] max-w-lg w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                Detail Jejak Audit Verifikasi
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F8FBFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                selectedLog.status === "valid"
                  ? "bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]"
                  : "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]"
              }`}
            >
              {selectedLog.status === "valid" ? (
                <ShieldCheck className="w-5 h-5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" />
              )}
              <div>
                <p className="text-[13px] font-bold">
                  {selectedLog.status === "valid"
                    ? "Kredensial Sah & Terotentikasi"
                    : "Kredensial Tidak Ditemukan"}
                </p>
                <p className="text-[12px] opacity-90">
                  {selectedLog.status === "valid"
                    ? "Tercatat sah pada database ledger VeriCert."
                    : "Kode atau UUID tidak cocok dengan sertifikat mana pun."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">
                  Nama Pemegang
                </span>
                <span className="font-semibold text-[#0F172A]">
                  {selectedLog.participant_name || "—"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">
                  Nomor Sertifikat
                </span>
                <span className="font-mono font-semibold text-[#0284C7]">
                  {selectedLog.cert_number || "—"}
                </span>
              </div>
              <div className="sm:col-span-2 p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">
                  Kode / UUID yang Diperiksa
                </span>
                <span className="font-mono text-[12px] text-[#0F172A] break-all">
                  {selectedLog.queried_code}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">
                  Metode Pengecekan
                </span>
                <span className="font-medium text-[#0F172A]">
                  {selectedLog.method === "qr" ? "Scan QR" : "Input Manual"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">
                  Waktu Pemeriksaan
                </span>
                <span className="font-mono text-[12px] text-[#0F172A]">
                  {formatDateTimeWib(selectedLog.checked_at)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="h-10 px-4 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] text-[#0F172A] text-[13px] font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
