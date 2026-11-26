import { AdminShell } from "@/components/AdminShell";
import { CanvaBatchClient } from "@/components/admin/CanvaBatchClient";
import { getAdminSession } from "@/lib/auth";
import { getDbMode } from "@/lib/db";
import { getAllEventsWithStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminCanvaBatchPage() {
  const [session, events] = await Promise.all([
    getAdminSession(),
    getAllEventsWithStats(),
  ]);

  return (
    <AdminShell
      adminName={session?.name || "Admin Utama"}
      adminEmail={session?.email || "admin@vericert.id"}
      dbMode={getDbMode()}
      breadcrumb="Batch Canva & Verifikasi QR"
    >
      <CanvaBatchClient existingEvents={events} />
    </AdminShell>
  );
}
