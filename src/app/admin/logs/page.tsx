import { AdminShell } from "@/components/AdminShell";
import { LogsClient } from "@/components/admin/LogsClient";
import { getAdminSession } from "@/lib/auth";
import { getDbMode } from "@/lib/db";
import { getRecentVerificationLogs } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const [session, logs] = await Promise.all([
    getAdminSession(),
    getRecentVerificationLogs(200),
  ]);

  return (
    <AdminShell
      adminName={session?.name || "Admin Utama"}
      adminEmail={session?.email || "admin@vericert.id"}
      dbMode={getDbMode()}
      breadcrumb="Log Verifikasi"
    >
      <LogsClient initialLogs={logs} />
    </AdminShell>
  );
}
