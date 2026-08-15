import { withApi, jsonOk } from "@/lib/apiUtils";

export const GET = withApi(null, async (req, ctx, session) => {
  return jsonOk({ user: session });
});
