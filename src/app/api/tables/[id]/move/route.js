import connectDB from "@/lib/db";
import Table from "@/models/Table";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { TABLE_STATUS } from "@/lib/constants";

// Adisyonu başka boş bir masaya taşır.
export const POST = withApi("tickets:merge-move-split", async (req, { params }, session) => {
  await connectDB();
  const { targetTableId } = await parseBody(req);
  const sourceTable = await Table.findById(params.id);
  const targetTable = await Table.findById(targetTableId);

  if (!sourceTable || !targetTable) {
    const err = new Error("Masa bulunamadı");
    err.status = 404;
    throw err;
  }
  if (!sourceTable.currentTicketId) {
    const err = new Error("Kaynak masada açık adisyon yok");
    err.status = 400;
    throw err;
  }
  if (targetTable.currentTicketId) {
    const err = new Error("Hedef masa dolu");
    err.status = 400;
    throw err;
  }

  const ticket = await Ticket.findById(sourceTable.currentTicketId);
  ticket.tableId = targetTable._id;
  ticket.hallId = targetTable.hallId;
  ticket.history.push({
    action: "masa_tasima",
    actorId: session.sub,
    detail: `${sourceTable.name} → ${targetTable.name}`,
  });
  await ticket.save();

  targetTable.currentTicketId = ticket._id;
  targetTable.status = TABLE_STATUS.DOLU;
  sourceTable.currentTicketId = null;
  sourceTable.status = TABLE_STATUS.BOS;
  sourceTable.mergedGroupId = null;

  await targetTable.save();
  await sourceTable.save();

  return jsonOk({ ticket, sourceTable, targetTable });
});
