const mongoose = require("mongoose");
const { MARKETPLACE_PROVIDERS } = require("../lib/constants");

const MarketplaceOrderSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: Object.values(MARKETPLACE_PROVIDERS),
      required: true,
    },
    externalOrderId: { type: String, required: true },
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    mappedTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
    },
    status: {
      type: String,
      enum: ["alindi", "isleniyor", "tamamlandi", "hata"],
      default: "alindi",
    },
    errorMessage: { type: String, default: "" },
    receivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MarketplaceOrderSchema.index(
  { branchId: 1, provider: 1, externalOrderId: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.MarketplaceOrder ||
  mongoose.model("MarketplaceOrder", MarketplaceOrderSchema);
