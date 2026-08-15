import connectDB from "@/lib/db";
import Table from "@/models/Table";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { recalcTicketTotals } from "@/lib/ticketCalc";

// Masaları birleştirir: kaynak masanın adisyonu tüm gruba yayılır.
export const POST = withApi("tickets:merge-move-split", async (req, { params }, session) => {
  await connectDB();
  const { targetTableId } = await parseBody(req);
  if (!targetTableId) {
    const err = new Error("Hedef masa gerekli");
    err.status = 400;
    throw err;
  }

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

  const mainTicket = await Ticket.findById(sourceTable.currentTicketId);
  const groupId = sourceTable.mergedGroupId || `grp_${sourceTable._id}`;

  // Hedef masada açık ayrı bir adisyon varsa, ürünlerini ana adisyona taşı ve kapat.
  if (targetTable.currentTicketId && String(targetTable.currentTicketId) !== String(mainTicket._id)) {
    const targetTicket = await Ticket.findById(targetTable.currentTicketId);
    if (targetTicket && targetTicket.status === "acik") {
      mainTicket.items.push(...targetTicket.items);
      mainTicket.history.push({
        action: "masa_birlestirme",
        actorId: session.sub,
        detail: `${targetTable.name} masasının adisyonu ${sourceTable.name} ile birleştirildi`,
      });
      targetTicket.status = "iptal";
      targetTicket.history.push({
        action: "birlestirme_ile_kapatildi",
        actorId: session.sub,
        detail: `${sourceTable.name} masasına birleştirildi`,
      });
      await targetTicket.save();
    }
  }

  mainTicket.history.push({
    action: "masa_birlestirme",
    actorId: session.sub,
    detail: `${sourceTable.name} + ${targetTable.name} birleştirildi`,
  });
  recalcTicketTotals(mainTicket);
  await mainTicket.save();

  sourceTable.mergedGroupId = groupId;
  targetTable.mergedGroupId = groupId;
  targetTable.currentTicketId = mainTicket._id;
  targetTable.status = "dolu";
  await sourceTable.save();
  await targetTable.save();

  return jsonOk({ ticket: mainTicket, sourceTable, targetTable });
});
