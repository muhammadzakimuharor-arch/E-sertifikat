import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VeriCert — Platform E-Sertifikat & Verifikasi QR Terpercaya",
  description:
    "Platform manajemen absensi webinar multi-acara, penerbitan e-sertifikat otomatis, dan verifikasi keaslian dokumen berbasis QR Code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light">
      <body
        className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} bg-[#F8FBFF] text-[#0F172A] font-sans antialiased min-h-screen selection:bg-[#BAE6FD] selection:text-[#0F172A]`}
      >
        {children}
      </body>
    </html>
  );
}
