import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";

export const GET = withApi("tickets:view", async (req, { params }) => {
  await connectDB();
  const ticket = await Ticket.findById(params.id)
    .populate("history.actorId", "name role")
    .lean();
  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }
  return jsonOk({ ticket });
});

export const PATCH = withApi("tickets:edit-items", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);
  const allowedFields = ["customerId", "deliveryAddress", "serviceCharge", "waiterId"];
  const update = {};
  for (const key of allowedFields) {
    if (key in body) update[key] = body[key];
  }
  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    const err = new Error("Adisyon bulunamadı");
    err.status = 404;
    throw err;
  }
  Object.assign(ticket, update);
  ticket.history.push({
    action: "adisyon_guncellendi",
    actorId: session.sub,
    detail: Object.keys(update).join(", "),
  });
  await ticket.save();
  return jsonOk({ ticket });
});
