"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@vericert.id");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Gagal masuk ke panel admin.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Koneksi ke server terputus. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBFF] flex items-center justify-center p-4 sm:p-6">
      <main className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.05)] relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#E0F2FE] rounded-full blur-2xl pointer-events-none opacity-70" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#EBF5FF] rounded-full blur-xl pointer-events-none opacity-80" />

        <div className="relative flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] mb-3">
            <ShieldCheck className="w-6 h-6" strokeWidth={1.6} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5FF] border border-[#BAE6FD] text-[#0284C7] font-mono text-[11px] font-semibold mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse" />
            <span>VERICERT KREDENSIAL ID</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
            Masuk ke Panel Admin
          </h1>
          <p className="text-[13px] text-[#64748B] max-w-xs mt-1 mb-6">
            Kelola webinar, absensi peserta, desain e-sertifikat, dan log verifikasi QR.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-start gap-2 text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.6} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="adminEmail"
              className="text-[13px] font-semibold text-[#0F172A] flex items-center justify-between"
            >
              <span>Email Admin</span>
              <span className="font-mono text-[11px] text-[#64748B] font-normal">
                Otoritas Panitia
              </span>
            </label>
            <div className="relative flex items-center">
              <Mail
                className="w-4 h-4 text-[#64748B] absolute left-3.5 pointer-events-none"
                strokeWidth={1.5}
              />
              <input
                id="adminEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vericert.id"
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-white border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="adminPassword"
                className="text-[13px] font-semibold text-[#0F172A]"
              >
                Kata Sandi
              </label>
              <span className="font-mono text-[11px] text-[#64748B] flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#0284C7]" strokeWidth={1.6} />
                JWT + Bcrypt
              </span>
            </div>
            <div className="relative flex items-center">
              <KeyRound
                className="w-4 h-4 text-[#64748B] absolute left-3.5 pointer-events-none"
                strokeWidth={1.5}
              />
              <input
                id="adminPassword"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi admin"
                className="w-full h-11 pl-10 pr-11 rounded-lg bg-white border border-[#E2E8F0] font-mono text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-sans focus:outline-none focus:border-[#0284C7] focus:ring-3 focus:ring-[#E0F2FE] transition-all"
              />
              <button
                type="button"
                aria-label="Tampilkan atau sembunyikan kata sandi"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 p-1.5 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FBFF] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#E2E8F0] accent-[#0284C7] cursor-pointer"
              />
              <span className="text-[12px] text-[#64748B]">
                Ingat sesi di perangkat ini
              </span>
            </label>
          </div>

          <div className="p-3 rounded-lg bg-[#EBF5FF] border border-[#BAE6FD]/60 flex items-start gap-2.5">
            <Info
              className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5"
              strokeWidth={1.6}
            />
            <p className="text-[12px] text-[#075985] leading-relaxed">
              Akun bawaan instalasi awal:{" "}
              <code className="font-mono font-semibold">admin@vericert.id</code>{" "}
              / sandi <code className="font-mono font-semibold">admin123</code>.
              Segera ubah melalui menu Pengaturan setelah masuk.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985] disabled:opacity-70 text-white font-semibold text-[14px] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                <span>Mengautentikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0284C7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            <span>Kembali ke Portal Verifikasi Publik</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
