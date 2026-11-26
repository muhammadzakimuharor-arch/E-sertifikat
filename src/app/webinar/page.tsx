import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { WebinarDirectoryClient } from "@/components/public/WebinarDirectoryClient";
import { getPublicEventsList, getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function WebinarDirectoryPage() {
  const [events, settings] = await Promise.all([
    getPublicEventsList(),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
      <PublicNavbar orgName={settings.org_name} />
      <main className="flex-1 w-full">
        <WebinarDirectoryClient events={events} />
      </main>
      <PublicFooter footerText={settings.verification_footer} />
    </div>
  );
}
