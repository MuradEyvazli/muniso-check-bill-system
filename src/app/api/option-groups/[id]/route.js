import connectDB from "@/lib/db";
import OptionGroup from "@/models/OptionGroup";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";

export const PATCH = withApi("menu:manage", async (req, { params }) => {
  await connectDB();
  const body = await parseBody(req);
  const group = await OptionGroup.findByIdAndUpdate(params.id, body, { new: true });
  if (!group) {
    const err = new Error("Opsiyon grubu bulunamadı");
    err.status = 404;
    throw err;
  }
  return jsonOk({ optionGroup: group });
});

export const DELETE = withApi("menu:manage", async (req, { params }) => {
  await connectDB();
  await OptionGroup.findByIdAndUpdate(params.id, { isActive: false });
  return jsonOk({ deleted: true });
});
