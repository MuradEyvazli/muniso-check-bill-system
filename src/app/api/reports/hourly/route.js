import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import Payment from "@/models/Payment";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { withApi, jsonOk, resolveBranchId } from "@/lib/apiUtils";
import { istanbulTodayStr } from "@/lib/businessDay";

const OFFSET_MS = 3 * 60 * 60 * 1000; // İstanbul UTC+3
const DRINK_CATEGORY = /i̇?çecek|icecek/i;

// Belirli bir tarih aralığında, her gün için SADECE verilen saat diliminde (ör. 11:00-15:00)
// ödemesi alınan adisyonlardaki tabak/ürün sayısını günlük kırılımla verir.
// Bir adisyon, o gün dilim içindeki İLK ödeme saatine göre bir kez sayılır.
export const GET = withApi("reports:today", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const url = new URL(req.url);
  const from = url.searchParams.get("from") || "2026-08-18";
  const to = url.searchParams.get("to") || istanbulTodayStr();
  const startHour = Math.min(Math.max(Number(url.searchParams.get("startHour") ?? 11), 0), 23);
  const endHour = Math.min(Math.max(Number(url.searchParams.get("endHour") ?? 15), 1), 24);

  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const rangeStart = new Date(Date.UTC(fy, fm - 1, fd) - OFFSET_MS);
  const rangeEnd = new Date(Date.UTC(ty, tm - 1, td + 1) - OFFSET_MS);
  if (!(rangeEnd > rangeStart) || rangeEnd - rangeStart > 366 * 86400000) {
    const err = new Error("Geçersiz tarih aralığı (en fazla 366 gün)");
    err.status = 400;
    throw err;
  }

  const payments = await Payment.find({
    branchId,
    createdAt: { $gte: rangeStart, $lt: rangeEnd },
  })
    .select("ticketId createdAt")
    .sort({ createdAt: 1 })
    .lean();

  // gün -> (ticketId set); saat dilimi dışındaki ödemeler elenir
  const dayTickets = new Map();
  for (const p of payments) {
    const local = new Date(p.createdAt.getTime() + OFFSET_MS);
    const h = local.getUTCHours();
    if (h < startHour || h >= endHour) continue;
    const day = local.toISOString().slice(0, 10);
    if (!dayTickets.has(day)) dayTickets.set(day, new Set());
    dayTickets.get(day).add(String(p.ticketId));
  }

  const allIds = [...new Set([...dayTickets.values()].flatMap((s) => [...s]))];
  const tickets = allIds.length
    ? await Ticket.find({ _id: { $in: allIds } }).select("items").lean()
    : [];
  const ticketMap = new Map(tickets.map((t) => [String(t._id), t]));

  // Ürün -> kategori (içecekleri "tabak"tan ayırmak için)
  const productIds = [...new Set(tickets.flatMap((t) => t.items.map((i) => String(i.productId))))];
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select("categoryId").lean()
    : [];
  const categories = await Category.find({ branchId }).select("name").lean();
  const catName = new Map(categories.map((c) => [String(c._id), c.name]));
  const isDrink = new Map(
    products.map((p) => [String(p._id), DRINK_CATEGORY.test(catName.get(String(p.categoryId)) || "")])
  );

  const productTotals = new Map();
  const days = [];
  let totalPlates = 0;
  let totalDrinks = 0;
  let totalTickets = 0;

  // Hiç satış olmayan günler de 0 olarak listelensin
  for (let t = Date.UTC(fy, fm - 1, fd); t <= Date.UTC(ty, tm - 1, td); t += 86400000) {
    const day = new Date(t).toISOString().slice(0, 10);
    const ids = [...(dayTickets.get(day) || [])];
    let plates = 0;
    let drinks = 0;
    for (const id of ids) {
      for (const item of ticketMap.get(id)?.items || []) {
        if (item.isVoided) continue;
        if (isDrink.get(String(item.productId))) {
          drinks += item.quantity;
        } else {
          plates += item.quantity;
          const e = productTotals.get(item.nameSnapshot) || { name: item.nameSnapshot, quantity: 0 };
          e.quantity += item.quantity;
          productTotals.set(item.nameSnapshot, e);
        }
      }
    }
    days.push({ date: day, plates, drinks, ticketCount: ids.length });
    totalPlates += plates;
    totalDrinks += drinks;
    totalTickets += ids.length;
  }

  return jsonOk({
    from,
    to,
    startHour,
    endHour,
    days,
    totalPlates,
    totalDrinks,
    totalTickets,
    products: Array.from(productTotals.values()).sort((a, b) => b.quantity - a.quantity),
  });
});
