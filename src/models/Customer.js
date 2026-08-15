const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Adres" },
    addressText: { type: String, required: true },
    note: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CustomerSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true },
    name: { type: String, default: "", trim: true },
    addresses: { type: [AddressSchema], default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

CustomerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });

module.exports =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
