import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";

export const PATCH = withApi("menu:stock-toggle", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);

  // Sadece stok durumu/adedi değiştiriliyorsa daha düşük yetki yeterli, diğer alanlar için admin gerekir.
  const stockFields = new Set(["stockStatus", "stockQuantity"]);
  const onlyStockToggle = Object.keys(body).every((key) => stockFields.has(key));
  if (!onlyStockToggle && session.role !== "admin") {
    const err = new Error("Bu işlem için yetkiniz yok");
    err.status = 403;
    throw err;
  }

  const product = await Product.findByIdAndUpdate(params.id, body, { new: true });
  if (!product) {
    const err = new Error("Ürün bulunamadı");
    err.status = 404;
    throw err;
  }
  return jsonOk({ product });
});

export const DELETE = withApi("menu:manage", async (req, { params }) => {
  await connectDB();
  await Product.findByIdAndUpdate(params.id, { isActive: false });
  return jsonOk({ deleted: true });
});
