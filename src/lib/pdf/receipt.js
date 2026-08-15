import PDFDocument from "pdfkit";
import path from "path";
import { PAYMENT_METHOD_LABELS, ORDER_TYPE_LABELS } from "@/lib/constants";

// DejaVu Sans Mono: Türkçe karakterleri (ı, İ, ş, ğ, ö, ü, ç) doğru gösteren,
// standart PDF fontlarının (Helvetica/Courier) desteklemediği geniş Unicode kapsamına sahip
// açık kaynak monospace font. 80mm termal fiş görünümü için karakter hizalı sütunlar kurulur.
const FONT_DIR = path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf");
const FONT_REGULAR = path.join(FONT_DIR, "DejaVuSansMono.ttf");
const FONT_BOLD = path.join(FONT_DIR, "DejaVuSansMono-Bold.ttf");

const PAGE_WIDTH = 226.77; // 80mm, punto cinsinden (1mm ≈ 2.8346pt)
const MARGIN = 12;
const CHARS_PER_LINE = 40;
const BODY_SIZE = 8;
const SMALL_SIZE = 7;
const LINE_HEIGHT = 11;

function money(n) {
  return `${Number(n || 0).toFixed(2)} TL`;
}

function padTwoCol(left, right, width = CHARS_PER_LINE) {
  left = String(left);
  right = String(right);
  const space = width - left.length - right.length;
  if (space < 1) {
    const maxLeft = Math.max(width - right.length - 1, 0);
    return `${left.slice(0, maxLeft)} ${right}`;
  }
  return `${left}${" ".repeat(space)}${right}`;
}

const DIVIDER = "-".repeat(CHARS_PER_LINE);

function estimateHeight(ticket, payments, type, phoneLineCount = 1) {
  let lines = 10 + phoneLineCount; // başlık + tarih/no/tip bloğu (+ telefon satırları)
  for (const item of ticket.items) {
    lines += 1;
    if (item.selectedOptions?.length) lines += item.selectedOptions.length;
    if (item.note) lines += 1;
    if (item.isVoided) lines += 1;
    if (item.isComp) lines += 1;
  }
  lines += 5; // ara toplam / indirim / servis / toplam / ayraç
  if (type === "payment") lines += (payments?.length || 0) * 2 + 2;
  else lines += 1;
  lines += 4; // footer
  return Math.max(280, lines * LINE_HEIGHT + MARGIN * 2 + 30);
}

/**
 * 80mm termal fiş görünümünde bir PDF üretir (adisyon ön hesabı veya ödeme fişi).
 * type: "adisyon" (henüz ödenmemiş hesap) | "payment" (ödeme sonrası fiş)
 */
export function buildReceiptPdfBuffer({ restaurant, branch, table, ticket, payments = [], type }) {
  // Telefon alanı "0545 170 72 80 / 0536 996 54 84" gibi "/" veya "," ile ayrılmış
  // birden fazla numara içerebilir — her biri fişte kendi satırında gösterilir.
  const phones = (branch?.phone || "")
    .split(/[/,]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const height = estimateHeight(ticket, payments, type, phones.length || 1);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_WIDTH, height],
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont("mono", FONT_REGULAR);
      doc.registerFont("mono-bold", FONT_BOLD);

      doc.font("mono-bold").fontSize(12).text(restaurant?.name || "Muniso", { align: "center" });
      doc.font("mono").fontSize(SMALL_SIZE);
      if (branch?.address) doc.text(branch.address, { align: "center" });
      for (const p of phones) doc.text(p, { align: "center" });
      doc.moveDown(0.4);

      doc
        .font("mono-bold")
        .fontSize(10)
        .text(type === "payment" ? "ÖDEME FİŞİ" : "ADİSYON", { align: "center" });
      doc.moveDown(0.4);

      doc.font("mono").fontSize(BODY_SIZE);
      doc.text(`Tarih: ${new Date(ticket.openedAt).toLocaleString("tr-TR")}`);
      doc.text(`Adisyon No: #${ticket.ticketNo}`);
      doc.text(`Sipariş Tipi: ${ORDER_TYPE_LABELS[ticket.orderType] || ticket.orderType}`);
      if (table?.name) doc.text(`Masa: ${table.name}`);
      doc.text(DIVIDER);

      for (const item of ticket.items) {
        const optionsTotal = (item.selectedOptions || []).reduce(
          (s, o) => s + (o.priceDelta || 0),
          0
        );
        const lineBase = (item.unitPriceSnapshot + optionsTotal) * item.quantity;
        let lineFinal = lineBase;
        if (item.isComp) lineFinal = 0;
        else if (item.discount?.type === "percent") {
          lineFinal -= (lineBase * (item.discount.value || 0)) / 100;
        } else if (item.discount?.type === "amount") {
          lineFinal -= Math.min(item.discount.value || 0, lineBase);
        }

        doc.text(
          padTwoCol(`${item.quantity}x ${item.nameSnapshot}`, item.isVoided ? "İPTAL" : money(lineFinal))
        );
        for (const opt of item.selectedOptions || []) {
          doc.text(`   + ${opt.optionName}`);
        }
        if (item.note) doc.text(`   Not: ${item.note}`);
        if (item.isVoided) doc.text(`   [İPTAL: ${item.voidReason || "-"}]`);
        if (item.isComp) doc.text("   [İKRAM]");
      }

      doc.text(DIVIDER);
      doc.text(padTwoCol("Ara Toplam", money(ticket.subtotal)));
      if (ticket.discountTotal > 0) {
        doc.text(padTwoCol("İndirim", `-${money(ticket.discountTotal)}`));
      }
      if (ticket.serviceCharge > 0) {
        doc.text(padTwoCol("Servis", money(ticket.serviceCharge)));
      }
      doc.font("mono-bold").text(padTwoCol("TOPLAM", money(ticket.grandTotal)));
      doc.font("mono");

      if (type === "payment") {
        doc.text(DIVIDER);
        for (const p of payments) {
          doc.text(padTwoCol(PAYMENT_METHOD_LABELS[p.method] || p.method, money(p.amount)));
          if (p.changeAmount > 0) doc.text(padTwoCol("  Para Üstü", money(p.changeAmount)));
        }
        doc.text(padTwoCol("Ödenen", money(ticket.paidTotal)));
      } else {
        doc.text(padTwoCol("Kalan", money(Math.max(ticket.grandTotal - ticket.paidTotal, 0))));
      }

      doc.moveDown(0.6);
      doc.fontSize(SMALL_SIZE).text("Teşekkür ederiz, yine bekleriz!", { align: "center" });
      doc.text(`${restaurant?.name || ""}${branch?.name ? " · " + branch.name : ""}`, {
        align: "center",
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
