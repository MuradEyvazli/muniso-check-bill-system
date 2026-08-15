import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import Table from "@/models/Table";
import { withApi, jsonOk } from "@/lib/apiUtils";
import { TABLE_STATUS, TICKET_STATUS } from "@/lib/constants";

export const POST = withApi("tickets:close", async (req, { params }, session) => {
  await connectDB();
  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }
  if (ticket.paidTotal < ticket.grandTotal) {
    const err = new Error("Adisyon tamamen ödenmeden kapatılamaz");
    err.status = 400;
    throw err;
  }

  ticket.status = TICKET_STATUS.KAPANDI;
  ticket.closedAt = new Date();
  ticket.history.push({ action: "adisyon_kapatildi", actorId: session.sub });
  await ticket.save();

  if (ticket.tableId) {
    await Table.findByIdAndUpdate(ticket.tableId, {
      status: TABLE_STATUS.BOS,
      currentTicketId: null,
      mergedGroupId: null,
    });
  }

  return jsonOk({ ticket });
});
