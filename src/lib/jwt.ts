import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "vericert_session";

export interface AdminTokenPayload {
  sub: string;
  email: string;
  name: string;
}

function getJwtSecretKey(): Uint8Array {
  const secret =
    process.env.JWT_SECRET?.trim() ||
    "vericert-dev-fallback-secret-change-in-production-2026";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: AdminTokenPayload,
  rememberMe = true
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(rememberMe ? "7d" : "1d")
    .sign(getJwtSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (!payload.sub || typeof payload.email !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "Admin",
    };
  } catch {
    return null;
  }
}
