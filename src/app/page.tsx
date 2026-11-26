import {
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  Fingerprint,
  QrCode,
  ShieldCheck,
  Verified,
} from "lucide-react";
import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { HomeVerifyBox } from "@/components/public/HomeVerifyBox";
import { getPublicHomeData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { metrics, settings } = await getPublicHomeData();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
      <PublicNavbar orgName={settings.org_name} />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative w-full py-14 sm:py-20 bg-gradient-to-b from-white via-[#F8FBFF] to-[#F8FBFF] overflow-hidden border-b border-[#E2E8F0]">
          <div
            className="absolute inset-0 opacity-45 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#0284C7 0.75px, transparent 0.75px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7]">
              <Verified className="w-4 h-4" strokeWidth={1.75} />
              <span className="text-[12px] sm:text-[13px] font-semibold">
                Portal Resmi Sertifikat Digital & Verifikasi Terpercaya
              </span>
            </div>

            <h1 className="text-[30px] sm:text-[40px] leading-[1.2] font-bold text-[#0F172A] max-w-3xl mt-5 tracking-tight">
              Verifikasi Keaslian & Unduh E-Sertifikat Webinar
            </h1>

            <p className="text-[15px] sm:text-[16px] text-[#475569] max-w-2xl mt-4 leading-relaxed">
              Pastikan keaslian dokumen sertifikat resmi secara instan menggunakan nomor registrasi, pindai QR Code lewat Google Lens, atau akses daftar kegiatan webinar.
            </p>

            <HomeVerifyBox />

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-[12px] text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className="w-4 h-4 text-[#0284C7]"
                  strokeWidth={1.75}
                />
                <span className="font-medium text-[#0F172A]">
                  Validasi QR Real-Time
                </span>
              </div>
              <span className="hidden sm:inline text-[#CBD5E1]">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className="w-4 h-4 text-[#0284C7]"
                  strokeWidth={1.75}
                />
                <span className="font-medium text-[#0F172A]">
                  PDF Resolusi Tinggi
                </span>
              </div>
              <span className="hidden sm:inline text-[#CBD5E1]">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className="w-4 h-4 text-[#0284C7]"
                  strokeWidth={1.75}
                />
                <span className="font-medium text-[#0F172A]">
                  Anti-Pemalsuan UUID
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/webinar"
                className="min-h-[44px] px-5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold inline-flex items-center gap-2 transition-colors shadow-xs"
              >
                <CalendarDays className="w-4 h-4" strokeWidth={1.6} />
                <span>Lihat Daftar Webinar ({metrics.totalEvents})</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.6} />
              </Link>
              <Link
                href="/cek"
                className="min-h-[44px] px-5 rounded-xl bg-white border border-[#BAE6FD] hover:bg-[#EBF5FF] text-[#0284C7] text-[13px] font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" strokeWidth={1.6} />
                <span>Buka Validator Lengkap</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Real DB Metric Strip */}
        <section className="w-full bg-white border-b border-[#E2E8F0] py-8">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-2">
              <span className="text-[28px] sm:text-[36px] font-bold text-[#0284C7]">
                {metrics.issuedCerts.toLocaleString("id-ID")}
              </span>
              <span className="text-[12px] text-[#64748B] mt-1">
                Sertifikat Terbit & Sah
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <span className="text-[28px] sm:text-[36px] font-bold text-[#0F172A]">
                {metrics.totalEvents}
              </span>
              <span className="text-[12px] text-[#64748B] mt-1">
                Kegiatan Webinar Resmi
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <span className="text-[28px] sm:text-[36px] font-bold text-[#0F172A]">
                {metrics.totalParticipants.toLocaleString("id-ID")}
              </span>
              <span className="text-[12px] text-[#64748B] mt-1">
                Peserta Terdaftar
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <span className="text-[28px] sm:text-[36px] font-bold text-[#0284C7]">
                {metrics.totalScans.toLocaleString("id-ID")}
              </span>
              <span className="text-[12px] text-[#64748B] mt-1">
                Verifikasi Tercatat
              </span>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full py-12 sm:py-16">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#0284C7] font-semibold">
                Tiga Langkah Mudah
              </span>
              <h2 className="text-[22px] sm:text-[28px] font-bold text-[#0F172A] mt-2">
                Standar Verifikasi Dokumen Kredensial
              </h2>
              <p className="text-[14px] text-[#64748B] mt-2">
                Setiap sertifikat dilengkapi UUID unik dan nomor registrasi sekuensial yang tidak dapat dipalsukan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl flex flex-col items-start">
                <div className="w-11 h-11 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-[11px] text-[#0284C7] font-bold">
                  01 / PINDAI QR
                </span>
                <h3 className="text-[16px] font-bold text-[#0F172A] mt-1">
                  Scan via Google Lens / Kamera
                </h3>
                <p className="text-[13px] text-[#64748B] mt-2 leading-relaxed">
                  Arahkan Google Lens atau kamera ponsel ke QR Code pada sertifikat untuk membuka tautan validasi langsung.
                </p>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl flex flex-col items-start">
                <div className="w-11 h-11 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-4">
                  <Fingerprint className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-[11px] text-[#0284C7] font-bold">
                  02 / PENCOCOKAN LEDGER
                </span>
                <h3 className="text-[16px] font-bold text-[#0F172A] mt-1">
                  Validasi Langsung Database
                </h3>
                <p className="text-[13px] text-[#64748B] mt-2 leading-relaxed">
                  Sistem mencocokkan UUID unik dan nomor registrasi terhadap basis data resmi penyelenggara.
                </p>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl flex flex-col items-start">
                <div className="w-11 h-11 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-4">
                  <Award className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-[11px] text-[#0284C7] font-bold">
                  03 / HASIL SAH
                </span>
                <h3 className="text-[16px] font-bold text-[#0F172A] mt-1">
                  Bukti Verifikasi Terbuka
                </h3>
                <p className="text-[13px] text-[#64748B] mt-2 leading-relaxed">
                  Menampilkan nama penerima, instansi, tanggal acara, serta pratinjau dokumen asli yang siap dicetak.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter footerText={settings.verification_footer} />
    </div>
  );
}
