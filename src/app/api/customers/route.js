import connectDB from "@/lib/db";
import Customer from "@/models/Customer";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";

export const GET = withApi("customers:manage", async (req) => {
  await connectDB();
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit"), 10) || 50, 200);
  const customers = await Customer.find({})
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
  return jsonOk({ customers });
});

export const POST = withApi("customers:manage", async (req, ctx, session) => {
  await connectDB();
  const body = await parseBody(req);
  if (!body.phone) {
    const err = new Error("Telefon numarası gerekli");
    err.status = 400;
    throw err;
  }

  const restaurantId = session.restaurantId;
  let customer = await Customer.findOne({ restaurantId, phone: body.phone.trim() });

  if (customer) {
    if (body.name) customer.name = body.name;
    if (body.address) {
      customer.addresses.push({
        label: body.address.label || "Adres",
        addressText: body.address.addressText,
        note: body.address.note || "",
        isDefault: customer.addresses.length === 0,
      });
    }
    await customer.save();
  } else {
    customer = await Customer.create({
      restaurantId,
      phone: body.phone.trim(),
      name: body.name || "",
      addresses: body.address
        ? [
            {
              label: body.address.label || "Adres",
              addressText: body.address.addressText,
              note: body.address.note || "",
              isDefault: true,
            },
          ]
        : [],
    });
  }

  return jsonOk({ customer }, { status: 201 });
});
