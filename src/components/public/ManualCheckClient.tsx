"use client";

import {
  AlertCircle,
  ArrowRight,
  Camera,
  Database,
  Info,
  Keyboard,
  Loader2,
  Lock,
  QrCode,
  ShieldCheck,
  Verified,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface BarcodeDetectorResult {
  rawValue: string;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): {
    detect: (
      source: HTMLVideoElement
    ) => Promise<BarcodeDetectorResult[]>;
  };
}

export function ManualCheckClient({
  sampleCode = "002/2/PANITIA/XI/2026",
}: {
  sampleCode?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMsg, setScannerMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!scannerOpen) return;

    let stopped = false;
    let stream: MediaStream | null = null;
    let rafId = 0;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setScannerMsg(
            "Browser tidak mendukung akses kamera. Gunakan kamera bawaan ponsel atau masukkan nomor secara manual."
          );
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const Detector = (
          window as unknown as {
            BarcodeDetector?: BarcodeDetectorConstructor;
          }
        ).BarcodeDetector;

        if (!Detector) {
          setScannerMsg(
            "Kamera aktif, namun deteksi QR otomatis tidak didukung di browser ini. Gunakan kamera ponsel atau input nomor manual."
          );
          return;
        }

        const detector = new Detector({ formats: ["qr_code"] });
        setScannerMsg("Arahkan kamera ke QR Code pada sertifikat...");

        const scanLoop = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              const raw = barcodes[0].rawValue.trim();
              const match = raw.match(/\/verify\/([a-zA-Z0-9-]+)/);
              setScannerOpen(false);
              if (match?.[1]) {
                router.push(`/verify/${match[1]}`);
                return;
              }
              setCode(raw);
              return;
            }
          } catch {
            // Continue frame scanning
          }
          rafId = requestAnimationFrame(scanLoop);
        };
        rafId = requestAnimationFrame(scanLoop);
      } catch {
        setScannerMsg(
          "Izin kamera ditolak atau perangkat kamera tidak tersedia."
        );
      }
    };

    startCamera();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [scannerOpen, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Masukkan nomor sertifikat atau kode UUID terlebih dahulu.");
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
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Gagal memproses verifikasi.");
        return;
      }
      if (data.valid && data.uuid_qr) {
        router.push(`/verify/${data.uuid_qr}`);
      } else {
        router.push(
          `/verify/invalid?code=${encodeURIComponent(data.code || trimmed)}`
        );
      }
    } catch {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full py-10 sm:py-14 px-4 sm:px-6 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(#0284C7 0.75px, transparent 0.75px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-[680px] mx-auto">
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-mono text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse" />
            <span>SISTEM VALIDASI KREDENSIAL RESMI</span>
          </div>
        </div>

        {/* Main Verification Card */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 sm:p-9">
          <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center mx-auto mb-4 text-[#0284C7]">
            <Verified className="w-7 h-7" strokeWidth={1.6} />
          </div>

          <div className="text-center">
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
              Cek Keaslian Sertifikat
            </h1>
            <p className="text-[14px] text-[#64748B] max-w-md mx-auto mt-2 mb-7 leading-relaxed">
              Periksa keabsahan e-sertifikat resmi secara langsung dari basis data ledger terverifikasi VeriCert.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[13px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label
                  htmlFor="reg-number"
                  className="text-[12px] font-bold uppercase tracking-wider text-[#475569]"
                >
                  Nomor Registrasi Sertifikat atau UUID
                </label>
                <span className="font-mono text-[11px] text-[#0284C7] flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Case-Insensitive Lookup
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  id="reg-number"
                  type="text"
                  required
                  spellCheck={false}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={`Contoh: ${sampleCode}`}
                  className="w-full min-h-[48px] bg-[#F8FBFF] border border-[#E2E8F0] focus:border-[#0284C7] focus:bg-white rounded-xl px-4 pr-11 font-mono text-[14px] text-[#0F172A] placeholder:text-[#64748B] placeholder:font-sans focus:outline-none focus:ring-3 focus:ring-[#E0F2FE] transition-all"
                />
                {code && (
                  <button
                    type="button"
                    onClick={() => setCode("")}
                    className="absolute right-3 p-1 text-[#64748B] hover:text-[#0F172A]"
                    aria-label="Bersihkan input"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 text-[12px] text-[#64748B]">
                <Info className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                <span>
                  Contoh format:{" "}
                  <button
                    type="button"
                    onClick={() => setCode(sampleCode)}
                    className="font-mono bg-[#EBF5FF] text-[#0284C7] px-1.5 py-0.5 rounded hover:underline cursor-pointer"
                  >
                    {sampleCode}
                  </button>
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 text-white font-semibold text-[15px] rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <span>Verifikasi Kredensial Sekarang</span>
                  <ArrowRight className="w-5 h-5" strokeWidth={1.75} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0]" />
            </div>
            <span className="relative px-3 bg-white text-[11px] uppercase tracking-widest text-[#64748B]">
              atau
            </span>
          </div>

          <button
            type="button"
            onClick={() => setScannerOpen((p) => !p)}
            className="w-full min-h-[46px] bg-[#F8FBFF] hover:bg-[#EBF5FF] border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-xl px-4 flex items-center justify-center gap-2.5 text-[13px] font-semibold text-[#0F172A] transition-colors cursor-pointer"
          >
            <QrCode className="w-5 h-5 text-[#0284C7]" strokeWidth={1.6} />
            <span>
              {scannerOpen
                ? "Tutup Pemindai Kamera"
                : "Scan QR Code via Kamera Perangkat"}
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7]">
              Kamera
            </span>
          </button>

          {scannerOpen && (
            <div className="mt-4 p-4 rounded-xl bg-[#F8FBFF] border border-[#BAE6FD] flex flex-col items-center gap-3">
              <div className="relative w-full max-w-[280px] aspect-square bg-[#0F172A] rounded-xl overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-4 border-2 border-dashed border-[#7DD3FC] rounded-lg pointer-events-none" />
              </div>
              <p className="text-[12px] text-[#475569] text-center flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#0284C7] shrink-0" />
                <span>{scannerMsg || "Menyiapkan kamera..."}</span>
              </p>
            </div>
          )}
        </section>

        {/* 3-Step Guide */}
        <section className="mt-8">
          <h2 className="text-center text-[12px] font-bold uppercase tracking-wider text-[#475569] mb-4">
            Tiga Tahap Validasi Keamanan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono text-[12px] font-bold flex items-center justify-center">
                    01
                  </span>
                  <Keyboard className="w-4 h-4 text-[#64748B]" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0F172A]">
                  Input Nomor / Scan QR
                </h3>
                <p className="text-[12px] text-[#64748B] mt-1 leading-relaxed">
                  Masukkan nomor sertifikat atau pindai QR pada lembar PDF.
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono text-[12px] font-bold flex items-center justify-center">
                    02
                  </span>
                  <Database className="w-4 h-4 text-[#64748B]" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0F172A]">
                  Pencocokan Ledger
                </h3>
                <p className="text-[12px] text-[#64748B] mt-1 leading-relaxed">
                  Sistem memeriksa kecocokan data pada database resmi penyelenggara.
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono text-[12px] font-bold flex items-center justify-center">
                    03
                  </span>
                  <ShieldCheck className="w-4 h-4 text-[#64748B]" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0F172A]">
                  Hasil Kredensial Sah
                </h3>
                <p className="text-[12px] text-[#64748B] mt-1 leading-relaxed">
                  Detail penerima, acara, dan bukti verifikasi tampil seketika.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
