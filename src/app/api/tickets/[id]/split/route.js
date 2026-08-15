import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import Table from "@/models/Table";
import Counter from "@/models/Counter";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { recalcTicketTotals } from "@/lib/ticketCalc";

// Şube için bir sonraki adisyon numarasını atomik olarak üretir (bkz. /api/tickets).
async function nextTicketNo(branchId) {
  const counter = await Counter.findOneAndUpdate(
    { branchId, name: "ticketNo" },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );
  return counter.value;
}

// mode: "equal" -> sadece hesaplama döner, kayıt yapmaz.
// mode: "by-item" -> item id gruplarına göre yeni adisyonlar oluşturur.
export const POST = withApi("tickets:merge-move-split", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);
  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }

  if (body.mode === "equal") {
    const parts = Math.max(parseInt(body.parts, 10) || 2, 2);
    const perShare = Math.floor((ticket.grandTotal / parts) * 100) / 100;
    const shares = Array.from({ length: parts }, () => perShare);
    const distributed = perShare * parts;
    const remainder = Math.round((ticket.grandTotal - distributed) * 100) / 100;
    shares[0] = Math.round((shares[0] + remainder) * 100) / 100;
    return jsonOk({ mode: "equal", grandTotal: ticket.grandTotal, shares });
  }

  if (body.mode === "by-item") {
    const groups = Array.isArray(body.groups) ? body.groups : [];
    if (groups.length === 0) {
      const err = new Error("En az bir ürün grubu gerekli");
      err.status = 400;
      throw err;
    }

    const groupId = ticket.mergedGroupId || `grp_${ticket._id}`;
    ticket.mergedGroupId = groupId;

    const newTickets = [];
    for (const itemIds of groups) {
      const movedItems = [];
      for (const itemId of itemIds) {
        const item = ticket.items.id(itemId);
        if (item) {
          movedItems.push(item.toObject());
          item.deleteOne();
        }
      }
      if (movedItems.length === 0) continue;

      const splitTicketNo = await nextTicketNo(ticket.branchId);
      const splitTicket = await Ticket.create({
        branchId: ticket.branchId,
        orderType: ticket.orderType,
        tableId: ticket.tableId,
        hallId: ticket.hallId,
        mergedGroupId: groupId,
        waiterId: ticket.waiterId,
        ticketNo: splitTicketNo,
        items: movedItems.map((i) => ({ ...i, _id: undefined })),
        history: [
          {
            action: "hesap_bolundu",
            actorId: session.sub,
            detail: `${ticket._id} adisyonundan bölündü`,
          },
        ],
      });
      recalcTicketTotals(splitTicket);
      await splitTicket.save();
      newTickets.push(splitTicket);
    }

    ticket.history.push({
      action: "hesap_bolundu",
      actorId: session.sub,
      detail: `${newTickets.length} yeni adisyona bölündü`,
    });
    recalcTicketTotals(ticket);
    await ticket.save();

    return jsonOk({ mode: "by-item", originalTicket: ticket, newTickets });
  }

  const err = new Error("Geçersiz split modu");
  err.status = 400;
  throw err;
});
