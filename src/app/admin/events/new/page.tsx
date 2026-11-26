import { AdminShell } from "@/components/AdminShell";
import { CreateEventForm } from "@/components/admin/CreateEventForm";
import { getAdminSession } from "@/lib/auth";
import { getDbMode } from "@/lib/db";
import { getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CreateEventPage() {
  const [session, settings] = await Promise.all([
    getAdminSession(),
    getSiteSettings(),
  ]);

  return (
    <AdminShell
      adminName={session?.name || "Admin Utama"}
      adminEmail={session?.email || "admin@vericert.id"}
      dbMode={getDbMode()}
      breadcrumb="Buat Webinar Baru"
    >
      <CreateEventForm defaultOrganizer={settings.default_organizer} />
    </AdminShell>
  );
}
