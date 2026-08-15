import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk, resolveBranchId } from "@/lib/apiUtils";
import { BUSINESS_TIMEZONE } from "@/lib/businessDay";

// Geçmiş günlerin ciro + ortalama masada oturma süresi özeti (İstanbul takvim
// gününe göre gruplanır) — raporlar ekranındaki "Geçmiş Günler" listesi ve aylık
// karşılaştırma tablosu bunu kullanır.
export const GET = withApi("reports:view", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 60, 365);
  const branchObjectId = new mongoose.Types.ObjectId(branchId);

  const [revenueRows, sittingRows] = await Promise.all([
    Payment.aggregate([
      { $match: { branchId: branchObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: BUSINESS_TIMEZONE } },
          totalRevenue: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
          ticketIds: { $addToSet: "$ticketId" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: limit },
    ]),
    Ticket.aggregate([
      { $match: { branchId: branchObjectId, orderType: "masa", status: "kapandi", closedAt: { $ne: null } } },
      {
        $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$closedAt", timezone: BUSINESS_TIMEZONE } },
          minutes: { $divide: [{ $subtract: ["$closedAt", "$openedAt"] }, 60000] },
        },
      },
      { $group: { _id: "$day", avgMinutes: { $avg: "$minutes" }, count: { $sum: 1 } } },
    ]),
  ]);

  const sittingMap = new Map(sittingRows.map((r) => [r._id, r]));

  return jsonOk({
    days: revenueRows.map((r) => {
      const sitting = sittingMap.get(r._id);
      return {
        date: r._id,
        totalRevenue: Math.round(r.totalRevenue * 100) / 100,
        paymentCount: r.paymentCount,
        orderCount: r.ticketIds.length,
        avgSittingMinutes: sitting ? Math.round(sitting.avgMinutes) : null,
        tableSessionCount: sitting?.count || 0,
      };
    }),
  });
});
