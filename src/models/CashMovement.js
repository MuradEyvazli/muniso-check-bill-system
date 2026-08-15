const mongoose = require("mongoose");
const { CASH_MOVEMENT_TYPES } = require("../lib/constants");

const CashMovementSchema = new mongoose.Schema(
  {
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    type: { type: String, enum: Object.values(CASH_MOVEMENT_TYPES), required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CashMovement || mongoose.model("CashMovement", CashMovementSchema);
