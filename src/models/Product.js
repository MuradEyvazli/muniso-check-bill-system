const mongoose = require("mongoose");
const { PREP_STATIONS } = require("../lib/constants");

const ProductSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    prepStation: {
      type: String,
      enum: Object.values(PREP_STATIONS),
      default: PREP_STATIONS.MUTFAK,
    },
    prices: {
      salon: { type: Number, required: true, default: 0 },
      paket: { type: Number, default: 0 },
      gelAl: { type: Number, default: 0 },
      marketplace: { type: Number, default: 0 },
    },
    // İndirimli ürünlerde üstü çizili "eski fiyat" — sadece görsel amaçlı, tahsilat prices.* üzerinden yapılır.
    compareAtPrice: { type: Number, default: null },
    // Beslenme bilgisi (opsiyonel, menüde gösterilir).
    calories: { type: Number, default: null },
    proteinGrams: { type: Number, default: null },
    // "Öne Çıkan", "Özel Sunum", "Klasik" gibi rozet metni. İndirim rozeti compareAtPrice'tan otomatik türetilir.
    badge: { type: String, default: "" },
    // Günlük stok adedi. null = takip edilmiyor (sınırsız). 0 = tükendi.
    stockQuantity: { type: Number, default: null },
    optionGroupIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "OptionGroup" },
    ],
    stockStatus: { type: String, enum: ["acik", "kapali"], default: "acik" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Product || mongoose.model("Product", ProductSchema);
