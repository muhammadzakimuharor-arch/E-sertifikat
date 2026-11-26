import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type AdminTokenPayload,
} from "./jwt";

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
