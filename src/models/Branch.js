const mongoose = require("mongoose");

// Haftanın günlerine göre çalışma saatleri. day: 0=Pazartesi ... 6=Pazar.
// closeTime, openTime'dan küçük/eşitse gece yarısını geçtiği (ertesi güne taştığı)
// kabul edilir (ör. openTime "11:00", closeTime "03:00").
const DEFAULT_OPERATING_HOURS = Array.from({ length: 7 }, (_, day) => ({
  day,
  isOpen: true,
  openTime: "11:00",
  closeTime: "03:00",
}));

const OperatingHourSchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: "11:00" },
    closeTime: { type: String, default: "03:00" },
  },
  { _id: false }
);

const BranchSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    operatingHours: { type: [OperatingHourSchema], default: DEFAULT_OPERATING_HOURS },
    // Raporlarda "gün" sınırının nerede başladığı (İstanbul saatiyle, 0-12 arası saat).
    // Gece yarısından sonra açık kalan işletmeler için 0 dışında bir değer, o gecenin
    // satışlarının hâlâ "önceki gün"e sayılmasını sağlar. Ayarlar ekranından, çalışma
    // saatlerine göre önerilen bir değerle birlikte kullanıcı tarafından değiştirilebilir.
    businessDayCutoffHour: { type: Number, default: 5, min: 0, max: 12 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Branch || mongoose.model("Branch", BranchSchema);
