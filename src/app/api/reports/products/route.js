import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import Payment from "@/models/Payment";
import { withApi, jsonOk, resolveBranchId } from "@/lib/apiUtils";
import { istanbulDayRange } from "@/lib/businessDay";

// Bir ürün satırının gerçek tahsil edilen tutarı — ikram (comp) ise 0, ürün bazlı
// indirim varsa düşülmüş hali. TicketPanel.js'teki aynı mantığın sunucu tarafı eşidir.
function lineRevenue(item) {
  const optionsTotal = (item.selectedOptions || []).reduce((s, o) => s + (o.priceDelta || 0), 0);
  const base = (item.unitPriceSnapshot + optionsTotal) * item.quantity;
  if (item.isComp) return 0;
  if (item.discount?.type === "percent") return base - (base * (item.discount.value || 0)) / 100;
  if (item.discount?.type === "amount") return base - Math.min(item.discount.value || 0, base);
  return base;
}

// "Porsiyon" opsiyon grubundan seçilen değer varsa (1 Porsiyon / 1,5 Porsiyon), ürünü
// bu varyanta göre ayrı bir satır olarak say — yoksa tek satırda toplanır.
function variantLabel(item) {
  const portionOption = (item.selectedOptions || []).find((o) => o.groupName === "Porsiyon");
  return portionOption ? portionOption.optionName : null;
}

// Ürün bazlı canlı satış dökümü — sadece o gün gerçekten ödemesi alınmış adisyonların
// ürünlerini sayar. Kapanma tarihine değil, ÖDEME (Payment) tarihine göre gruplanır —
// böylece "Tüm Raporları Sıfırla" (sadece Payment/Shift kayıtlarını siler) çalıştırıldığında
// bu rapor da otomatik olarak sıfırlanmış olur; aksi halde ödemesi silinmiş ama adisyonu hâlâ
// duran eski test siparişleri burada "satılmış" görünmeye devam ederdi.
export const GET = withApi("reports:today", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const url = new URL(req.url);
  const { date, start, end } = istanbulDayRange(url.searchParams.get("date"));

  const payments = await Payment.find({
    branchId,
    createdAt: { $gte: start, $lt: end },
  })
    .select("ticketId")
    .lean();

  const ticketIds = [...new Set(payments.map((p) => String(p.ticketId)))];
  const tickets = ticketIds.length
    ? await Ticket.find({ _id: { $in: ticketIds } }).select("items").lean()
    : [];

  const map = new Map();
  let totalQuantity = 0;
  let totalRevenue = 0;

  for (const ticket of tickets) {
    for (const item of ticket.items) {
      if (item.isVoided) continue;
      const variant = variantLabel(item);
      const key = `${item.productId}::${variant || ""}`;
      const revenue = Math.round(lineRevenue(item) * 100) / 100;

      const entry = map.get(key) || {
        productId: String(item.productId),
        name: item.nameSnapshot,
        variant,
        quantity: 0,
        revenue: 0,
      };
      entry.quantity += item.quantity;
      entry.revenue = Math.round((entry.revenue + revenue) * 100) / 100;
      map.set(key, entry);

      totalQuantity += item.quantity;
      totalRevenue += revenue;
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);

  return jsonOk({
    date,
    rows,
    totalQuantity,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    ticketCount: tickets.length,
  });
});
