import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { VerifyInvalidView } from "@/components/public/VerifyInvalidView";
import { getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function VerifyInvalidPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const [{ code }, settings] = await Promise.all([
    searchParams,
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
      <PublicNavbar orgName={settings.org_name} />
      <main className="flex-1 w-full">
        <VerifyInvalidView queriedCode={code || "TIDAK-DIKETAHUI"} />
      </main>
      <PublicFooter footerText={settings.verification_footer} />
    </div>
  );
}
