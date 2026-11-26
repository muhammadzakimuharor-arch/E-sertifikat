import { ShieldCheck } from "lucide-react";
import Link from "next/link";

interface PublicFooterProps {
  footerText?: string;
}

export function PublicFooter({ footerText }: PublicFooterProps) {
  return (
    <footer className="no-print w-full bg-white border-t border-[#E2E8F0] py-7 mt-auto">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-2.5 text-[12px] text-[#64748B]">
          <div className="w-7 h-7 rounded-md bg-[#E0F2FE] flex items-center justify-center text-[#0284C7] shrink-0">
            <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <span>
            © {new Date().getFullYear()} VeriCert Platform.{" "}
            {footerText ||
              "Sistem Penerbitan E-Sertifikat & Verifikasi QR Kriptografis."}
          </span>
        </div>

        <div className="flex items-center gap-5 text-[12px] text-[#64748B]">
          <Link href="/" className="hover:text-[#0284C7] transition-colors">
            Beranda
          </Link>
          <span className="text-[#CBD5E1]">•</span>
          <Link href="/cek" className="hover:text-[#0284C7] transition-colors">
            Cek Keaslian
          </Link>
          <span className="text-[#CBD5E1]">•</span>
          <Link
            href="/webinar"
            className="hover:text-[#0284C7] transition-colors"
          >
            Daftar Webinar
          </Link>
        </div>
      </div>
    </footer>
  );
}
