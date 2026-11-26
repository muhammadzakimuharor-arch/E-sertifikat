import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { ManualCheckClient } from "@/components/public/ManualCheckClient";
import { getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ManualCheckPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
      <PublicNavbar orgName={settings.org_name} />
      <main className="flex-1 w-full">
        <ManualCheckClient />
      </main>
      <PublicFooter footerText={settings.verification_footer} />
    </div>
  );
}
