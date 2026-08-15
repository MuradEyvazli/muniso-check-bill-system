const mongoose = require("mongoose");

const PrinterConfigSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    role: { type: String, enum: ["mutfak", "kasa"], required: true },
    connectionType: { type: String, enum: ["network", "usb"], default: "network" },
    ip: { type: String, default: "" },
    port: { type: Number, default: 9100 },
    usbPath: { type: String, default: "" },
    paperWidth: { type: Number, enum: [58, 80], default: 80 },
    prepStations: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PrinterConfig || mongoose.model("PrinterConfig", PrinterConfigSchema);
