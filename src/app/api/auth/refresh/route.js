import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { compareSecret, hashSecret } from "@/lib/auth/password";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { jsonError } from "@/lib/apiUtils";

export async function POST() {
  await connectDB();
  const token = cookies().get(REFRESH_COOKIE)?.value;
  if (!token) return jsonError("Oturum bulunamadı", 401);

  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    const res = jsonError("Oturum süresi doldu, tekrar giriş yapın", 401);
    return clearAuthCookies(res);
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive || !user.refreshTokenHash) {
    const res = jsonError("Oturum geçersiz", 401);
    return clearAuthCookies(res);
  }

  const valid = await compareSecret(token, user.refreshTokenHash);
  if (!valid) {
    const res = jsonError("Oturum geçersiz", 401);
    return clearAuthCookies(res);
  }

  const payload = {
    sub: user._id.toString(),
    restaurantId: user.restaurantId.toString(),
    branchIds: user.branchIds.map((b) => b.toString()),
    role: user.role,
    name: `${user.name} ${user.surname || ""}`.trim(),
    username: user.username,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: payload.sub });
  user.refreshTokenHash = await hashSecret(refreshToken);
  await user.save();

  const res = NextResponse.json({ ok: true, data: { user: payload } });
  return setAuthCookies(res, { accessToken, refreshToken });
}
