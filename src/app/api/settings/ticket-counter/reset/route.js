import connectDB from "@/lib/db";
import Counter from "@/models/Counter";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";

// Adisyon numarası sayacını sıfırlar — bir sonraki açılan adisyon 1 numaradan
// başlar. Geçmiş adisyonların numaraları değişmez, sadece yeni sayaç 0'a
// çekilir. Kod içinde sabit tutulmaz, .env'den okunur (REPORTS_RESET_PASSWORD).
const RESET_PASSWORD = process.env.REPORTS_RESET_PASSWORD || "1234";

export const DELETE = withApi("settings:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);

  if (String(body.confirmPassword || "") !== RESET_PASSWORD) {
    const err = new Error("Silme şifresi yanlış");
    err.status = 403;
    throw err;
  }

  const counter = await Counter.findOneAndUpdate(
    { branchId, name: "ticketNo" },
    { $set: { value: 0 } },
    { upsert: true, new: true }
  );

  return jsonOk({ reset: true, value: counter.value });
});
