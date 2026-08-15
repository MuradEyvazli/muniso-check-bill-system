const mongoose = require("mongoose");
const { TABLE_STATUS } = require("../lib/constants");

const TableSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 4 },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: Object.values(TABLE_STATUS),
      default: TABLE_STATUS.BOS,
    },
    currentTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
    },
    mergedGroupId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Table || mongoose.model("Table", TableSchema);
