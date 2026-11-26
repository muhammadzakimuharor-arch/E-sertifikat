"use client";

import {
  Activity,
  BadgeCheck,
  Database,
  Download,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { ToastBanner, type ToastState } from "@/components/Toast";
import type { SiteSettings } from "@/lib/types";

interface SettingsClientProps {
  initialSettings: SiteSettings;
  dbMode: "turso" | "local";
  stats: {
    eventsCount: number;
    issuedCertsCount: number;
    logsCount: number;
  };
}

export function SettingsClient({
  initialSettings,
  dbMode,
  stats,
}: SettingsClientProps) {
  const [orgName, setOrgName] = useState(initialSettings.org_name);
  const [defaultOrganizer, setDefaultOrganizer] = useState(
    initialSettings.default_organizer
  );
  const [contactEmail, setContactEmail] = useState(
    initialSettings.contact_email
  );
  const [logoUrl, setLogoUrl] = useState(initialSettings.logo_url);
  const [footerText, setFooterText] = useState(
    initialSettings.verification_footer
  );
  const [savingSite, setSavingSite] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [pinging, setPinging] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSite(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "site",
          org_name: orgName,
          default_organizer: defaultOrganizer,
          contact_email: contactEmail,
          logo_url: logoUrl,
          verification_footer: footerText,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Identitas instansi & pengaturan portal berhasil disimpan.");
    } catch {
      showToast("Gagal menyimpan pengaturan.", "error");
    } finally {
      setSavingSite(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast("Kata sandi baru minimal 6 karakter.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Konfirmasi kata sandi baru tidak cocok.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password",
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(data.error || "Gagal memperbarui kata sandi.", "error");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Kata sandi admin berhasil diperbarui.");
    } catch {
      showToast("Gagal terhubung ke server.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePingDb = async () => {
    setPinging(true);
    try {
      const res = await fetch("/api/admin/settings/ping", { method: "POST" });
      const data = (await res.json()) as {
        latencyMs?: number;
        dbMode?: string;
        error?: string;
      };
      if (!res.ok) {
        showToast(data.error || "Koneksi database gagal.", "error");
        return;
      }
      setLatencyMs(data.latencyMs ?? 1);
      showToast(
        `Koneksi ${
          data.dbMode === "turso" ? "Turso Edge" : "Local SQLite"
        } berhasil (${data.latencyMs} ms).`
      );
    } catch {
      showToast("Gagal menguji koneksi database.", "error");
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-[#0284C7] font-mono text-[11px] uppercase tracking-wider mb-1">
          <span>Modul Pengaturan Sistem</span>
        </div>
        <h1 className="text-[24px] sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
          Pengaturan Sistem & Infrastruktur
        </h1>
        <p className="text-[14px] text-[#64748B] mt-1">
          Konfigurasi identitas penerbit sertifikat, keamanan akun admin, dan status koneksi database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <BadgeCheck className="w-5 h-5" strokeWidth={1.6} />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#0F172A]">
                  Identitas Organisasi & Instansi Penerbit
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  Informasi resmi yang tampil pada portal publik dan halaman verifikasi.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSite} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0F172A]">
                  Nama Organisasi
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0F172A]">
                  Penyelenggara Default Event Baru
                </label>
                <input
                  type="text"
                  value={defaultOrganizer}
                  onChange={(e) => setDefaultOrganizer(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#0F172A]">
                    Email Resmi Kontak
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#0F172A]">
                    URL Logo Instansi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-10 px-3 rounded-lg border border-[#E2E8F0] font-mono text-[12px] focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0F172A]">
                  Teks Catatan Kaki Verifikasi
                </label>
                <textarea
                  rows={2}
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="p-3 rounded-lg border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSite}
                  className="h-10 px-5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[13px] font-semibold flex items-center gap-2 cursor-pointer"
                >
                  {savingSite ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Simpan Perubahan Identitas</span>
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <KeyRound className="w-5 h-5" strokeWidth={1.6} />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#0F172A]">
                  Keamanan Akun & Kata Sandi Admin
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  Perbarui kata sandi panel administrasi secara berkala.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0F172A]">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#0F172A]">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#0F172A]">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="h-10 px-5 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0F172A] text-[13px] font-semibold flex items-center gap-2 cursor-pointer"
                >
                  {savingPassword && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Perbarui Kata Sandi</span>
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0284C7]" strokeWidth={1.6} />
                <h2 className="text-[16px] font-bold text-[#0F172A]">
                  Status Database & Koneksi
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                {latencyMs !== null ? `Online • ${latencyMs}ms` : "Online"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#E2E8F0] flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#64748B]">
                  Mode Koneksi Aktif
                </span>
                <span className="font-mono text-[11px] font-bold text-[#0284C7]">
                  @libsql/client
                </span>
              </div>
              <p className="text-[14px] font-bold text-[#0F172A]">
                {dbMode === "turso"
                  ? "Turso Edge SQLite (Cloud)"
                  : "Local SQLite Dev Mode (file:local.db)"}
              </p>
              <p className="text-[12px] text-[#64748B]">
                {dbMode === "turso"
                  ? "Terhubung ke URL Turso via variabel lingkungan TURSO_DATABASE_URL."
                  : "Berjalan otomatis secara lokal. Isi TURSO_DATABASE_URL di .env untuk migrasi ke Turso Cloud."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0]">
                <span className="font-mono text-[10px] text-[#64748B] block">
                  Webinar
                </span>
                <span className="text-[18px] font-bold text-[#0F172A]">
                  {stats.eventsCount}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0]">
                <span className="font-mono text-[10px] text-[#64748B] block">
                  Sertifikat
                </span>
                <span className="text-[18px] font-bold text-[#0F172A]">
                  {stats.issuedCertsCount}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0]">
                <span className="font-mono text-[10px] text-[#64748B] block">
                  Log Audit
                </span>
                <span className="text-[18px] font-bold text-[#0F172A]">
                  {stats.logsCount}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                disabled={pinging}
                onClick={handlePingDb}
                className="flex-1 h-10 px-3 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0F172A] text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {pinging ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0284C7]" />
                ) : (
                  <Activity className="w-4 h-4 text-[#0284C7]" strokeWidth={1.6} />
                )}
                <span>Uji Koneksi DB</span>
              </button>
              <a
                href="/api/admin/settings?action=backup"
                className="flex-1 h-10 px-3 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] hover:bg-[#BAE6FD] text-[#0284C7] text-[13px] font-semibold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" strokeWidth={1.6} />
                <span>Cadangkan (.json)</span>
              </a>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0284C7]" strokeWidth={1.6} />
                <h2 className="text-[15px] font-bold text-[#0F172A]">
                  Integritas Kredensial
                </h2>
              </div>
              <span className="font-mono text-[11px] bg-[#E0F2FE] text-[#0284C7] px-2.5 py-0.5 rounded-full font-semibold">
                Tamper-Resistant
              </span>
            </div>
            <p className="text-[12px] text-[#64748B] leading-relaxed">
              Seluruh gambar template sertifikat disimpan sebagai URL ringan (bukan blob base64 di database) agar kapasitas Turso Edge tetap hemat dan responsif.
            </p>
          </section>
        </div>
      </div>

      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
