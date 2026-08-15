import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import Product from "@/models/Product";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { recalcTicketTotals } from "@/lib/ticketCalc";
import { adjustProductStock } from "@/lib/stock";
import { ORDER_TYPES } from "@/lib/constants";

const PRICE_FIELD_BY_ORDER_TYPE = {
  [ORDER_TYPES.MASA]: "salon",
  [ORDER_TYPES.PAKET]: "paket",
  [ORDER_TYPES.GEL_AL]: "gelAl",
};

export const POST = withApi("tickets:edit-items", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);

  if (!body.productId) {
    const err = new Error("Ürün seçimi gerekli");
    err.status = 400;
    throw err;
  }

  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }
  if (ticket.status !== "acik") {
    const err = new Error("Kapalı adisyona ürün eklenemez");
    err.status = 400;
    throw err;
  }

  const product = await Product.findById(body.productId).lean();
  if (!product) {
    const err = new Error("Ürün bulunamadı");
    err.status = 404;
    throw err;
  }
  if (product.stockStatus === "kapali") {
    const err = new Error("Ürün stokta yok");
    err.status = 400;
    throw err;
  }

  const priceField = PRICE_FIELD_BY_ORDER_TYPE[ticket.orderType] || "salon";
  const unitPrice = product.prices[priceField] ?? product.prices.salon;
  const quantity = body.quantity && body.quantity > 0 ? body.quantity : 1;

  // Günlük stok adedi takip ediliyorsa düş; yetersizse hata fırlatır ve ürün eklenmez.
  await adjustProductStock(product._id, -quantity);

  ticket.items.push({
    productId: product._id,
    nameSnapshot: product.name,
    unitPriceSnapshot: unitPrice,
    quantity,
    selectedOptions: body.selectedOptions || [],
    note: body.note || "",
    prepStation: product.prepStation,
    addedBy: session.sub,
  });

  ticket.history.push({
    action: "urun_eklendi",
    actorId: session.sub,
    detail: `${product.name} x${quantity}`,
  });

  recalcTicketTotals(ticket);
  await ticket.save();

  return jsonOk({ ticket }, { status: 201 });
});
