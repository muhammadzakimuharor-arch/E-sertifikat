import { AdminShell } from "@/components/AdminShell";
import { EventsListClient } from "@/components/admin/EventsListClient";
import { getAdminSession } from "@/lib/auth";
import { getDbMode } from "@/lib/db";
import { getAllEventsWithStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const [session, events] = await Promise.all([
    getAdminSession(),
    getAllEventsWithStats(),
  ]);

  return (
    <AdminShell
      adminName={session?.name || "Admin Utama"}
      adminEmail={session?.email || "admin@vericert.id"}
      dbMode={getDbMode()}
      breadcrumb="Manajemen Webinar"
    >
      <EventsListClient initialEvents={events} />
    </AdminShell>
  );
}
