const mongoose = require("mongoose");
const { PAYMENT_METHODS } = require("../lib/constants");

const PaymentSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
      index: true,
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true,
    },
    amount: { type: Number, required: true },
    receivedAmount: { type: Number, default: null },
    changeAmount: { type: Number, default: 0 },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
