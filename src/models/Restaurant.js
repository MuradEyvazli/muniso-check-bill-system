const mongoose = require("mongoose");

const RestaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    logoUrl: { type: String, default: "" },
    brandColors: {
      primary: { type: String, default: "#7B1E2B" },
      gold: { type: String, default: "#C9A227" },
    },
    currency: { type: String, default: "TRY" },
    timezone: { type: String, default: "Europe/Istanbul" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Restaurant || mongoose.model("Restaurant", RestaurantSchema);
