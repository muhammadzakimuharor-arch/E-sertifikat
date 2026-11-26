import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { SearchCertificateClient } from "@/components/public/SearchCertificateClient";
import { getEventBySlug, getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EventSearchCertificatesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, settings] = await Promise.all([
    params,
    getSiteSettings(),
  ]);
  const event = await getEventBySlug(slug);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
      <PublicNavbar orgName={settings.org_name} />
      <main className="flex-1 w-full">
        {!event ? (
          <div className="max-w-md mx-auto py-20 px-4 text-center">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8">
              <h1 className="text-[20px] font-bold text-[#0F172A]">
                Webinar Tidak Ditemukan
              </h1>
              <p className="text-[14px] text-[#64748B] mt-2 mb-5">
                Tautan acara yang Anda cari tidak tersedia.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-[#0284C7] text-white text-[14px] font-semibold"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          <SearchCertificateClient event={event} />
        )}
      </main>
      <PublicFooter footerText={settings.verification_footer} />
    </div>
  );
}
