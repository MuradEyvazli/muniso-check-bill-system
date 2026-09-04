import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk, resolveBranchId } from "@/lib/apiUtils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { istanbulDayRange, getBusinessDayCutoffHour } from "@/lib/businessDay";

// Bugünün (İstanbul takvim günü) canlı ciro özeti — ana sayfa banner'ında ve raporlar
// ekranındaki "Bugün" kartında kullanılır. Vardiya açık/kapalı olmasından
// bağımsız olarak, o günkü tüm ödemeleri toplar.
export const GET = withApi("reports:today", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const cutoffHour = await getBusinessDayCutoffHour(branchId);
  const { date, start, end } = istanbulDayRange(undefined, cutoffHour);

  const payments = await Payment.find({
    branchId,
    createdAt: { $gte: start, $lt: end },
  }).lean();

  const totalsByMethod = {};
  let totalRevenue = 0;
  for (const p of payments) {
    totalsByMethod[p.method] = (totalsByMethod[p.method] || 0) + p.amount;
    totalRevenue += p.amount;
  }

  const ticketCount = await Ticket.countDocuments({
    branchId,
    closedAt: { $gte: start, $lt: end },
    status: "kapandi",
  });

  // Bugün ödemesi tamamlanıp kapanan masa adisyonlarının ortalama oturma süresi
  // (açılıştan ödemenin tamamlanmasına kadar geçen dakika).
  const sittingAgg = await Ticket.aggregate([
    {
      $match: {
        branchId: new mongoose.Types.ObjectId(branchId),
        orderType: "masa",
        status: "kapandi",
        closedAt: { $gte: start, $lt: end },
      },
    },
    {
      $project: {
        minutes: { $divide: [{ $subtract: ["$closedAt", "$openedAt"] }, 60000] },
      },
    },
    { $group: { _id: null, avgMinutes: { $avg: "$minutes" }, count: { $sum: 1 } } },
  ]);

  return jsonOk({
    date,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalsByMethod,
    totalsByMethodLabeled: Object.fromEntries(
      Object.entries(totalsByMethod).map(([k, v]) => [PAYMENT_METHOD_LABELS[k] || k, v])
    ),
    ticketCount,
    paymentCount: payments.length,
    avgSittingMinutes: sittingAgg[0] ? Math.round(sittingAgg[0].avgMinutes) : null,
    tableSessionCount: sittingAgg[0]?.count || 0,
  });
});
