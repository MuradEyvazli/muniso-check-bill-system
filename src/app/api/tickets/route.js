import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import Table from "@/models/Table";
import Counter from "@/models/Counter";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";
import { ORDER_TYPES, TABLE_STATUS, TICKET_STATUS } from "@/lib/constants";

// Şube için bir sonraki adisyon numarasını atomik olarak üretir (1, 2, 3…).
// Ayarlar'dan sayaç sıfırlanırsa bir sonraki adisyon yeniden 1'den başlar.
async function nextTicketNo(branchId) {
  const counter = await Counter.findOneAndUpdate(
    { branchId, name: "ticketNo" },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );
  return counter.value;
}

export const GET = withApi("tickets:view", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || TICKET_STATUS.ACIK;
  const orderType = url.searchParams.get("orderType");
  const mergedGroupId = url.searchParams.get("mergedGroupId");

  const query = { branchId };
  if (status !== "hepsi") query.status = status;
  if (orderType) query.orderType = orderType;
  if (mergedGroupId) query.mergedGroupId = mergedGroupId;

  const tickets = await Ticket.find(query).sort({ openedAt: -1 }).lean();
  return jsonOk({ tickets });
});

export const POST = withApi("tickets:create", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);

  const orderType = body.orderType || ORDER_TYPES.MASA;
  let hallId = body.hallId || null;
  let table = null;

  if (orderType === ORDER_TYPES.MASA) {
    if (!body.tableId) {
      const err = new Error("Masa seçimi gerekli");
      err.status = 400;
      throw err;
    }
    table = await Table.findById(body.tableId);
    if (!table) {
      const err = new Error("Masa bulunamadı");
      err.status = 404;
      throw err;
    }
    if (table.currentTicketId) {
      const err = new Error("Bu masada zaten açık bir adisyon var");
      err.status = 409;
      throw err;
    }
    hallId = table.hallId;
  }

  const ticketNo = await nextTicketNo(branchId);

  const ticket = await Ticket.create({
    branchId,
    orderType,
    tableId: table ? table._id : null,
    hallId,
    customerId: body.customerId || null,
    deliveryAddress: body.deliveryAddress || undefined,
    waiterId: session.sub,
    items: [],
    ticketNo,
    history: [
      {
        action: "adisyon_acildi",
        actorId: session.sub,
        detail: table ? `${table.name} için açıldı` : `${orderType} siparişi açıldı`,
      },
    ],
  });

  if (table) {
    table.currentTicketId = ticket._id;
    table.status = TABLE_STATUS.DOLU;
    await table.save();
  }

  return jsonOk({ ticket }, { status: 201 });
});
