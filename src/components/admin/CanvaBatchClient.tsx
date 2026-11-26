"use client";

import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Layers,
  Loader2,
  QrCode,
  Sparkles,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import type { EventWithStats } from "@/lib/types";

interface ParsedParticipantRow {
  name: string;
  customCertNumber?: string;
  instansi?: string;
  email?: string;
}

interface GeneratedItem {
  id: string;
  nama: string;
  instansi: string;
  email: string;
  nomor_sertifikat: string;
  uuid_qr: string;
  link_verifikasi: string;
  qr_image_url: string;
}

interface DetectedSheetTopic {
  title: string;
  rows: ParsedParticipantRow[];
}

export function CanvaBatchClient({
  existingEvents = [],
}: {
  existingEvents: EventWithStats[];
}) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [organizer, setOrganizer] = useState("Panitia Penyelenggara");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [certFormat, setCertFormat] = useState("{NO}/SERTIFIKAT/XI/2026");
  const [startNumber, setStartNumber] = useState(1);
  const [numberPadding] = useState(3);

  // Input tabs: 'paste' | 'file'
  const [inputTab, setInputTab] = useState<"paste" | "file">("paste");
  const [pastedText, setPastedText] = useState(
    "Khoridatul Azizah, M.Pd.\tNo. 001/1/PAI/UNITABAH/PAIIAIH/23/11/2026\n" +
      "Umar, M.Pd. I\tNo. 002/1/PAI/UNITABAH/PAIIAIH/23/11/2026\n" +
      "Grenda Marutha Mansur\tNo. 003/1/PAI/UNITABAH/PAIIAIH/23/11/2026\n" +
      "Nafifatul Syauqi\tNo. 004/1/PAI/UNITABAH/PAIIAIH/23/11/2026\n" +
      "Syafiqa Nur Hidayah\tNo. 005/1/PAI/UNITABAH/PAIIAIH/23/11/2026"
  );

  // Excel parsed topics & selected topic
  const [detectedTopics, setDetectedTopics] = useState<DetectedSheetTopic[]>([]);
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);
  const [fileName, setFileName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [generatedData, setGeneratedData] = useState<GeneratedItem[]>([]);
  const [activeTutorialStep, setActiveTutorialStep] = useState(1);

  // Helper to parse pasted lines from Google Sheets (Tabs) or CSV
  const parsedPastedRows = useMemo<ParsedParticipantRow[]>(() => {
    const lines = pastedText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const result: ParsedParticipantRow[] = [];

    for (const line of lines) {
      // If line contains TAB (direct copy from Google Spreadsheet)
      if (line.includes("\t")) {
        const parts = line.split("\t").map((p) => p.trim());
        // Handle case: "1 \t Nama \t Nomor" (3 columns copied)
        if (parts.length >= 3 && !isNaN(Number(parts[0]))) {
          const name = parts[1];
          const certNo = parts[2];
          if (name && name.toLowerCase() !== "nama") {
            result.push({ name, customCertNumber: certNo });
          }
          continue;
        }

        // Handle case: "Nama \t Nomor" (2 columns copied)
        if (parts.length >= 2) {
          const colA = parts[0];
          const colB = parts[1];
          if (colA.toLowerCase() === "nama" || colB.toLowerCase() === "nomor") {
            continue; // Skip header row
          }
          // Detect which is cert number and which is name
          if (
            colB.toLowerCase().includes("no.") ||
            colB.includes("/") ||
            !isNaN(Number(colB))
          ) {
            result.push({ name: colA, customCertNumber: colB });
          } else if (
            colA.toLowerCase().includes("no.") ||
            colA.includes("/") ||
            !isNaN(Number(colA))
          ) {
            result.push({ name: colB, customCertNumber: colA });
          } else {
            result.push({ name: colA, customCertNumber: colB });
          }
          continue;
        }

        // Fallback 1 column
        if (parts[0] && parts[0].toLowerCase() !== "nama") {
          result.push({ name: parts[0] });
        }
        continue;
      }

      // If semicolon or pipe separated: "Nama; Nomor"
      if (line.includes(";") || line.includes("|")) {
        const parts = line.split(/[;|]/).map((p) => p.trim());
        if (parts.length >= 2) {
          result.push({ name: parts[0], customCertNumber: parts[1] });
          continue;
        }
      }

      // Single name per line
      if (line.toLowerCase() !== "nama" && line.toLowerCase() !== "nomor") {
        result.push({ name: line });
      }
    }

    return result;
  }, [pastedText]);

  // File parsing (Excel/Spreadsheet multi-column support like in screenshot)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrorMsg("");
    setDetectedTopics([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Read as 2D array of cells so we can detect multi-topic tables (e.g., Topic 1 in C-D, Topic 2 in E-F)
        const grid = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
        if (grid.length < 2) {
          setErrorMsg("File tidak memiliki baris data yang cukup.");
          return;
        }

        // Find rows that have "nama"
        let headerRowIdx = -1;
        for (let r = 0; r < Math.min(10, grid.length); r++) {
          const row = (grid[r] || []).map((c) => String(c || "").toLowerCase().trim());
          if (row.includes("nama") || row.includes("nama lengkap")) {
            headerRowIdx = r;
            break;
          }
        }

        if (headerRowIdx === -1) {
          // Standard single-table fallback
          const standardRows: ParsedParticipantRow[] = [];
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
          for (const item of json) {
            const rawName =
              item["Nama"] ||
              item["nama"] ||
              item["Nama Lengkap"] ||
              item["Name"] ||
              Object.values(item)[0];
            const rawNo =
              item["Nomor"] ||
              item["nomor"] ||
              item["No Sertifikat"] ||
              item["No."] ||
              item["Nomor Sertifikat"];

            if (rawName && String(rawName).trim()) {
              standardRows.push({
                name: String(rawName).trim(),
                customCertNumber: rawNo ? String(rawNo).trim() : undefined,
                instansi: String(item["Instansi"] || item["instansi"] || ""),
              });
            }
          }

          if (standardRows.length === 0) {
            setErrorMsg("Tidak ditemukan kolom Nama di file Excel.");
          } else {
            setDetectedTopics([
              { title: "Data Peserta", rows: standardRows },
            ]);
            setSelectedTopicIdx(0);
            setSuccessMsg(`Berhasil membaca ${standardRows.length} peserta.`);
          }
          return;
        }

        // We found header row! Detect all pairs of (nama, nomor) columns
        const headerRow = grid[headerRowIdx] || [];
        const prevRow = headerRowIdx > 0 ? grid[headerRowIdx - 1] || [] : [];
        const topics: DetectedSheetTopic[] = [];

        for (let col = 0; col < headerRow.length; col++) {
          const cell = String(headerRow[col] || "").toLowerCase().trim();
          if (cell === "nama" || cell === "nama lengkap") {
            const nameCol = col;
            // The next column or adjacent column is typically nomor
            let noCol = col + 1;
            const nextCell = String(headerRow[noCol] || "").toLowerCase().trim();
            if (!nextCell.includes("nomor") && !nextCell.includes("no")) {
              noCol = -1; // No nomor column adjacent
            }

            // Find topic title from row above if available
            const topicTitle =
              String(prevRow[col] || prevRow[col - 1] || "").trim() ||
              `Sesi Webinar (Kolom ${col + 1})`;

            const topicRows: ParsedParticipantRow[] = [];
            for (let r = headerRowIdx + 1; r < grid.length; r++) {
              const row = grid[r] || [];
              const rawName = String(row[nameCol] || "").trim();
              const rawNo = noCol !== -1 ? String(row[noCol] || "").trim() : "";

              if (rawName && rawName.toLowerCase() !== "nama") {
                topicRows.push({
                  name: rawName,
                  customCertNumber: rawNo || undefined,
                });
              }
            }

            if (topicRows.length > 0) {
              topics.push({
                title: topicTitle,
                rows: topicRows,
              });
            }
          }
        }

        if (topics.length === 0) {
          setErrorMsg("Gagal menemukan pasangan kolom Nama & Nomor di tabel.");
        } else {
          setDetectedTopics(topics);
          setSelectedTopicIdx(0);
          if (topics[0]?.title && mode === "new" && !eventTitle) {
            setEventTitle(topics[0].title);
          }
          setSuccessMsg(
            `Ditemukan ${topics.length} sesi/topik dengan total peserta terbaca!`
          );
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Gagal membaca file spreadsheet. Pastikan format valid.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const currentRowsToProcess = useMemo<ParsedParticipantRow[]>(() => {
    if (inputTab === "paste") {
      return parsedPastedRows;
    }
    return detectedTopics[selectedTopicIdx]?.rows || [];
  }, [inputTab, parsedPastedRows, detectedTopics, selectedTopicIdx]);

  const handleGenerate = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (currentRowsToProcess.length === 0) {
      setErrorMsg("Tidak ada data peserta untuk diproses.");
      return;
    }

    if (mode === "new" && !eventTitle.trim()) {
      setErrorMsg("Mohon isi Nama/Judul Acara terlebih dahulu.");
      return;
    }

    if (mode === "existing" && !selectedEventId) {
      setErrorMsg("Silakan pilih acara yang sudah ada.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/canva/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: mode === "existing" ? selectedEventId : undefined,
          eventTitle: mode === "new" ? eventTitle : undefined,
          organizer: mode === "new" ? organizer : undefined,
          eventDate: mode === "new" ? eventDate : undefined,
          certNumberFormat: certFormat,
          startNumber: Number(startNumber) || 1,
          numberPadding: Number(numberPadding) || 3,
          participants: currentRowsToProcess,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat data sertifikat.");
      }

      setGeneratedData(data.participants || []);
      setSuccessMsg(
        `Sukses! ${data.count} sertifikat telah dikunci ke database dan siap diexport untuk Canva!`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan koneksi."
      );
    } finally {
      setLoading(false);
    }
  };

  // Download Excel (.xlsx)
  const handleDownloadXlsx = () => {
    if (generatedData.length === 0) return;

    const rows = generatedData.map((item, idx) => ({
      No: idx + 1,
      Nama_Lengkap: item.nama,
      Nomor_Sertifikat: item.nomor_sertifikat,
      Link_Verifikasi: item.link_verifikasi,
      QR_Code_Image_URL: item.qr_image_url,
      Kode_Keamanan_UUID: item.uuid_qr,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Canva");
    XLSX.writeFile(
      wb,
      `Canva_Batch_${(eventTitle || "Sertifikat").replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`
    );
  };

  // Download CSV (.csv) - Canva Bulk Create standard
  const handleDownloadCsv = () => {
    if (generatedData.length === 0) return;

    const rows = generatedData.map((item) => ({
      Nama_Lengkap: item.nama,
      Nomor_Sertifikat: item.nomor_sertifikat,
      Link_Verifikasi: item.link_verifikasi,
      QR_Code_Image_URL: item.qr_image_url,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Canva_Bulk_${(eventTitle || "Sertifikat").replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Berhasil disalin ke clipboard!");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#075985] text-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Sistem Otomasi Sertifikat Canva & QR
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sinkronisasi Spreadsheet ➔ Link QR ➔ Canva
            </h1>
            <p className="text-sm sm:text-base text-sky-100 leading-relaxed">
              Upload data <strong>Nama & Nomor Sertifikat</strong> langsung dari
              Google Spreadsheet / Excel. Sistem otomatis membuatkan link
              verifikasi anti-pemalsuan dan menyiapkan file CSV siap pakai di{" "}
              <strong>Canva Bulk Create</strong>!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#panduan"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition"
            >
              <HelpCircle className="w-4 h-4" />
              Panduan Canva
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Input (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              1. Informasi Acara
            </h2>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  mode === "new"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                + Buat Acara Baru
              </button>
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  mode === "existing"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Gunakan Acara Tersimpan
              </button>
            </div>

            {mode === "new" ? (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Acara / Topik Webinar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Transformasi Pembelajaran PAI di Era Kecerdasan Artifisial"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Penyelenggara
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Panitia Pelaksana PAI"
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                  💡 <strong>Catatan:</strong> Jika data spreadsheet kamu sudah
                  memiliki kolom <strong>Nomor Sertifikat</strong> (seperti di
                  tabelmu), nomor tersebut akan otomatis dipakai. Format default
                  di bawah hanya digunakan jika ada nama yang belum punya nomor.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Format Cadangan (Jika nomor kosong)
                    </label>
                    <input
                      type="text"
                      placeholder="{NO}/PAI/XI/2026"
                      value={certFormat}
                      onChange={(e) => setCertFormat(e.target.value)}
                      className="w-full text-sm font-mono rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Awal
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={startNumber}
                      onChange={(e) => setStartNumber(Number(e.target.value) || 1)}
                      className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Acara yang Tersedia
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      const found = existingEvents.find(
                        (ev) => ev.id === e.target.value
                      );
                      if (found) {
                        setEventTitle(found.title);
                        setCertFormat(found.cert_number_format);
                        setStartNumber(found.last_number + 1);
                      }
                    }}
                    className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="">-- Pilih Acara --</option>
                    {existingEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} (Terakhir No. #{ev.last_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Input Data Peserta */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-600" />
                2. Input Data Nama & Nomor Sertifikat
              </h2>

              <div className="flex items-center gap-2 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setInputTab("paste")}
                  className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition ${
                    inputTab === "paste"
                      ? "border-sky-600 text-sky-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📋 Copy-Paste dari Google Sheets (Paling Cepat)
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab("file")}
                  className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition ${
                    inputTab === "file"
                      ? "border-sky-600 text-sky-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📁 Upload File Excel (.xlsx / .csv)
                </button>
              </div>

              {inputTab === "paste" ? (
                <div className="space-y-3">
                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900 leading-relaxed">
                    🎯 <strong>Trik Simpel:</strong> Di Google Sheets kamu,
                    cukup blok 2 kolom (Kolom <strong>nama</strong> dan Kolom{" "}
                    <strong>nomor</strong>) dari baris pertama sampai bawah ➔
                    tekan <code>Ctrl+C</code> ➔ lalu langsung <code>Ctrl+V</code>{" "}
                    di kotak bawah ini!
                  </div>

                  <textarea
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Contoh hasil paste dari spreadsheet:&#10;Khoridatul Azizah, M.Pd.	No. 001/1/PAI/UNITABAH/PAIIAIH/23/11/2026&#10;Umar, M.Pd. I	No. 002/1/PAI/UNITABAH/PAIIAIH/23/11/2026"
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 p-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed"
                  />

                  {/* Realtime Live Parse Preview */}
                  {parsedPastedRows.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Terdeteksi {parsedPastedRows.length} Peserta Sesuai Urutan
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          Nomor Sertifikat Asli Terbaca
                        </span>
                      </div>

                      {/* Mini Table Preview */}
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="py-1 px-2.5 w-10">No</th>
                              <th className="py-1 px-2.5">Nama Peserta</th>
                              <th className="py-1 px-2.5 font-mono">
                                Nomor Sertifikat (Dari Tabel)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {parsedPastedRows.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                <td className="py-1 px-2.5 text-slate-400">
                                  {i + 1}
                                </td>
                                <td className="py-1 px-2.5 font-semibold text-slate-900">
                                  {row.name}
                                </td>
                                <td className="py-1 px-2.5 font-mono text-sky-700">
                                  {row.customCertNumber || "(Dibuat Otomatis)"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {parsedPastedRows.length > 5 && (
                        <p className="text-[11px] text-slate-500 text-center">
                          + {parsedPastedRows.length - 5} peserta lainnya dalam urutan yang tepat
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl p-6 text-center transition bg-slate-50/50">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">
                      Upload file Spreadsheet kamu (<strong>.xlsx</strong> atau{" "}
                      <strong>.csv</strong>)
                    </p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Sistem bisa mengenali jika di dalam 1 file ada beberapa topik webinar sekaligus.
                    </p>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition">
                      Pilih Dokumen
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>

                  {detectedTopics.length > 1 && (
                    <div className="space-y-2 p-4 bg-sky-50 border border-sky-200 rounded-xl">
                      <label className="block text-xs font-bold text-sky-950">
                        File memiliki beberapa sesi webinar! Pilih sesi yang ingin diproses:
                      </label>
                      <div className="space-y-2">
                        {detectedTopics.map((top, idx) => (
                          <label
                            key={idx}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              selectedTopicIdx === idx
                                ? "bg-white border-sky-600 text-sky-900 font-bold shadow-xs"
                                : "bg-sky-100/50 border-sky-200 text-slate-700 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="topic_selector"
                                checked={selectedTopicIdx === idx}
                                onChange={() => {
                                  setSelectedTopicIdx(idx);
                                  if (mode === "new" && top.title) {
                                    setEventTitle(top.title);
                                  }
                                }}
                              />
                              <span>{top.title}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[11px]">
                              {top.rows.length} Peserta
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {fileName && detectedTopics.length > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                      <span>
                        Sesi terpilih: <strong>{detectedTopics[selectedTopicIdx]?.title}</strong> (
                        {currentRowsToProcess.length} peserta)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  {successMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || currentRowsToProcess.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sedang Memproses Link Verifikasi Sesuai Urutan...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    ⚡ Buat Link QR & Kunci {currentRowsToProcess.length} Peserta ke Sistem
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Download Actions & Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Box when Data is Ready */}
          {generatedData.length > 0 ? (
            <div className="bg-white rounded-2xl border-2 border-emerald-500/80 p-6 shadow-md space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {generatedData.length} Data Siap Digenerate di Canva!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Urutan 1 s/d {generatedData.length} sesuai tabel aslimu
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                Tiap peserta sudah dibuatkan <strong>Link QR Kriptografi Unik</strong>.
                Ketika QR Code di Canva di-scan, web langsung menampilkan
                verifikasi hijau resmi atas nama dan nomor sertifikat tersebut!
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  📥 Download File CSV untuk Canva (.csv)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadXlsx}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Download Format Excel (.xlsx)
                </button>
              </div>

              {/* Sample Preview */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Contoh Hasil (3 Teratas Sesuai Urutan):
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Klik link untuk tes verifikasi
                  </span>
                </div>

                <div className="space-y-2.5">
                  {generatedData.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {idx + 1}. {item.nama}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-sky-800 font-semibold">
                        {item.nomor_sertifikat}
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <a
                          href={item.link_verifikasi}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                        >
                          Tes Link Verifikasi
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.link_verifikasi)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 ml-auto"
                        >
                          <Copy className="w-3 h-3" /> Salin Link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base">
                  File Siap Download Setelah Generate
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Setelah kamu klik tombol generate di sebelah kiri, file CSV
                  dengan kolom <strong>Nama_Lengkap</strong>,{" "}
                  <strong>Nomor_Sertifikat</strong>, dan{" "}
                  <strong>Link_Verifikasi</strong> akan muncul di sini.
                </p>
              </div>
            </div>
          )}

          {/* Tutorial Step-by-step Card */}
          <div
            id="panduan"
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Cara Pakai di Canva Bulk Create
              </h3>
              <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                Langkah {activeTutorialStep}/4
              </span>
            </div>

            {/* Steps indicator */}
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setActiveTutorialStep(step)}
                  className={`h-1.5 rounded-full transition ${
                    activeTutorialStep >= step
                      ? "bg-sky-600"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            {/* Step content */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-2 min-h-[140px]">
              {activeTutorialStep === 1 && (
                <>
                  <p className="font-bold text-slate-900 text-sm">
                    Langkah 1: Buka Desain Sertifikat di Canva
                  </p>
                  <p className="leading-relaxed text-slate-600">
                    Buka Canva, siapkan desain sertifikatmu. Sediakan teks kosong
                    untuk <strong>Nama</strong>, <strong>Nomor</strong>, dan satu
                    elemen <strong>QR Code</strong> (dari menu Apps ➔ QR Code).
                  </p>
                </>
              )}

              {activeTutorialStep === 2 && (
                <>
                  <p className="font-bold text-slate-900 text-sm">
                    Langkah 2: Buka &quot;Bulk Create&quot; & Upload CSV
                  </p>
                  <p className="leading-relaxed text-slate-600">
                    Di panel menu sebelah kiri Canva, klik menu{" "}
                    <strong>Apps (Aplikasi)</strong> ➔ cari{" "}
                    <strong>Bulk Create</strong> ➔ klik tombol{" "}
                    <strong>Upload CSV</strong> dan pilih file yang di-download
                    dari web ini.
                  </p>
                </>
              )}

              {activeTutorialStep === 3 && (
                <>
                  <p className="font-bold text-slate-900 text-sm">
                    Langkah 3: Sambungkan Data (Connect Data)
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li>
                      Klik kanan teks Nama ➔ <strong>Hubungkan data</strong> ➔
                      pilih <code>Nama_Lengkap</code>
                    </li>
                    <li>
                      Klik kanan teks Nomor ➔ <strong>Hubungkan data</strong> ➔
                      pilih <code>Nomor_Sertifikat</code>
                    </li>
                    <li>
                      Klik kanan elemen QR Code ➔ <strong>Hubungkan data</strong>{" "}
                      ➔ pilih <code>Link_Verifikasi</code>
                    </li>
                  </ul>
                </>
              )}

              {activeTutorialStep === 4 && (
                <>
                  <p className="font-bold text-slate-900 text-sm">
                    Langkah 4: Klik Generate Pages & Download PDF
                  </p>
                  <p className="leading-relaxed text-slate-600">
                    Klik tombol <strong>Lanjutkan (Continue)</strong> ➔ klik{" "}
                    <strong>Generate Pages</strong>. Seluruh sertifikat langsung
                    jadi dengan nama, nomor, dan QR code yang sesuai urutan!
                  </p>
                </>
              )}
            </div>

            {/* Prev/Next buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() =>
                  setActiveTutorialStep((prev) => Math.max(1, prev - 1))
                }
                disabled={activeTutorialStep === 1}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
              >
                ← Sebelumnya
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveTutorialStep((prev) => Math.min(4, prev + 1))
                }
                disabled={activeTutorialStep === 4}
                className="text-xs font-semibold text-sky-600 hover:text-sky-800 disabled:opacity-30 cursor-pointer flex items-center gap-1"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
