import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import Table from "@/models/Table";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { recalcTicketTotals, maybeAutoCloseEmptyTicket } from "@/lib/ticketCalc";
import { can } from "@/lib/permissions";
import { adjustProductStock } from "@/lib/stock";
import { TABLE_STATUS } from "@/lib/constants";

// Adisyon boşaldıysa (tüm ürünler kaldırıldı, ödeme yok) bağlı masayı da boşalt.
async function freeTableIfEmptied(ticket, session) {
  const freed = maybeAutoCloseEmptyTicket(ticket, session);
  if (freed && ticket.tableId) {
    await Table.findByIdAndUpdate(ticket.tableId, {
      status: TABLE_STATUS.BOS,
      currentTicketId: null,
      mergedGroupId: null,
    });
  }
  return freed;
}

function findItem(ticket, itemId) {
  const item = ticket.items.id(itemId);
  if (!item) {
    const err = new Error("Ürün satırı bulunamadı");
    err.status = 404;
    throw err;
  }
  return item;
}

export const PATCH = withApi(null, async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);

  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }
  const item = findItem(ticket, params.itemId);

  // Aksiyona göre gerekli izni kontrol et.
  if (("isVoided" in body) && body.isVoided) {
    if (!can(session.role, "tickets:void")) {
      const err = new Error("Void yetkiniz yok");
      err.status = 403;
      throw err;
    }
    if (!body.voidReason) {
      const err = new Error("Void gerekçesi zorunlu");
      err.status = 400;
      throw err;
    }
    item.isVoided = true;
    item.voidReason = body.voidReason;
    ticket.history.push({
      action: "urun_iptal",
      actorId: session.sub,
      detail: `${item.nameSnapshot}: ${body.voidReason}`,
    });
  }

  if ("isComp" in body) {
    if (!can(session.role, "tickets:comp")) {
      const err = new Error("İkram yetkiniz yok");
      err.status = 403;
      throw err;
    }
    item.isComp = !!body.isComp;
    ticket.history.push({
      action: "ikram",
      actorId: session.sub,
      detail: `${item.nameSnapshot} ${item.isComp ? "ikram edildi" : "ikram kaldırıldı"}`,
    });
  }

  if ("discount" in body) {
    if (!can(session.role, "tickets:discount")) {
      const err = new Error("İndirim yetkiniz yok");
      err.status = 403;
      throw err;
    }
    item.discount = body.discount;
    ticket.history.push({
      action: "indirim",
      actorId: session.sub,
      detail: `${item.nameSnapshot}: ${JSON.stringify(body.discount)}`,
    });
  }

  if ("quantity" in body || "note" in body) {
    if (!can(session.role, "tickets:edit-items")) {
      const err = new Error("Düzenleme yetkiniz yok");
      err.status = 403;
      throw err;
    }
    if ("quantity" in body && body.quantity > 0 && !item.isVoided) {
      const delta = item.quantity - body.quantity; // pozitifse azaltılıyor (stok iade), negatifse artırılıyor (stok düş)
      if (delta !== 0) {
        await adjustProductStock(item.productId, delta);
      }
      item.quantity = body.quantity;
    }
    if ("note" in body) item.note = body.note;
  }

  if ("kdsStatus" in body) {
    if (!can(session.role, "kds:update-status")) {
      const err = new Error("Mutfak durumu güncelleme yetkiniz yok");
      err.status = 403;
      throw err;
    }
    item.kdsStatus = body.kdsStatus;
  }

  recalcTicketTotals(ticket);
  await freeTableIfEmptied(ticket, session);
  await ticket.save();

  return jsonOk({ ticket });
});

export const DELETE = withApi("tickets:edit-items", async (req, { params }, session) => {
  await connectDB();
  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }
  const item = findItem(ticket, params.itemId);
  const name = item.nameSnapshot;

  // Void edilmemiş bir ürün tamamen siliniyorsa (mutfağa gitmeden vazgeçildiyse) stoğu iade et.
  if (!item.isVoided) {
    await adjustProductStock(item.productId, item.quantity);
  }

  item.deleteOne();

  ticket.history.push({
    action: "urun_silindi",
    actorId: session.sub,
    detail: name,
  });

  recalcTicketTotals(ticket);
  await freeTableIfEmptied(ticket, session);
  await ticket.save();

  return jsonOk({ ticket });
});
