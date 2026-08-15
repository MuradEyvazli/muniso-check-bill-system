import connectDB from "@/lib/db";
import Shift from "@/models/Shift";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";

// Yanlışlıkla kapatılan/hatalı bir gün kaydını silmek için — geri alınamaz bir
// işlem olduğundan hesap şifresine ek olarak bir silme şifresi de ister. Kod
// içinde sabit tutulmaz, .env'den okunur (REPORTS_RESET_PASSWORD).
const DELETE_PASSWORD = process.env.REPORTS_RESET_PASSWORD || "1234";

export const DELETE = withApi("reports:manage", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);

  if (String(body.confirmPassword || "") !== DELETE_PASSWORD) {
    const err = new Error("Silme şifresi yanlış");
    err.status = 403;
    throw err;
  }

  const shift = await Shift.findById(params.id);
  if (!shift) {
    const err = new Error("Kayıt bulunamadı");
    err.status = 404;
    throw err;
  }
  if (shift.status !== "kapali") {
    const err = new Error("Sadece kapanmış gün kayıtları silinebilir");
    err.status = 400;
    throw err;
  }

  await Shift.deleteOne({ _id: shift._id });
  return jsonOk({ deleted: true });
});
