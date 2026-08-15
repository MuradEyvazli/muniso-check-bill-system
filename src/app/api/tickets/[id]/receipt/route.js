import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import Table from "@/models/Table";
import Branch from "@/models/Branch";
import Restaurant from "@/models/Restaurant";
import Payment from "@/models/Payment";
import { withApi } from "@/lib/apiUtils";
import { buildReceiptPdfBuffer } from "@/lib/pdf/receipt";

export const GET = withApi("tickets:view", async (req, { params }) => {
  await connectDB();

  const ticket = await Ticket.findById(params.id).lean();
  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }

  const url = new URL(req.url);
  const requestedType = url.searchParams.get("type");
  const type = requestedType || (ticket.status === "kapandi" ? "payment" : "adisyon");

  const [branch, table, payments] = await Promise.all([
    Branch.findById(ticket.branchId).lean(),
    ticket.tableId ? Table.findById(ticket.tableId).lean() : null,
    type === "payment" ? Payment.find({ ticketId: ticket._id }).sort({ createdAt: 1 }).lean() : [],
  ]);
  const restaurant = branch ? await Restaurant.findById(branch.restaurantId).lean() : null;

  const pdfBuffer = await buildReceiptPdfBuffer({
    restaurant,
    branch,
    table,
    ticket,
    payments,
    type,
  });

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="adisyon-${ticket.ticketNo}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
});
