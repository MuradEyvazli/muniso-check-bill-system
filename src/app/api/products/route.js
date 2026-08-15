import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";

export const GET = withApi(null, async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId");
  const query = { branchId, isActive: true };
  if (categoryId) query.categoryId = categoryId;
  const products = await Product.find(query).sort({ order: 1, name: 1 }).lean();
  return jsonOk({ products });
});

export const POST = withApi("menu:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);
  if (!body.name || !body.categoryId) {
    const err = new Error("Ürün adı ve kategori gerekli");
    err.status = 400;
    throw err;
  }
  const product = await Product.create({
    branchId,
    categoryId: body.categoryId,
    name: body.name,
    description: body.description || "",
    images: body.images || [],
    prepStation: body.prepStation || "mutfak",
    prices: {
      salon: body.prices?.salon ?? 0,
      paket: body.prices?.paket ?? body.prices?.salon ?? 0,
      gelAl: body.prices?.gelAl ?? body.prices?.salon ?? 0,
      marketplace: body.prices?.marketplace ?? body.prices?.salon ?? 0,
    },
    compareAtPrice: body.compareAtPrice || null,
    calories: body.calories || null,
    proteinGrams: body.proteinGrams || null,
    badge: body.badge || "",
    stockQuantity:
      body.stockQuantity === "" || body.stockQuantity === undefined
        ? null
        : Number(body.stockQuantity),
    order: body.order || 0,
    optionGroupIds: body.optionGroupIds || [],
  });
  return jsonOk({ product }, { status: 201 });
});
