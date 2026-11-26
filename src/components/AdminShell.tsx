"use client";

import {
  CalendarCheck,
  Database,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  ShieldCheck,
  Verified,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface AdminShellProps {
  children: React.ReactNode;
  adminName?: string;
  adminEmail?: string;
  dbMode?: "turso" | "local";
  breadcrumb?: string;
}

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/events",
    label: "Manajemen Webinar",
    icon: CalendarCheck,
    exact: false,
  },
  {
    href: "/admin/canva",
    label: "Batch Canva & QR",
    icon: QrCode,
    exact: false,
  },
  {
    href: "/admin/logs",
    label: "Log Verifikasi",
    icon: Verified,
    exact: false,
  },
  {
    href: "/admin/settings",
    label: "Pengaturan",
    icon: Settings,
    exact: false,
  },
];

export function AdminShell({
  children,
  adminName = "Admin Utama",
  adminEmail = "admin@vericert.id",
  dbMode = "local",
  breadcrumb = "Konsol Administrasi",
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between select-none bg-white">
      <div className="flex flex-col">
        <div className="h-16 px-4 flex items-center gap-2.5 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0">
            <ShieldCheck className="w-5 h-5" strokeWidth={1.6} />
          </div>
          <span className="text-[16px] font-bold tracking-tight text-[#0F172A]">
            VeriCert
          </span>
          <span className="font-mono text-[11px] font-semibold bg-[#BAE6FD] text-[#075985] px-2 py-0.5 rounded ml-auto">
            ADMIN
          </span>
          <button
            type="button"
            aria-label="Tutup Menu"
            onClick={() => setDrawerOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[#64748B] hover:bg-[#F8FBFF]"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-4 pt-6 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Menu Utama
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-2.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3.5 min-h-[44px] rounded-lg text-[14px] transition-colors ${
                  active
                    ? "bg-[#E0F2FE] text-[#0284C7] font-semibold border border-[#BAE6FD]/60"
                    : "text-[#475569] hover:bg-[#F8FBFF] hover:text-[#0F172A] font-medium"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#E2E8F0] bg-white">
        <div className="mb-3 px-3 py-2 rounded-lg bg-[#F8FBFF] border border-[#E2E8F0] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#0284C7] shrink-0" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#0F172A] truncate">
              {dbMode === "turso" ? "Turso Edge SQLite" : "Local SQLite Dev"}
            </p>
            <p className="font-mono text-[10px] text-[#64748B] truncate">
              {dbMode === "turso" ? "Cloud Synced" : "file:local.db"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-semibold text-xs shrink-0">
            {adminName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold text-[#0F172A] truncate">
              {adminName}
            </span>
            <span className="font-mono text-[11px] text-[#64748B] truncate">
              {adminEmail}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Keluar dari Panel Admin"
            className="p-2 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-[#0F172A]">
      {/* Fixed 260px Left Sidebar on Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] border-r border-[#E2E8F0] z-40 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Slide-over Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#0F172A]/35 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative w-[270px] max-w-[85vw] h-full border-r border-[#E2E8F0] bg-white z-10 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-[260px] min-h-screen flex flex-col">
        <header className="sticky top-0 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] z-30 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Buka Menu Navigasi"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FBFF] shrink-0"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-2 text-[13px] text-[#64748B] min-w-0">
              <Home className="w-4 h-4 shrink-0 hidden sm:block" strokeWidth={1.5} />
              <span className="hidden sm:inline">/</span>
              <span className="text-[#0F172A] font-medium truncate">
                {breadcrumb}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-medium text-[#64748B] hover:text-[#0284C7] transition-colors"
            >
              <span>Portal Publik</span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5FF] border border-[#BAE6FD]">
              <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse" />
              <span className="font-mono text-[11px] font-medium text-[#0284C7]">
                Sistem Aktif
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
