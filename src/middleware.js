import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_COOKIE = "muniso_access";
const PUBLIC_PATHS = ["/login", "/robots.txt"];

// Güvenlik: kod içinde sabit bir varsayılan JWT anahtarı kullanılmaz (bkz. lib/auth/jwt.js
// için aynı gerekçe) — .env'de tanımlı değilse tüm istekler net bir hatayla reddedilir.
const ACCESS_SECRET_VALUE = process.env.JWT_ACCESS_SECRET;

async function isValidToken(token) {
  if (!token) return false;
  if (!ACCESS_SECRET_VALUE) {
    console.error("JWT_ACCESS_SECRET .env dosyasında tanımlı değil.");
    return false;
  }
  try {
    const secret = new TextEncoder().encode(ACCESS_SECRET_VALUE);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/print-agent") ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const valid = await isValidToken(token);

  if (!valid) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { ok: false, error: "Oturum bulunamadı" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|logo|favicon.ico).*)"],
};
