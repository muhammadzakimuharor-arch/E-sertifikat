import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import {
  EventWorkspaceClient,
  type EventTabKey,
} from "@/components/admin/event-detail/EventWorkspaceClient";
import { getAdminSession } from "@/lib/auth";
import { getDbMode } from "@/lib/db";
import { getEventDetailWithParticipants } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab }, session] = await Promise.all([
    params,
    searchParams,
    getAdminSession(),
  ]);

  const detail = await getEventDetailWithParticipants(id);
  if (!detail) {
    notFound();
  }
  const { event, participants } = detail;
  const validTabs: EventTabKey[] = [
    "overview",
    "participants",
    "design",
    "settings",
  ];
  const initialTab: EventTabKey = validTabs.includes(tab as EventTabKey)
    ? (tab as EventTabKey)
    : "overview";

  return (
    <AdminShell
      adminName={session?.name || "Admin Utama"}
      adminEmail={session?.email || "admin@vericert.id"}
      dbMode={getDbMode()}
      breadcrumb={event.title}
    >
      <EventWorkspaceClient
        initialEvent={event}
        initialParticipants={participants}
        initialTab={initialTab}
      />
    </AdminShell>
  );
}
