import { revalidatePath, revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  SETTINGS: "site-settings",
  EVENTS: "events",
  PUBLIC_HOME: "public-home",
  ADMIN_DASHBOARD: "admin-dashboard",
  LOGS: "verification-logs",
} as const;

export function revalidateAppCaches(tags: string[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch {
      // Safe no-op when invoked outside a Next.js request context (e.g. CLI scripts).
    }
  }
}

export function revalidateEventRelatedCaches(slug?: string): void {
  revalidateAppCaches([
    CACHE_TAGS.EVENTS,
    CACHE_TAGS.PUBLIC_HOME,
    CACHE_TAGS.ADMIN_DASHBOARD,
  ]);
  try {
    revalidatePath("/");
    revalidatePath("/webinar");
    revalidatePath("/admin");
    revalidatePath("/admin/events");
    if (slug) {
      revalidatePath(`/event/${slug}/absen`);
      revalidatePath(`/event/${slug}/cari`);
    }
  } catch {
    // Safe no-op outside Next.js request lifecycle.
  }
}
