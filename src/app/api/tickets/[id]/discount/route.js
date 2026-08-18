import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { recalcTicketTotals, round2 } from "@/lib/ticketCalc";
import { TICKET_STATUS } from "@/lib/constants";

const ALLOWED_TYPES = ["percent", "amount"];

// Adisyon seviyesinde tek seferlik manuel indirim ("tanıdık indirimi" gibi) —
// ürün bazlı indirimlerden bağımsız, ödeme ekranından uygulanır.
// İki mod desteklenir:
//   1) { type: "percent"|"amount", value, reason }  — doğrudan yüzde/tutar indirimi
//   2) { targetTotal, reason }                       — "yeni toplam bu olsun", fark otomatik hesaplanır
export const PATCH = withApi("tickets:discount", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);

  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }
  if (ticket.status !== TICKET_STATUS.ACIK) {
    const err = new Error("Kapalı adisyonda indirim değiştirilemez");
    err.status = 400;
    throw err;
  }

  const reason = String(body.reason || "").slice(0, 200);

  if ("targetTotal" in body) {
    // Önce mevcut manuel indirimi kaldırıp indirimsiz gerçek toplamı (baseline) buluyoruz,
    // sonra istenen yeni toplama ulaşmak için gereken indirim tutarını hesaplıyoruz.
    ticket.manualDiscount = { type: null, value: 0, reason: "" };
    recalcTicketTotals(ticket);
    const baseline = ticket.grandTotal;

    const target = Number(body.targetTotal);
    if (!Number.isFinite(target) || target < 0) {
      const err = new Error("Geçersiz tutar");
      err.status = 400;
      throw err;
    }
    if (target > baseline + 0.01) {
      const err = new Error(`Yeni toplam, mevcut tutardan (${baseline}) fazla olamaz`);
      err.status = 400;
      throw err;
    }

    const amountOff = round2(baseline - target);
    ticket.manualDiscount =
      amountOff > 0 ? { type: "amount", value: amountOff, reason } : { type: null, value: 0, reason: "" };
  } else {
    const type = body.type ?? null;
    if (type !== null && !ALLOWED_TYPES.includes(type)) {
      const err = new Error("Geçersiz indirim tipi");
      err.status = 400;
      throw err;
    }
    const value = Number(body.value) || 0;
    if (value < 0) {
      const err = new Error("İndirim miktarı negatif olamaz");
      err.status = 400;
      throw err;
    }
    if (type === "percent" && value > 100) {
      const err = new Error("İndirim yüzdesi 100'ü geçemez");
      err.status = 400;
      throw err;
    }
    ticket.manualDiscount = type ? { type, value, reason } : { type: null, value: 0, reason: "" };
  }

  recalcTicketTotals(ticket);

  // İndirim, o ana kadar alınmış ödemenin altına toplamı düşüremez.
  if (ticket.grandTotal < ticket.paidTotal - 0.01) {
    const err = new Error(
      `İndirim sonrası toplam (${ticket.grandTotal}), zaten alınan ödemeden (${ticket.paidTotal}) az olamaz`
    );
    err.status = 400;
    throw err;
  }

  const m = ticket.manualDiscount;
  ticket.history.push({
    action: "adisyon_indirimi",
    actorId: session.sub,
    detail: m?.type
      ? `${m.type === "percent" ? m.value + "%" : m.value + " ₺"} indirim${
          m.reason ? " — " + m.reason : ""
        } (yeni toplam: ${ticket.grandTotal})`
      : "Adisyon indirimi kaldırıldı",
  });

  await ticket.save();
  return jsonOk({ ticket });
});
