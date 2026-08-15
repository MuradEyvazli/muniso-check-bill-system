import connectDB from "@/lib/db";
import OptionGroup from "@/models/OptionGroup";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";

export const GET = withApi(null, async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const groups = await OptionGroup.find({ branchId, isActive: true }).lean();
  return jsonOk({ optionGroups: groups });
});

export const POST = withApi("menu:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);
  if (!body.name || !Array.isArray(body.options) || body.options.length === 0) {
    const err = new Error("Grup adı ve en az bir opsiyon gerekli");
    err.status = 400;
    throw err;
  }
  const group = await OptionGroup.create({
    branchId,
    name: body.name,
    selectionType: body.selectionType || "single",
    isRequired: !!body.isRequired,
    options: body.options,
  });
  return jsonOk({ optionGroup: group }, { status: 201 });
});
