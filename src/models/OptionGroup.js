const mongoose = require("mongoose");

const OptionItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    priceDelta: { type: Number, default: 0 },
  },
  { _id: false }
);

const OptionGroupSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    selectionType: {
      type: String,
      enum: ["single", "multiple"],
      default: "single",
    },
    isRequired: { type: Boolean, default: false },
    options: { type: [OptionItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.OptionGroup || mongoose.model("OptionGroup", OptionGroupSchema);
