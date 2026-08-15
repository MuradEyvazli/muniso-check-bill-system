import connectDB from "@/lib/db";
import Shift from "@/models/Shift";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";
import { assertPermission } from "@/lib/permissions";

export const GET = withApi(null, async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const url = new URL(req.url);
  if (url.searchParams.get("active") === "true") {
    const shift = await Shift.findOne({ branchId, status: "acik" }).lean();
    return jsonOk({ shift });
  }

  // Geçmiş gün/vardiya listesi finansal bir rapordur — sadece yöneticiler görebilir.
  assertPermission(session.role, "reports:view");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 30, 365);
  const shifts = await Shift.find({ branchId, status: "kapali" })
    .sort({ openedAt: -1 })
    .limit(limit)
    .lean();
  return jsonOk({ shifts });
});

export const POST = withApi("shifts:open", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);

  const existing = await Shift.findOne({ branchId, status: "acik" });
  if (existing) {
    const err = new Error("Zaten açık bir vardiya var");
    err.status = 409;
    throw err;
  }

  const shift = await Shift.create({
    branchId,
    openedBy: session.sub,
    openingCash: body.openingCash || 0,
  });

  return jsonOk({ shift }, { status: 201 });
});
