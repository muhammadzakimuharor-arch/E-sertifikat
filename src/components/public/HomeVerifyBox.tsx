"use client";

import { Loader2, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeVerifyBox({
  sampleCode = "002/2/PANITIA/XI/2026",
}: {
  sampleCode?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Masukkan nomor sertifikat atau UUID terlebih dahulu.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/public/verify/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json()) as {
        valid?: boolean;
        uuid_qr?: string;
        code?: string;
      };
      if (data.valid && data.uuid_qr) {
        router.push(`/verify/${data.uuid_qr}`);
      } else {
        router.push(
          `/verify/invalid?code=${encodeURIComponent(data.code || trimmed)}`
        );
      }
    } catch {
      setError("Gagal memverifikasi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mt-8">
      <form
        onSubmit={handleSubmit}
        className="p-2 sm:p-2.5 rounded-xl bg-white border border-[#E2E8F0] shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 focus-within:border-[#0284C7] focus-within:ring-4 focus-within:ring-[#E0F2FE] transition-all"
      >
        <div className="flex items-center gap-2.5 w-full px-3 py-1 flex-1 min-w-0">
          <Search
            className="w-5 h-5 text-[#0284C7] shrink-0"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Masukkan Nomor Sertifikat (Contoh: ${sampleCode})`}
            className="w-full bg-transparent font-mono text-[13px] text-[#0F172A] placeholder:text-[#64748B] placeholder:font-sans focus:outline-none py-2 min-w-0"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto min-h-[44px] px-6 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-70 text-white font-semibold text-[13px] inline-flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
          )}
          <span>Cek Keaslian</span>
        </button>
      </form>

      {error && (
        <p className="text-[12px] text-[#DC2626] mt-2 text-left px-1">
          {error}
        </p>
      )}
    </div>
  );
}
