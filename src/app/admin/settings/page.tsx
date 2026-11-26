import { AdminShell } from "@/components/AdminShell";
import { SettingsClient } from "@/components/admin/SettingsClient";
import { getAdminSession } from "@/lib/auth";
import { ensureDbInitialized, getDbMode } from "@/lib/db";
import { getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const db = await ensureDbInitialized();
  const [session, settings, countsRes] = await Promise.all([
    getAdminSession(),
    getSiteSettings(),
    db.execute(`
      SELECT
        (SELECT COUNT(*) FROM events) AS events_count,
        (SELECT COUNT(*) FROM participants WHERE is_attended = 1) AS issued_certs_count,
        (SELECT COUNT(*) FROM verification_logs) AS logs_count
    `),
  ]);

  const row = countsRes.rows[0];

  return (
    <AdminShell
      adminName={session?.name || "Admin Utama"}
      adminEmail={session?.email || "admin@vericert.id"}
      dbMode={getDbMode()}
      breadcrumb="Pengaturan Sistem"
    >
      <SettingsClient
        initialSettings={settings}
        dbMode={getDbMode()}
        stats={{
          eventsCount: Number(row?.events_count ?? 0),
          issuedCertsCount: Number(row?.issued_certs_count ?? 0),
          logsCount: Number(row?.logs_count ?? 0),
        }}
      />
    </AdminShell>
  );
}
