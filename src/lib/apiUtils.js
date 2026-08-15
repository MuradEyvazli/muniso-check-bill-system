import { NextResponse } from "next/server";
import { requireSession } from "./auth/session";
import { assertPermission } from "./permissions";

export function jsonOk(data, init) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message, status = 400, extra) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra || {}) },
    { status }
  );
}

/**
 * API route handler'larını sarmalar: oturum + izin kontrolü + hata yönetimi.
 * action null ise sadece oturum kontrolü yapılır.
 */
export function withApi(action, handler) {
  return async (req, ctx) => {
    try {
      const session = requireSession();
      if (action) assertPermission(session.role, action);
      return await handler(req, ctx, session);
    } catch (err) {
      const status = err.status || 500;
      if (status === 500) {
        console.error("API error:", err);
      }
      return jsonError(err.message || "Sunucu hatası", status);
    }
  };
}

export async function parseBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

/**
 * İstekten şube id'sini çözer: ?branchId= varsa onu, yoksa oturumdaki ilk şubeyi kullanır.
 * Çoklu şube desteği ileride burada genişletilir.
 */
export function resolveBranchId(req, session) {
  const url = new URL(req.url);
  const qsBranch = url.searchParams.get("branchId");
  const branchId = qsBranch || session.branchIds?.[0];
  if (!branchId) {
    const err = new Error("Kullanıcıya atanmış şube bulunamadı");
    err.status = 400;
    throw err;
  }
  return branchId;
}
