const mongoose = require("mongoose");

// Şube başına, isme göre (örn. "ticketNo") atomik sayaçlar tutar. Adisyon
// numaralarının Date.now() gibi anlamsız/rastgele değerler yerine 1'den
// başlayan gerçek bir sıra takip etmesi için kullanılır. $inc ile atomik
// olarak artırıldığından aynı anda birden fazla adisyon açılsa bile çakışma
// olmaz.
const CounterSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    name: { type: String, required: true, default: "ticketNo" },
    value: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CounterSchema.index({ branchId: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
