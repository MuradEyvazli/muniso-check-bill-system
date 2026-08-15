import connectDB from "@/lib/db";
import Hall from "@/models/Hall";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";

export const PATCH = withApi("tables:manage", async (req, { params }) => {
  await connectDB();
  const body = await parseBody(req);
  const hall = await Hall.findByIdAndUpdate(params.id, body, { new: true });
  if (!hall) {
    const err = new Error("Salon bulunamadı");
    err.status = 404;
    throw err;
  }
  return jsonOk({ hall });
});

export const DELETE = withApi("tables:manage", async (req, { params }) => {
  await connectDB();
  await Hall.findByIdAndUpdate(params.id, { isActive: false });
  return jsonOk({ deleted: true });
});
