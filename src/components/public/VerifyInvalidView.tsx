import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Home,
  Info,
  ShieldAlert,
  SpellCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDateTimeWib } from "@/lib/utils";

export function VerifyInvalidView({ queriedCode }: { queriedCode: string }) {
  const checkedAt = formatDateTimeWib(new Date().toISOString());

  return (
    <div className="max-w-[640px] mx-auto py-8 sm:py-12 px-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
        <div className="inline-flex items-center gap-2 text-[12px] text-[#475569] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
          <span>Portal Verifikasi Publik / Status Kredensial</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        {/* Top 4px Muted Red Bar */}
        <div className="h-1.5 w-full bg-[#DC2626]" />

        {/* Hero Warning Banner */}
        <div className="bg-[#FEF2F2] border-b border-[#FECACA] p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white border border-[#FECACA] flex items-center justify-center mx-auto mb-4 text-[#DC2626] shadow-xs">
            <ShieldAlert className="w-8 h-8" strokeWidth={1.6} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#FECACA] text-[#DC2626] font-mono text-[11px] font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            <span>Status: Data Tidak Ditemukan</span>
          </div>

          <h1 className="text-[22px] sm:text-[28px] font-bold text-[#0F172A] tracking-tight mb-2">
            SERTIFIKAT TIDAK DITEMUKAN
          </h1>
          <p className="text-[14px] text-[#475569] max-w-md mx-auto leading-relaxed">
            Nomor registrasi sertifikat atau kode QR yang dipindai tidak terdaftar di repositori resmi VeriCert atau tautan telah diubah.
          </p>
        </div>

        {/* Checked Query Details */}
        <div className="p-5 sm:p-8 flex flex-col gap-6">
          <div className="bg-[#F8FBFF] border border-[#E2E8F0] rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-[12px] font-semibold text-[#475569]">
                Kode / Nomor yang Diperiksa:
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#DC2626] font-semibold">
                <XCircle className="w-3.5 h-3.5" />
                Unregistered
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-mono text-[14px] font-bold text-[#DC2626] bg-white border border-[#FECACA] px-3 py-1.5 rounded-lg break-all">
                {queriedCode || "KODE-KOSONG"}
              </div>
              <div className="font-mono text-[11px] text-[#64748B]">
                Diperiksa: {checkedAt}
              </div>
            </div>
          </div>

          {/* Diagnosis Checklist */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#475569]">
              <Info className="w-4 h-4 text-[#64748B]" />
              <span>Kemungkinan Penyebab</span>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FBFF] border border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <SpellCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-[#0F172A]">
                  Kesalahan Pengetikan Nomor
                </h2>
                <p className="text-[12px] text-[#64748B] mt-0.5 leading-relaxed">
                  Pastikan tanda garis miring (/), angka urutan, dan kode acara sama persis dengan yang tercetak pada dokumen sertifikat.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FBFF] border border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-[#0F172A]">
                  Sertifikat Belum Diterbitkan
                </h2>
                <p className="text-[12px] text-[#64748B] mt-0.5 leading-relaxed">
                  Peserta mungkin belum mengisi formulir absensi kegiatan atau panitia belum memvalidasi kehadirannya.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
              <div className="w-8 h-8 rounded-full bg-white text-[#DC2626] flex items-center justify-center shrink-0 border border-[#FECACA]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-[#DC2626]">
                  Indikasi Pemalsuan Dokumen
                </h2>
                <p className="text-[12px] text-[#475569] mt-0.5 leading-relaxed">
                  Dokumen dibuat di luar otoritas VeriCert atau QR code telah dimanipulasi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="bg-[#F8FBFF] border-t border-[#E2E8F0] p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href="/cek"
            className="min-h-[44px] px-5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Coba Cek Nomor Lain</span>
          </Link>
          <Link
            href="/"
            className="min-h-[44px] px-5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0F172A] text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4 text-[#64748B]" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
