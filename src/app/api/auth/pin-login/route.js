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

  // PIN girişi kullanıcı adı istemediği ve sadece 4-6 haneli olduğu için
  // brute-force'a en açık uç nokta budur — burada limit daha sıkı.
  const { allowed, retryAfterMs } = await checkRateLimit(`pin-login:${getClientKey(req)}`, {
    max: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return jsonError(
      `Çok fazla deneme yapıldı. Lütfen ${Math.ceil(retryAfterMs / 60000)} dakika sonra tekrar deneyin.`,
      429
    );
  }

  const { pin, branchId } = await parseBody(req);

  if (!pin || pin.length < 4) {
    return jsonError("Geçerli bir PIN girin", 400);
  }

  const query = { isActive: true, pinCodeHash: { $ne: null } };
  if (branchId) query.branchIds = branchId;

  const candidates = await User.find(query);

  let matchedUser = null;
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const match = await compareSecret(pin, candidate.pinCodeHash);
    if (match) {
      matchedUser = candidate;
      break;
    }
  }

  if (!matchedUser) {
    return jsonError("PIN hatalı", 401);
  }

  const payload = {
    sub: matchedUser._id.toString(),
    restaurantId: matchedUser.restaurantId.toString(),
    branchIds: matchedUser.branchIds.map((b) => b.toString()),
    role: matchedUser.role,
    name: `${matchedUser.name} ${matchedUser.surname || ""}`.trim(),
    username: matchedUser.username,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: payload.sub });

  matchedUser.refreshTokenHash = await hashSecret(refreshToken);
  matchedUser.lastLoginAt = new Date();
  await matchedUser.save();

  const res = NextResponse.json({ ok: true, data: { user: payload } });
  return setAuthCookies(res, { accessToken, refreshToken });
}
