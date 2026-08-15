import connectDB from "@/lib/db";
import Category from "@/models/Category";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";

export const GET = withApi(null, async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const categories = await Category.find({ branchId, isActive: true })
    .sort({ order: 1 })
    .lean();
  return jsonOk({ categories });
});

export const POST = withApi("menu:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);
  if (!body.name) {
    const err = new Error("Kategori adı gerekli");
    err.status = 400;
    throw err;
  }
  const category = await Category.create({
    branchId,
    name: body.name,
    description: body.description || "",
    order: body.order || 0,
  });
  return jsonOk({ category }, { status: 201 });
});
