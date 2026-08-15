import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import Ticket from "@/models/Ticket";
import Table from "@/models/Table";
import { withApi, jsonOk, resolveBranchId } from "@/lib/apiUtils";
import { PAYMENT_METHOD_LABELS, ORDER_TYPE_LABELS } from "@/lib/constants";
import { istanbulDayRange } from "@/lib/businessDay";

// Belirli bir günün (varsayılan: bugün) tüm ödemelerini, hangi masada/siparişte,
// saat kaçta, ne sipariş edilerek oluştuğuyla birlikte tek tek listeler.
export const GET = withApi("reports:today", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const url = new URL(req.url);
  const { date, start, end } = istanbulDayRange(url.searchParams.get("date"));

  const payments = await Payment.find({
    branchId,
    createdAt: { $gte: start, $lt: end },
  })
    .sort({ createdAt: -1 })
    .lean();

  const ticketIds = [...new Set(payments.map((p) => String(p.ticketId)))];
  const tickets = ticketIds.length
    ? await Ticket.find({ _id: { $in: ticketIds } })
        .select("ticketNo orderType tableId items")
        .lean()
    : [];
  const ticketMap = new Map(tickets.map((t) => [String(t._id), t]));

  const tableIds = [...new Set(tickets.map((t) => t.tableId).filter(Boolean).map(String))];
  const tables = tableIds.length
    ? await Table.find({ _id: { $in: tableIds } }).select("name").lean()
    : [];
  const tableMap = new Map(tables.map((t) => [String(t._id), t.name]));

  const entries = payments.map((p) => {
    const ticket = ticketMap.get(String(p.ticketId));
    const items = (ticket?.items || [])
      .filter((i) => !i.isVoided)
      .map((i) => ({ name: i.nameSnapshot, quantity: i.quantity, unitPrice: i.unitPriceSnapshot }));

    const label = ticket?.tableId
      ? tableMap.get(String(ticket.tableId)) || "Masa"
      : ORDER_TYPE_LABELS[ticket?.orderType] || "Sipariş";

    return {
      paymentId: p._id,
      ticketId: p.ticketId,
      ticketNo: ticket?.ticketNo ?? null,
      label,
      orderType: ticket?.orderType ?? null,
      method: p.method,
      methodLabel: PAYMENT_METHOD_LABELS[p.method] || p.method,
      amount: p.amount,
      paidAt: p.createdAt,
      items,
    };
  });

  const totalRevenue = Math.round(entries.reduce((s, e) => s + e.amount, 0) * 100) / 100;

  return jsonOk({ date, entries, totalRevenue, count: entries.length });
});
