// Adisyon toplamlarını yeniden hesaplayan ortak fonksiyon.
// Tüm ticket route'ları bu fonksiyonu kullanır ki toplam mantığı tek yerde kalsın.

import { TICKET_STATUS } from "@/lib/constants";

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function recalcTicketTotals(ticket) {
  let subtotal = 0;
  let discountTotal = 0;

  for (const item of ticket.items) {
    if (item.isVoided) continue;
    const optionsTotal = (item.selectedOptions || []).reduce(
      (sum, o) => sum + (o.priceDelta || 0),
      0
    );
    const lineBase = (item.unitPriceSnapshot + optionsTotal) * item.quantity;

    let lineDiscount = 0;
    if (item.isComp) {
      lineDiscount = lineBase;
    } else if (item.discount?.type === "percent") {
      lineDiscount = (lineBase * (item.discount.value || 0)) / 100;
    } else if (item.discount?.type === "amount") {
      lineDiscount = Math.min(item.discount.value || 0, lineBase);
    }

    subtotal += lineBase;
    discountTotal += lineDiscount;
  }

  ticket.subtotal = round2(subtotal);
  ticket.discountTotal = round2(discountTotal);
  ticket.grandTotal = round2(
    subtotal - discountTotal + (ticket.serviceCharge || 0)
  );
}

export function hasActiveItems(ticket) {
  return ticket.items.some((item) => !item.isVoided);
}

// Bir masaya bağlı adisyondaki tüm ürünler silinir/void edilirse ve hiç ödeme
// alınmamışsa, masa "dolu" durumunda takılı kalmasın diye adisyonu otomatik
// iptal eder. Masa dokümanını güncellemek dönüş değeri true olduğunda
// çağıran route'un sorumluluğundadır (bu fonksiyon sadece ticket'ı değiştirir).
export function maybeAutoCloseEmptyTicket(ticket, session) {
  if (
    ticket.tableId &&
    ticket.status === TICKET_STATUS.ACIK &&
    ticket.paidTotal === 0 &&
    !hasActiveItems(ticket)
  ) {
    ticket.status = TICKET_STATUS.IPTAL;
    ticket.closedAt = new Date();
    ticket.history.push({
      action: "adisyon_bosaltildi",
      actorId: session?.sub,
      detail: "Tüm ürünler kaldırıldı, masa otomatik boşaltıldı",
    });
    return true;
  }
  return false;
}
