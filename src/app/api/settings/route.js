import connectDB from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import Branch from "@/models/Branch";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";

export const GET = withApi(null, async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const [branch, restaurant] = await Promise.all([
    Branch.findById(branchId).lean(),
    Restaurant.findById(session.restaurantId).lean(),
  ]);
  return jsonOk({ restaurant, branch });
});

export const PATCH = withApi("settings:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);

  const restaurantUpdate = {};
  if ("name" in (body.restaurant || {})) restaurantUpdate.name = body.restaurant.name;
  if ("brandColors" in (body.restaurant || {})) restaurantUpdate.brandColors = body.restaurant.brandColors;

  const branchUpdate = {};
  if ("name" in (body.branch || {})) branchUpdate.name = body.branch.name;
  if ("address" in (body.branch || {})) branchUpdate.address = body.branch.address;
  if ("phone" in (body.branch || {})) branchUpdate.phone = body.branch.phone;

  // Haftanın günlerine göre çalışma saatleri — Ayarlar ekranındaki yeni editörden gelir.
  // Basit şekil doğrulaması yapıyoruz (7 gün, geçerli saat/dakika formatı).
  if (Array.isArray(body.branch?.operatingHours)) {
    const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const cleaned = body.branch.operatingHours
      .filter((h) => h && typeof h.day === "number" && h.day >= 0 && h.day <= 6)
      .map((h) => ({
        day: h.day,
        isOpen: !!h.isOpen,
        openTime: timeRe.test(h.openTime) ? h.openTime : "11:00",
        closeTime: timeRe.test(h.closeTime) ? h.closeTime : "03:00",
      }));
    if (cleaned.length === 7) branchUpdate.operatingHours = cleaned;
  }

  if ("businessDayCutoffHour" in (body.branch || {})) {
    const n = Number(body.branch.businessDayCutoffHour);
    if (Number.isFinite(n) && n >= 0 && n <= 12) branchUpdate.businessDayCutoffHour = n;
  }

  const [restaurant, branch] = await Promise.all([
    Object.keys(restaurantUpdate).length
      ? Restaurant.findByIdAndUpdate(session.restaurantId, restaurantUpdate, { new: true })
      : Restaurant.findById(session.restaurantId),
    Object.keys(branchUpdate).length
      ? Branch.findByIdAndUpdate(branchId, branchUpdate, { new: true })
      : Branch.findById(branchId),
  ]);

  return jsonOk({ restaurant, branch });
});
