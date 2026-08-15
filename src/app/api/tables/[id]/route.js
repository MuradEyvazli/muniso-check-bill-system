import connectDB from "@/lib/db";
import Table from "@/models/Table";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { TABLE_STATUS } from "@/lib/constants";

// Masa silme geri alınamaz bir işlem olduğundan bir silme şifresi ister. Kod
// içinde sabit tutulmaz, .env'den okunur (REPORTS_RESET_PASSWORD).
const DELETE_PASSWORD = process.env.REPORTS_RESET_PASSWORD || "1234";

export const GET = withApi("tables:view", async (req, { params }) => {
  await connectDB();
  const table = await Table.findById(params.id).lean();
  if (!table) {
    const err = new Error("Masa bulunamadı");
    err.status = 404;
    throw err;
  }
  const ticket = table.currentTicketId
    ? await Ticket.findById(table.currentTicketId)
        .populate("history.actorId", "name role")
        .lean()
    : null;
  return jsonOk({ table, ticket });
});

export const PATCH = withApi("tables:manage", async (req, { params }) => {
  await connectDB();
  const body = await parseBody(req);
  const table = await Table.findByIdAndUpdate(params.id, body, { new: true });
  if (!table) {
    const err = new Error("Masa bulunamadı");
    err.status = 404;
    throw err;
  }
  return jsonOk({ table });
});

export const DELETE = withApi("tables:manage", async (req, { params }) => {
  await connectDB();
  const body = await parseBody(req);

  if (String(body.confirmPassword || "") !== DELETE_PASSWORD) {
    const err = new Error("Silme şifresi yanlış");
    err.status = 403;
    throw err;
  }

  const table = await Table.findById(params.id);
  if (!table) {
    const err = new Error("Masa bulunamadı");
    err.status = 404;
    throw err;
  }
  if (table.currentTicketId || table.status !== TABLE_STATUS.BOS) {
    const err = new Error("Bu masada açık bir adisyon var — önce hesabı kapatın ya da masayı boşaltın");
    err.status = 400;
    throw err;
  }

  table.isActive = false;
  await table.save();
  return jsonOk({ deleted: true });
});
