import connectDB from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";

export const PATCH = withApi("menu:manage", async (req, { params }) => {
  await connectDB();
  const body = await parseBody(req);
  const category = await Category.findByIdAndUpdate(params.id, body, { new: true });
  if (!category) {
    const err = new Error("Kategori bulunamadı");
    err.status = 404;
    throw err;
  }
  return jsonOk({ category });
});

export const DELETE = withApi("menu:manage", async (req, { params }) => {
  await connectDB();

  // Bu kategoride hâlâ aktif ürün varsa silmeyi engelle — aksi halde o
  // ürünler hiçbir kategori sekmesinde görünmeyen "yetim" ürünlere dönüşür
  // (adisyon ekranındaki ürün listesi kategoriye göre filtrelendiği için).
  const activeProductCount = await Product.countDocuments({
    categoryId: params.id,
    isActive: true,
  });
  if (activeProductCount > 0) {
    const err = new Error(
      `Bu kategoride ${activeProductCount} ürün var. Önce bu ürünleri silin ya da başka bir kategoriye taşıyın.`
    );
    err.status = 400;
    throw err;
  }

  await Category.findByIdAndUpdate(params.id, { isActive: false });
  return jsonOk({ deleted: true });
});
