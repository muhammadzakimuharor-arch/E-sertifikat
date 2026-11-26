import { after } from "next/server";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { VerifyInvalidView } from "@/components/public/VerifyInvalidView";
import { VerifyValidClient } from "@/components/public/VerifyValidClient";
import { CACHE_TAGS, revalidateAppCaches } from "@/lib/cache";
import {
  getParticipantByUuid,
  getSiteSettings,
  recordVerificationLog,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function VerifyUuidPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const [record, settings] = await Promise.all([
    getParticipantByUuid(uuid),
    getSiteSettings(),
  ]);

  after(async () => {
    try {
      await recordVerificationLog({
        queriedCode: uuid,
        method: "qr",
        status: record ? "valid" : "invalid",
        participantId: record?.participant.id,
        participantName: record?.participant.nama_asli,
        eventTitle: record?.event.title,
        certNumber: record?.participant.nomor_sertifikat,
      });
      revalidateAppCaches([
        CACHE_TAGS.PUBLIC_HOME,
        CACHE_TAGS.LOGS,
        CACHE_TAGS.ADMIN_DASHBOARD,
      ]);
    } catch (err) {
      console.error("Async verify log error:", err);
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
      <PublicNavbar orgName={settings.org_name} />
      <main className="flex-1 w-full">
        {record ? (
          <VerifyValidClient
            event={record.event}
            participant={record.participant}
          />
        ) : (
          <VerifyInvalidView queriedCode={uuid} />
        )}
      </main>
      <PublicFooter footerText={settings.verification_footer} />
    </div>
  );
}
