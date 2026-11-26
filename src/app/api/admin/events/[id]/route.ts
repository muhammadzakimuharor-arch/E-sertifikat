import { NextResponse } from "next/server";
import { revalidateEventRelatedCaches } from "@/lib/cache";
import { ensureDbInitialized } from "@/lib/db";
import {
  getEventById,
  getEventDetailWithParticipants,
} from "@/lib/queries";
import { slugify } from "@/lib/utils";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const detail = await getEventDetailWithParticipants(id);
    if (!detail) {
      return NextResponse.json(
        { error: "Webinar tidak ditemukan." },
        { status: 404 }
      );
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error("GET /api/admin/events/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memuat detail webinar." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await ensureDbInitialized();
    const current = await getEventById(id);
    if (!current) {
      return NextResponse.json(
        { error: "Webinar tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updates: string[] = [];
    const args: (string | number)[] = [];

    if (typeof body.title === "string" && body.title.trim()) {
      updates.push("title = ?");
      args.push(body.title.trim());
    }
    if (typeof body.organizer === "string" && body.organizer.trim()) {
      updates.push("organizer = ?");
      args.push(body.organizer.trim());
    }
    if (typeof body.event_date === "string" && body.event_date.trim()) {
      updates.push("event_date = ?");
      args.push(body.event_date.trim());
    }
    if (typeof body.speaker === "string") {
      updates.push("speaker = ?");
      args.push(body.speaker.trim());
    }
    if (typeof body.slug === "string" && body.slug.trim()) {
      const nextSlug = slugify(body.slug);
      if (!nextSlug) {
        return NextResponse.json(
          { error: "Slug URL tidak valid." },
          { status: 400 }
        );
      }
      if (nextSlug !== current.slug) {
        const dup = await db.execute({
          sql: `SELECT id FROM events WHERE slug = ? AND id != ? LIMIT 1`,
          args: [nextSlug, id],
        });
        if (dup.rows.length > 0) {
          return NextResponse.json(
            { error: `Slug "${nextSlug}" sudah digunakan webinar lain.` },
            { status: 409 }
          );
        }
      }
      updates.push("slug = ?");
      args.push(nextSlug);
    }
    if (typeof body.cert_number_format === "string" && body.cert_number_format.trim()) {
      updates.push("cert_number_format = ?");
      args.push(body.cert_number_format.trim());
    }
    if (body.start_number !== undefined) {
      updates.push("start_number = ?");
      args.push(Math.max(1, Number(body.start_number) || 1));
    }
    if (body.number_padding !== undefined) {
      updates.push("number_padding = ?");
      args.push(Math.max(1, Math.min(8, Number(body.number_padding) || 3)));
    }
    if (body.attendance_mode === "strict" || body.attendance_mode === "open") {
      updates.push("attendance_mode = ?");
      args.push(body.attendance_mode);
    }
    if (body.is_attendance_open !== undefined) {
      updates.push("is_attendance_open = ?");
      args.push(body.is_attendance_open ? 1 : 0);
    }
    if (body.is_download_open !== undefined) {
      updates.push("is_download_open = ?");
      args.push(body.is_download_open ? 1 : 0);
    }
    if (typeof body.template_url === "string") {
      updates.push("template_url = ?");
      args.push(body.template_url.trim());
    }
    if (body.layout_config !== undefined) {
      const layoutStr =
        typeof body.layout_config === "string"
          ? body.layout_config
          : JSON.stringify(body.layout_config);
      updates.push("layout_config = ?");
      args.push(layoutStr);
    }

    if (updates.length === 0) {
      return NextResponse.json({ ok: true, event: current });
    }

    updates.push("updated_at = ?");
    args.push(new Date().toISOString());
    args.push(id);

    await db.execute({
      sql: `UPDATE events SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    revalidateEventRelatedCaches(current.slug);
    const updated = await getEventById(id);
    if (updated && updated.slug !== current.slug) {
      revalidateEventRelatedCaches(updated.slug);
    }
    return NextResponse.json({ ok: true, event: updated });
  } catch (error) {
    console.error("PATCH /api/admin/events/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data webinar." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await ensureDbInitialized();
    await db.batch(
      [
        { sql: `DELETE FROM participants WHERE event_id = ?`, args: [id] },
        { sql: `DELETE FROM events WHERE id = ?`, args: [id] },
      ],
      "write"
    );
    revalidateEventRelatedCaches();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/events/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus webinar." },
      { status: 500 }
    );
  }
}
