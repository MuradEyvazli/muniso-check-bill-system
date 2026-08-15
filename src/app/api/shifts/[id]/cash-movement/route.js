import connectDB from "@/lib/db";
import Shift from "@/models/Shift";
import CashMovement from "@/models/CashMovement";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";

export const POST = withApi("shifts:cash-movement", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);
  if (!body.type || !body.amount || body.amount <= 0 || !body.reason) {
    const err = new Error("type, amount ve reason gerekli");
    err.status = 400;
    throw err;
  }

  const shift = await Shift.findById(params.id);
  if (!shift || shift.status !== "acik") {
    const err = new Error("Açık vardiya bulunamadı");
    err.status = 400;
    throw err;
  }

  const movement = await CashMovement.create({
    shiftId: shift._id,
    branchId: shift.branchId,
    type: body.type,
    amount: body.amount,
    reason: body.reason,
    createdBy: session.sub,
  });

  return jsonOk({ movement }, { status: 201 });
});
