// Bir vardiya/gün için ciro, ödeme yöntemi kırılımı ve kasa mutabakatını hesaplayan
// ortak fonksiyon. Hem "vardiyayı kapat" (Z-Raporu) akışında hem de raporlar
// ekranındaki geçmiş kayıtlarda kullanılır ki hesaplama mantığı tek yerde kalsın.

import Payment from "@/models/Payment";
import CashMovement from "@/models/CashMovement";
import Ticket from "@/models/Ticket";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

export async function buildShiftReport(shift, { closingCashCounted } = {}) {
  const [payments, cashMovements] = await Promise.all([
    Payment.find({ shiftId: shift._id }).lean(),
    CashMovement.find({ shiftId: shift._id }).lean(),
  ]);

  const totalsByMethod = {};
  let totalRevenue = 0;
  for (const p of payments) {
    totalsByMethod[p.method] = (totalsByMethod[p.method] || 0) + p.amount;
    totalRevenue += p.amount;
  }

  const cashIn = cashMovements
    .filter((m) => m.type === "giris")
    .reduce((s, m) => s + m.amount, 0);
  const cashOut = cashMovements
    .filter((m) => m.type === "cikis")
    .reduce((s, m) => s + m.amount, 0);

  const cashSales = totalsByMethod.nakit || 0;
  const expectedCash =
    Math.round((shift.openingCash + cashSales + cashIn - cashOut) * 100) / 100;

  const hasCounted = closingCashCounted !== undefined && closingCashCounted !== null;
  const finalCounted = hasCounted ? closingCashCounted : expectedCash;
  const difference = Math.round((finalCounted - expectedCash) * 100) / 100;

  const dateRange = {
    $gte: shift.openedAt,
    ...(shift.closedAt ? { $lte: shift.closedAt } : {}),
  };

  const ticketsClosedCount = await Ticket.countDocuments({
    branchId: shift.branchId,
    closedAt: dateRange,
    status: "kapandi",
  });

  const [voidAgg, compAgg] = await Promise.all([
    Ticket.aggregate([
      { $match: { branchId: shift.branchId, openedAt: dateRange } },
      { $unwind: "$items" },
      { $match: { "items.isVoided": true } },
      { $count: "count" },
    ]),
    Ticket.aggregate([
      { $match: { branchId: shift.branchId, openedAt: dateRange } },
      { $unwind: "$items" },
      { $match: { "items.isComp": true } },
      { $count: "count" },
    ]),
  ]);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalsByMethod,
    totalsByMethodLabeled: Object.fromEntries(
      Object.entries(totalsByMethod).map(([k, v]) => [PAYMENT_METHOD_LABELS[k] || k, v])
    ),
    cashIn,
    cashOut,
    openingCash: shift.openingCash,
    expectedCash,
    closingCashCounted: finalCounted,
    difference,
    ticketsClosedCount,
    voidCount: voidAgg[0]?.count || 0,
    compCount: compAgg[0]?.count || 0,
    paymentCount: payments.length,
    generatedAt: new Date(),
  };
}
