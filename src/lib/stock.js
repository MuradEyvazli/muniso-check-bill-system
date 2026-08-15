import Product from "@/models/Product";

/**
 * stockQuantity izlenen bir üründe miktarı değiştirir.
 * delta negatifse stok düşer (tüketim/sipariş), pozitifse stok geri eklenir (iptal/iade).
 * Ürünün stockQuantity'si null ise (takip edilmiyor) hiçbir şey yapmaz.
 */
export async function adjustProductStock(productId, delta) {
  if (!delta) return null;
  const product = await Product.findById(productId);
  if (!product || typeof product.stockQuantity !== "number") return null;

  if (delta < 0) {
    const need = -delta;
    if (product.stockQuantity < need) {
      const err = new Error(
        `Yetersiz stok: "${product.name}" için kalan ${product.stockQuantity} adet`
      );
      err.status = 400;
      throw err;
    }
    product.stockQuantity -= need;
  } else {
    product.stockQuantity += delta;
  }

  product.stockStatus = product.stockQuantity > 0 ? "acik" : "kapali";
  await product.save();
  return product;
}
