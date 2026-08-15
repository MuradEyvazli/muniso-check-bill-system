const mongoose = require("mongoose");

const ShiftSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    openedAt: { type: Date, default: Date.now },
    openingCash: { type: Number, required: true, default: 0 },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    closedAt: { type: Date, default: null },
    closingCashCounted: { type: Number, default: null },
    expectedCash: { type: Number, default: null },
    difference: { type: Number, default: null },
    status: { type: String, enum: ["acik", "kapali"], default: "acik" },
    zReportSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

ShiftSchema.index({ branchId: 1, status: 1 });

module.exports = mongoose.models.Shift || mongoose.model("Shift", ShiftSchema);
