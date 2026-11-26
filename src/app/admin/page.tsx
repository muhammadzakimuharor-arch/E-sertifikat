import { AdminShell } from "@/components/AdminShell";
import { DashboardClient } from "@/components/admin/DashboardClient";
import { getAdminSession } from "@/lib/auth";
import { getDbMode } from "@/lib/db";
import { getDashboardSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [session, summary] = await Promise.all([
    getAdminSession(),
    getDashboardSummary(),
  ]);

  return (
    <AdminShell
      adminName={session?.name || "Admin Utama"}
      adminEmail={session?.email || "admin@vericert.id"}
      dbMode={getDbMode()}
      breadcrumb="Dashboard Overview"
    >
      <DashboardClient
        metrics={summary.metrics}
        initialEvents={summary.events}
        recentLogs={summary.recentLogs}
        dailyAttendance={summary.dailyAttendance}
      />
    </AdminShell>
  );
}
