import connectDB from "@/lib/db";
import Hall from "@/models/Hall";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";

export const GET = withApi("tables:view", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const halls = await Hall.find({ branchId, isActive: true })
    .sort({ order: 1 })
    .lean();
  return jsonOk({ halls });
});

export const POST = withApi("tables:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);
  if (!body.name) {
    const err = new Error("Salon adı gerekli");
    err.status = 400;
    throw err;
  }
  const hall = await Hall.create({
    branchId,
    name: body.name,
    order: body.order || 0,
  });
  return jsonOk({ hall }, { status: 201 });
});
