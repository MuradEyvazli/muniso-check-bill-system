import connectDB from "@/lib/db";
import Shift from "@/models/Shift";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { buildShiftReport } from "@/lib/shiftReport";

export const POST = withApi("shifts:close", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);
  const shift = await Shift.findById(params.id);
  if (!shift) {
    const err = new Error("Vardiya bulunamadı");
    err.status = 404;
    throw err;
  }
  if (shift.status !== "acik") {
    const err = new Error("Vardiya zaten kapalı");
    err.status = 400;
    throw err;
  }

  const report = await buildShiftReport(shift, {
    closingCashCounted: body.closingCashCounted,
  });

  shift.status = "kapali";
  shift.closedBy = session.sub;
  shift.closedAt = new Date();
  shift.closingCashCounted = report.closingCashCounted;
  shift.expectedCash = report.expectedCash;
  shift.difference = report.difference;
  shift.zReportSnapshot = report;

  await shift.save();

  return jsonOk({ shift });
});
