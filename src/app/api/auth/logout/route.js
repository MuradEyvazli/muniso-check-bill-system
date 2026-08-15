import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { clearAuthCookies, ACCESS_COOKIE } from "@/lib/auth/cookies";

export async function POST() {
  await connectDB();
  const token = cookies().get(ACCESS_COOKIE)?.value;
  const decoded = token ? verifyAccessToken(token) : null;
  if (decoded?.sub) {
    await User.findByIdAndUpdate(decoded.sub, { refreshTokenHash: null });
  }
  const res = NextResponse.json({ ok: true });
  return clearAuthCookies(res);
}
