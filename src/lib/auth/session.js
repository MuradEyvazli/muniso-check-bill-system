import { cookies } from "next/headers";
import { verifyAccessToken } from "./jwt";
import { ACCESS_COOKIE } from "./cookies";

/**
 * API route handler'ları içinde çağrılır. Geçerli oturum yoksa null döner.
 */
export function getSession() {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload) return null;
  return payload; // { sub, restaurantId, branchIds, role, name, username }
}

export function requireSession() {
  const session = getSession();
  if (!session) {
    const err = new Error("Oturum bulunamadı");
    err.status = 401;
    throw err;
  }
  return session;
}
