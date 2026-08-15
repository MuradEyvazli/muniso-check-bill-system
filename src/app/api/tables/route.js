import connectDB from "@/lib/db";
import Table from "@/models/Table";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";

export const GET = withApi("tables:view", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);

  const tables = await Table.find({ branchId, isActive: true }).lean();
  const ticketIds = tables
    .map((t) => t.currentTicketId)
    .filter(Boolean);

  const tickets = ticketIds.length
    ? await Ticket.find({ _id: { $in: ticketIds } })
        .select("openedAt grandTotal paidTotal status waiterId")
        .lean()
    : [];
  const ticketMap = new Map(tickets.map((t) => [String(t._id), t]));

  const now = Date.now();
  const enriched = tables.map((table) => {
    const ticket = table.currentTicketId
      ? ticketMap.get(String(table.currentTicketId))
      : null;
    return {
      ...table,
      openAmount: ticket ? Math.max(ticket.grandTotal - ticket.paidTotal, 0) : 0,
      elapsedMinutes: ticket
        ? Math.floor((now - new Date(ticket.openedAt).getTime()) / 60000)
        : 0,
    };
  });

  return jsonOk({ tables: enriched });
});

export const POST = withApi("tables:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);
  if (!body.name || !body.hallId) {
    const err = new Error("Masa adı ve salon gerekli");
    err.status = 400;
    throw err;
  }
  const table = await Table.create({
    branchId,
    hallId: body.hallId,
    name: body.name,
    capacity: body.capacity || 4,
    position: body.position || { x: 0, y: 0 },
  });
  return jsonOk({ table }, { status: 201 });
});
