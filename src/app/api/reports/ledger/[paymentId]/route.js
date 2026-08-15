import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import Ticket from "@/models/Ticket";
import Table from "@/models/Table";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { round2 } from "@/lib/ticketCalc";
import { TICKET_STATUS, TABLE_STATUS } from "@/lib/constants";

// Yanlışlıkla girilmiş bir ödemeyi silmek için — geri alınamaz olduğundan bir
// silme şifresi ister. Kod içinde sabit tutulmaz, .env'den okunur (REPORTS_RESET_PASSWORD).
// Silinince o günün cirosundan gerçekten düşer (çünkü ciro doğrudan Payment
// kayıtlarından hesaplanır).
const DELETE_PASSWORD = process.env.REPORTS_RESET_PASSWORD || "1234";

export const DELETE = withApi("reports:manage", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);

  if (String(body.confirmPassword || "") !== DELETE_PASSWORD) {
    const err = new Error("Silme şifresi yanlış");
    err.status = 403;
    throw err;
  }

  const payment = await Payment.findById(params.paymentId);
  if (!payment) {
    const err = new Error("Ödeme kaydı bulunamadı");
    err.status = 404;
    throw err;
  }

  const ticket = await Ticket.findById(payment.ticketId);
  if (ticket) {
    ticket.paidTotal = Math.max(round2(ticket.paidTotal - payment.amount), 0);
    ticket.history.push({
      action: "odeme_silindi",
      actorId: session.sub,
      detail: `${payment.method} · ${payment.amount} silindi`,
    });

    // Bu ödeme adisyonu tam kapatmışsa ve silinince artık bakiye kalıyorsa,
    // adisyonu tekrar açık duruma getir.
    if (ticket.status === TICKET_STATUS.KAPANDI && ticket.paidTotal < ticket.grandTotal - 0.01) {
      ticket.status = TICKET_STATUS.ACIK;
      ticket.closedAt = null;

      // Masa bu arada başka bir siparişe açılmadıysa (hâlâ boşsa) geri bağla.
      if (ticket.tableId) {
        const table = await Table.findById(ticket.tableId);
        if (table && !table.currentTicketId) {
          table.status = TABLE_STATUS.DOLU;
          table.currentTicketId = ticket._id;
          await table.save();
        }
      }
    }

    await ticket.save();
  }

  await Payment.deleteOne({ _id: payment._id });

  return jsonOk({ deleted: true });
});
