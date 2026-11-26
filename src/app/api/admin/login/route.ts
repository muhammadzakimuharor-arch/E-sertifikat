import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ensureDbInitialized } from "@/lib/db";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
    };

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const db = await ensureDbInitialized();
    const res = await db.execute({
      sql: `SELECT id, name, email, password_hash FROM admins WHERE LOWER(email) = ? LIMIT 1`,
      args: [email],
    });

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: "Email atau kata sandi admin tidak valid." },
        { status: 401 }
      );
    }

    const admin = res.rows[0];
    const match = await bcrypt.compare(password, String(admin.password_hash));
    if (!match) {
      return NextResponse.json(
        { error: "Email atau kata sandi admin tidak valid." },
        { status: 401 }
      );
    }

    const rememberMe = body.rememberMe !== false;
    const token = await signSessionToken(
      {
        sub: String(admin.id),
        email: String(admin.email),
        name: String(admin.name),
      },
      rememberMe
    );

    const response = NextResponse.json({
      ok: true,
      admin: {
        id: String(admin.id),
        name: String(admin.name),
        email: String(admin.email),
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses login." },
      { status: 500 }
    );
  }
}
