const mongoose = require("mongoose");
const {
  ORDER_TYPES,
  TICKET_STATUS,
  KDS_STATUS,
  PREP_STATIONS,
  DISCOUNT_TYPES,
} = require("../lib/constants");

const SelectedOptionSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true },
    optionName: { type: String, required: true },
    priceDelta: { type: Number, default: 0 },
  },
  { _id: false }
);

const TicketItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    nameSnapshot: { type: String, required: true },
    unitPriceSnapshot: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    selectedOptions: { type: [SelectedOptionSchema], default: [] },
    note: { type: String, default: "" },
    discount: {
      type: {
        type: String,
        enum: Object.values(DISCOUNT_TYPES),
        default: null,
      },
      value: { type: Number, default: 0 },
    },
    isComp: { type: Boolean, default: false },
    isVoided: { type: Boolean, default: false },
    voidReason: { type: String, default: "" },
    prepStation: {
      type: String,
      enum: Object.values(PREP_STATIONS),
      default: PREP_STATIONS.MUTFAK,
    },
    kdsStatus: {
      type: String,
      enum: Object.values(KDS_STATUS),
      default: KDS_STATUS.YENI,
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const TicketHistorySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    detail: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TicketSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    orderType: {
      type: String,
      enum: Object.values(ORDER_TYPES),
      required: true,
    },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", default: null },
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", default: null },
    mergedGroupId: { type: String, default: null },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    deliveryAddress: {
      label: { type: String, default: "" },
      addressText: { type: String, default: "" },
      note: { type: String, default: "" },
    },
    waiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.ACIK,
    },
    items: { type: [TicketItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    // Ürün bazlı indirimlerden ayrı olarak, tüm adisyona (ödeme ekranından) uygulanan
    // tek seferlik özel indirim — "tanıdık indirimi" gibi. type null ise indirim yok.
    manualDiscount: {
      type: {
        type: String,
        enum: ["percent", "amount"],
        default: null,
      },
      value: { type: Number, default: 0 },
      reason: { type: String, default: "" },
    },
    discountTotal: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paidTotal: { type: Number, default: 0 },
    history: { type: [TicketHistorySchema], default: [] },
    ticketNo: { type: Number, default: 0 },
    marketplaceProvider: { type: String, default: null },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

TicketSchema.index({ branchId: 1, status: 1 });
TicketSchema.index({ branchId: 1, tableId: 1, status: 1 });

module.exports = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
