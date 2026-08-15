import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { compareSecret, hashSecret } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { jsonError, parseBody } from "@/lib/apiUtils";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

export async function POST(req) {
  await connectDB();

  // Brute-force koruması: aynı IP'den 10 dakikada 10'dan fazla giriş denemesi
  // engellenir. Şifre doğru/yanlış fark etmeden her denemeyi sayar.
  const { allowed, retryAfterMs } = await checkRateLimit(`login:${getClientKey(req)}`, {
    max: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return jsonError(
      `Çok fazla deneme yapıldı. Lütfen ${Math.ceil(retryAfterMs / 60000)} dakika sonra tekrar deneyin.`,
      429
    );
  }

  const { username, password } = await parseBody(req);

  if (!username || !password) {
    return jsonError("Kullanıcı adı ve şifre gerekli", 400);
  }

  const user = await User.findOne({
    username: username.trim().toLowerCase(),
    isActive: true,
  });

  if (!user || !user.passwordHash) {
    return jsonError("Kullanıcı adı veya şifre hatalı", 401);
  }

  const valid = await compareSecret(password, user.passwordHash);
  if (!valid) {
    return jsonError("Kullanıcı adı veya şifre hatalı", 401);
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
  user.lastLoginAt = new Date();
  await user.save();

  const res = NextResponse.json({ ok: true, data: { user: payload } });
  return setAuthCookies(res, { accessToken, refreshToken });
}
