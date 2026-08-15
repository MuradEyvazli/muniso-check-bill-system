import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import Ticket from "@/models/Ticket";
import Table from "@/models/Table";
import Shift from "@/models/Shift";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";
import { TABLE_STATUS, TICKET_STATUS, PAYMENT_METHODS } from "@/lib/constants";

export const GET = withApi("tickets:view", async (req, ctx, session) => {
  await connectDB();
  const url = new URL(req.url);
  const ticketId = url.searchParams.get("ticketId");
  if (!ticketId) {
    const err = new Error("ticketId parametresi gerekli");
    err.status = 400;
    throw err;
  }
  const payments = await Payment.find({ ticketId }).sort({ createdAt: 1 }).lean();
  return jsonOk({ payments });
});

export const POST = withApi("payments:process", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);

  const { ticketId, method, amount } = body;
  if (!ticketId || !method || !amount || amount <= 0) {
    const err = new Error("ticketId, method ve amount (0'dan büyük) gerekli");
    err.status = 400;
    throw err;
  }
  if (!Object.values(PAYMENT_METHODS).includes(method)) {
    const err = new Error("Geçersiz ödeme yöntemi");
    err.status = 400;
    throw err;
  }

  // Adisyon ve açık vardiya birbirinden bağımsız okumalar — paralel çekilir (gecikmeyi azaltır).
  const [ticket, openShift] = await Promise.all([
    Ticket.findById(ticketId),
    Shift.findOne({ branchId, status: "acik" }),
  ]);

  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }
  if (ticket.status !== TICKET_STATUS.ACIK) {
    const err = new Error("Kapalı adisyona ödeme alınamaz");
    err.status = 400;
    throw err;
  }

  const remaining = Math.round((ticket.grandTotal - ticket.paidTotal) * 100) / 100;
  if (amount > remaining + 0.01) {
    const err = new Error(`Ödeme tutarı kalan bakiyeden (${remaining}) fazla olamaz`);
    err.status = 400;
    throw err;
  }

  if (!openShift) {
    const err = new Error("Ödeme alınabilmesi için önce vardiya açılmalı");
    err.status = 400;
    throw err;
  }

  let changeAmount = 0;
  if (method === PAYMENT_METHODS.NAKIT && body.receivedAmount) {
    changeAmount = Math.max(
      Math.round((body.receivedAmount - amount) * 100) / 100,
      0
    );
  }

  ticket.paidTotal = Math.round((ticket.paidTotal + amount) * 100) / 100;
  ticket.history.push({
    action: "odeme_alindi",
    actorId: session.sub,
    detail: `${method} · ${amount}`,
  });

  const fullyPaid = ticket.paidTotal >= ticket.grandTotal - 0.01;

  if (fullyPaid) {
    ticket.status = TICKET_STATUS.KAPANDI;
    ticket.closedAt = new Date();
    ticket.history.push({ action: "adisyon_kapatildi", actorId: session.sub });
  }

  // Ödeme kaydı, adisyon güncellemesi ve masa durumu güncellemesi birbirinden bağımsız
  // yazma işlemleridir — paralel çalıştırılır (tek tek beklemek yerine).
  const writes = [
    Payment.create({
      ticketId,
      branchId,
      shiftId: openShift._id,
      method,
      amount,
      receivedAmount: body.receivedAmount ?? null,
      changeAmount,
      processedBy: session.sub,
    }),
    ticket.save(),
  ];

  if (ticket.tableId) {
    writes.push(
      Table.findByIdAndUpdate(
        ticket.tableId,
        fullyPaid
          ? { status: TABLE_STATUS.BOS, currentTicketId: null, mergedGroupId: null }
          : { status: TABLE_STATUS.ODEME_BEKLIYOR }
      )
    );
  }

  const [payment] = await Promise.all(writes);

  return jsonOk({ payment, ticket, fullyPaid, changeAmount }, { status: 201 });
});
