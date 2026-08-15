import connectDB from "@/lib/db";
import Customer from "@/models/Customer";
import Ticket from "@/models/Ticket";
import { withApi, jsonOk } from "@/lib/apiUtils";

export const GET = withApi("customers:manage", async (req, ctx, session) => {
  await connectDB();
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone") || "";
  if (phone.length < 3) return jsonOk({ customers: [] });

  const customers = await Customer.find({
    restaurantId: session.restaurantId,
    phone: { $regex: phone.replace(/\D/g, ""), $options: "i" },
  })
    .limit(10)
    .lean();

  const withHistory = await Promise.all(
    customers.map(async (c) => {
      const orderHistory = await Ticket.find({ customerId: c._id })
        .sort({ openedAt: -1 })
        .limit(10)
        .select("ticketNo grandTotal status openedAt orderType")
        .lean();
      return { ...c, orderHistory };
    })
  );

  return jsonOk({ customers: withHistory });
});
