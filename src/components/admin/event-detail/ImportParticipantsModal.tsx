"use client";

import {
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { normalizeNamaKey } from "@/lib/utils";

interface ParsedRow {
  rowNum: number;
  nama_asli: string;
  nama_key: string;
  instansi: string;
  email: string;
  phone: string;
  role: string;
  isDuplicate: boolean;
}

interface ImportParticipantsModalProps {
  eventId: string;
  existingNamaKeys: Set<string>;
  onClose: () => void;
  onImported: (count: number) => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export function ImportParticipantsModal({
  eventId,
  existingNamaKeys,
  onClose,
  onImported,
  onToast,
}: ImportParticipantsModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSizeKb, setFileSizeKb] = useState(0);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        "Nama Lengkap": "Dr. Ratna Sari Dewi, M.Kom.",
        Instansi: "Universitas Indonesia",
        Email: "ratna.dewi@ui.ac.id",
        "No. WhatsApp": "081234567890",
        Peran: "Peserta",
      },
      {
        "Nama Lengkap": "Budi Santoso, S.T.",
        Instansi: "Institut Teknologi Bandung",
        Email: "budi.santoso@itb.ac.id",
        "No. WhatsApp": "081398765432",
        Peran: "Peserta",
      },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, "Template Peserta");
    XLSX.writeFile(wb, "Template_Import_Peserta_VeriCert.xlsx");
  };

  const extractField = (
    row: Record<string, unknown>,
    candidates: string[]
  ): string => {
    const entries = Object.entries(row);
    for (const candidate of candidates) {
      const match = entries.find(([k]) =>
        k.trim().toLowerCase().includes(candidate)
      );
      if (match && match[1] !== undefined && match[1] !== null) {
        return String(match[1]).trim();
      }
    }
    return "";
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setFileSizeKb(Math.max(1, Math.round(file.size / 1024)));

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) {
        onToast("Berkas tidak memiliki sheet data.", "error");
        return;
      }
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        workbook.Sheets[firstSheet],
        { defval: "" }
      );

      const seenInFile = new Set<string>();
      const mapped: ParsedRow[] = [];

      rawRows.forEach((raw, idx) => {
        const namaAsli =
          extractField(raw, ["nama lengkap", "nama_asli", "nama", "name"]) ||
          "";
        const cleanName = namaAsli.trim().replace(/\s+/g, " ");
        if (!cleanName) return;

        const namaKey = normalizeNamaKey(cleanName);
        const isDuplicate =
          existingNamaKeys.has(namaKey) || seenInFile.has(namaKey);
        seenInFile.add(namaKey);

        mapped.push({
          rowNum: idx + 1,
          nama_asli: cleanName,
          nama_key: namaKey,
          instansi: extractField(raw, [
            "instansi",
            "afiliasi",
            "universitas",
            "asal",
            "institution",
          ]),
          email: extractField(raw, ["email", "surel", "e-mail"]),
          phone: extractField(raw, [
            "whatsapp",
            "wa",
            "phone",
            "telepon",
            "hp",
            "no.",
          ]),
          role: extractField(raw, ["peran", "role", "kategori"]) || "Peserta",
          isDuplicate,
        });
      });

      setParsedRows(mapped);
      if (mapped.length === 0) {
        onToast(
          'Tidak ditemukan kolom "Nama Lengkap" atau baris peserta valid.',
          "error"
        );
      }
    } catch {
      onToast("Gagal membaca berkas Excel/CSV.", "error");
    }
  };

  const stats = useMemo(() => {
    const ready = parsedRows.filter((r) => !r.isDuplicate);
    const dup = parsedRows.filter((r) => r.isDuplicate);
    return { ready, dupCount: dup.length };
  }, [parsedRows]);

  const handleImportSubmit = async () => {
    if (stats.ready.length === 0) {
      onToast("Tidak ada data baru untuk diimpor.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/participants/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: stats.ready.map((r) => ({
            nama_asli: r.nama_asli,
            instansi: r.instansi,
            email: r.email,
            phone: r.phone,
            role: r.role,
          })),
          skipDuplicates,
        }),
      });
      const data = (await res.json()) as {
        inserted?: number;
        skipped?: number;
        error?: string;
      };
      if (!res.ok) {
        onToast(data.error || "Gagal mengimpor peserta.", "error");
        return;
      }
      onImported(data.inserted ?? stats.ready.length);
    } catch {
      onToast("Terjadi kesalahan jaringan saat impor.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-[820px] bg-white rounded-2xl border border-[#E2E8F0] shadow-xl flex flex-col overflow-hidden my-auto max-h-[92vh]">
        <div className="px-5 sm:px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#0F172A]">
                Import Data Peserta (Excel / CSV)
              </h2>
              <p className="text-[12px] text-[#64748B]">
                Deteksi duplikat otomatis & normalisasi nama sertifikat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F8FBFF] hover:text-[#0F172A]"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />

          {/* Dropzone / Upload Box */}
          <div className="bg-[#F8FBFF] rounded-xl p-4 sm:p-5 border-2 border-dashed border-[#BAE6FD] flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0284C7] shrink-0">
                  <UploadCloud className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  {fileName ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-[#0F172A] truncate">
                          {fileName}
                        </span>
                        <span className="font-mono text-[11px] bg-[#E0F2FE] text-[#0284C7] px-2 py-0.5 rounded-full shrink-0">
                          {fileSizeKb} KB
                        </span>
                      </div>
                      <p className="text-[12px] text-[#64748B]">
                        {parsedRows.length} baris valid terdeteksi
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[14px] font-semibold text-[#0F172A]">
                        Pilih berkas Excel (.xlsx/.xls) atau CSV
                      </p>
                      <p className="text-[12px] text-[#64748B]">
                        Kolom yang dikenali: Nama Lengkap, Instansi, Email, No. WhatsApp, Peran
                      </p>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-4 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0284C7] font-semibold text-[13px] shrink-0 cursor-pointer"
              >
                {fileName ? "Ganti File" : "Pilih File"}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]/70">
              <span className="text-[12px] text-[#64748B]">
                Format didukung: .xlsx, .xls, .csv
              </span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-[13px] font-semibold text-[#0284C7] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-4 h-4" strokeWidth={1.5} />
                <span>Unduh Template Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {parsedRows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center gap-1.5 font-mono text-[12px] font-semibold">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.6} />
                  <span>{stats.ready.length} Data Siap Masuk</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-[#F1F5F9] text-[#475569] flex items-center gap-1.5 font-mono text-[12px]">
                  <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{stats.dupCount} Duplikat Dilewati</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-[#F8FBFF] border border-[#E2E8F0] text-[#475569] flex items-center gap-1.5 font-mono text-[12px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" strokeWidth={1.5} />
                  <span>Normalisasi Spasi & Key Aktif</span>
                </div>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#F8FBFF] border-b border-[#E2E8F0]">
                      <tr className="text-[11px] uppercase tracking-wider text-[#64748B]">
                        <th className="py-2.5 px-3">Baris</th>
                        <th className="py-2.5 px-3">Nama Asli (Cetak)</th>
                        <th className="py-2.5 px-3">Nama Key</th>
                        <th className="py-2.5 px-3">Instansi</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                      {parsedRows.slice(0, 50).map((r) => (
                        <tr key={r.rowNum} className="bg-white">
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#64748B]">
                            {String(r.rowNum).padStart(3, "0")}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#0F172A]">
                            {r.nama_asli}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#64748B]">
                            {r.nama_key}
                          </td>
                          <td className="py-2.5 px-3 text-[#475569]">
                            {r.instansi || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {r.isDuplicate ? (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] font-mono text-[11px]">
                                Duplikat — Dilewati
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono text-[11px] font-semibold">
                                Siap Masuk
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#0284C7]"
                />
                <span className="text-[13px] text-[#0F172A]">
                  Lewati peserta yang sudah ada tanpa menimpa status kehadiran
                </span>
              </label>
            </>
          )}
        </div>

        <div className="px-5 sm:px-6 py-4 bg-[#F8FBFF] border-t border-[#E2E8F0] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] text-[13px] font-medium hover:bg-[#F1F5F9]"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={submitting || stats.ready.length === 0}
            onClick={handleImportSubmit}
            className="h-10 px-5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white text-[13px] font-semibold flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengimpor...</span>
              </>
            ) : (
              <span>Import {stats.ready.length} Peserta ke Database</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
