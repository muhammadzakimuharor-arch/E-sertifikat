import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { CertificateSuccessClient } from "@/components/public/CertificateSuccessClient";
import { getParticipantByUuid, getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EventCertificatePage({
  params,
}: {
  params: Promise<{ slug: string; uuid: string }>;
}) {
  const { slug, uuid } = await params;
  const [record, settings] = await Promise.all([
    getParticipantByUuid(uuid),
    getSiteSettings(),
  ]);

  const validForSlug = record && record.event.slug === slug ? record : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
      <PublicNavbar orgName={settings.org_name} />
      <main className="flex-1 w-full">
        {!validForSlug ? (
          <div className="max-w-md mx-auto py-20 px-4 text-center">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8">
              <h1 className="text-[20px] font-bold text-[#0F172A]">
                Sertifikat Tidak Ditemukan
              </h1>
              <p className="text-[14px] text-[#64748B] mt-2 mb-5">
                Tautan e-sertifikat tidak valid atau peserta belum melakukan konfirmasi kehadiran.
              </p>
              <Link
                href={`/event/${slug}/cari`}
                className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-[#0284C7] text-white text-[14px] font-semibold"
              >
                Cari Sertifikat Saya
              </Link>
            </div>
          </div>
        ) : (
          <CertificateSuccessClient
            event={validForSlug.event}
            participant={validForSlug.participant}
          />
        )}
      </main>
      <PublicFooter footerText={settings.verification_footer} />
    </div>
  );
}
