import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import Shift from "@/models/Shift";
import CashMovement from "@/models/CashMovement";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";

// Yanlışlıkla değil, bilinçli bir "her şeyi baştan başlat" işlemi için — bir
// silme şifresi ister. Kod içinde sabit tutulmaz, .env'den okunur (REPORTS_RESET_PASSWORD).
const RESET_PASSWORD = process.env.REPORTS_RESET_PASSWORD || "1234";

// Şubenin TÜM satış/rapor geçmişini kalıcı olarak siler: ödemeler, vardiya
// (Z-raporu) kayıtları ve nakit hareketleri. Sanki hiç satış yapılmamış gibi
// sıfırlar. Masalar, adisyonlar ve menü bundan etkilenmez — sadece ciro/rapor
// geçmişi temizlenir. Geri alınamaz.
export const DELETE = withApi("reports:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);

  if (String(body.confirmPassword || "") !== RESET_PASSWORD) {
    const err = new Error("Silme şifresi yanlış");
    err.status = 403;
    throw err;
  }

  const [payments, shifts, cashMovements] = await Promise.all([
    Payment.deleteMany({ branchId }),
    Shift.deleteMany({ branchId }),
    CashMovement.deleteMany({ branchId }),
  ]);

  return jsonOk({
    reset: true,
    deletedPayments: payments.deletedCount,
    deletedShifts: shifts.deletedCount,
    deletedCashMovements: cashMovements.deletedCount,
  });
});
