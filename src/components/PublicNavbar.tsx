"use client";

import { Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface PublicNavbarProps {
  orgName?: string;
}

export function PublicNavbar({ orgName }: PublicNavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Beranda", match: (p: string) => p === "/" },
    {
      href: "/cek",
      label: "Cek Keaslian Sertifikat",
      match: (p: string) => p.startsWith("/cek") || p.startsWith("/verify"),
    },
    {
      href: "/webinar",
      label: "Daftar Webinar",
      match: (p: string) => p.startsWith("/webinar") || p.startsWith("/event"),
    },
  ];

  return (
    <header className="no-print sticky top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="h-[72px] max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-9 h-9 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] group-hover:bg-[#BAE6FD] transition-colors">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-bold tracking-tight text-[#0F172A] leading-none">
                VeriCert
              </span>
              {orgName && (
                <span className="hidden sm:block text-[11px] text-[#64748B] truncate max-w-[200px] mt-0.5">
                  {orgName}
                </span>
              )}
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 h-[72px]">
            {navLinks.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`h-full flex items-center text-[13px] transition-colors border-b-2 ${
                    active
                      ? "text-[#0284C7] font-semibold border-[#0284C7]"
                      : "text-[#64748B] hover:text-[#0F172A] font-medium border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          aria-label="Toggle Menu Navigasi"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FBFF] transition-colors"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Mobile Dropdown Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E2E8F0] px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center min-h-[44px] px-3 rounded-lg text-[14px] transition-colors ${
                  active
                    ? "bg-[#E0F2FE] text-[#0284C7] font-semibold"
                    : "text-[#0F172A] hover:bg-[#F8FBFF] font-medium"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
