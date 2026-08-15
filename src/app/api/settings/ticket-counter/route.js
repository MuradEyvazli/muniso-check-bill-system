import connectDB from "@/lib/db";
import Counter from "@/models/Counter";
import { withApi, jsonOk, resolveBranchId } from "@/lib/apiUtils";

// Şu anki adisyon sayacının değerini döner (bir sonraki adisyon value+1 olacak).
// Ayarlar ekranında "sıfırlama gerçekten işe yaradı mı" sorusuna kesin bir
// cevap vermek için — kullanıcı tahmin etmek zorunda kalmasın, doğrudan
// veritabanındaki güncel değeri görsün.
export const GET = withApi("settings:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const counter = await Counter.findOne({ branchId, name: "ticketNo" }).lean();
  return jsonOk({ value: counter?.value ?? 0 });
});
