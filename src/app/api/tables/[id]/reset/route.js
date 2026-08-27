import connectDB from "@/lib/db";
import Table from "@/models/Table";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk } from "@/lib/apiUtils";
import { TABLE_STATUS, TICKET_STATUS } from "@/lib/constants";

// Masayı elle boşaltır: bağlı açık adisyon varsa iptal edilir (geçmişe not düşülür),
// masa "boş" durumuna döner. Ürünleri silindiği halde "dolu" görünen masaları
// düzeltmek veya müşteri hiç sipariş vermeden kalkınca masayı sıfırlamak için kullanılır.
export const POST = withApi("tables:reset", async (req, { params }, session) => {
  await connectDB();
  const table = await Table.findById(params.id);
  if (!table) {
    const err = new Error("Masa bulunamadı");
    err.status = 404;
    throw err;
  }

  // Hesap "Ürüne Göre Böl" ile bölünmüşse aynı masaya bağlı birden fazla açık adisyon
  // olabilir — sadece "asıl" (currentTicketId) adisyonu değil, masaya bağlı TÜM açık
  // adisyonları iptal ederiz. Aksi halde bölünüp ödenmemiş bir alt adisyon, masa
  // boşaltıldıktan sonra da sistemde sonsuza kadar "açık" takılı kalırdı.
  const openTickets = await Ticket.find({
    tableId: params.id,
    status: TICKET_STATUS.ACIK,
  });
  for (const ticket of openTickets) {
    ticket.status = TICKET_STATUS.IPTAL;
    ticket.closedAt = new Date();
    ticket.history.push({
      action: "masa_sifirlandi",
      actorId: session.sub,
      detail: "Masa manuel olarak boşaltıldı",
    });
    await ticket.save();
  }

  table.status = TABLE_STATUS.BOS;
  table.currentTicketId = null;
  table.mergedGroupId = null;
  await table.save();

  return jsonOk({ table });
});
