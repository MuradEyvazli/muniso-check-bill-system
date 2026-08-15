import connectDB from "@/lib/db";
import User from "@/models/User";
import { withApi, jsonOk, parseBody, resolveBranchId } from "@/lib/apiUtils";
import { hashSecret } from "@/lib/auth/password";
import { ROLES } from "@/lib/constants";

export const GET = withApi("users:manage", async (req, ctx, session) => {
  await connectDB();
  const users = await User.find({ restaurantId: session.restaurantId })
    .select("-passwordHash -pinCodeHash -refreshTokenHash")
    .sort({ createdAt: 1 })
    .lean();
  return jsonOk({ users });
});

export const POST = withApi("users:manage", async (req, ctx, session) => {
  await connectDB();
  const branchId = resolveBranchId(req, session);
  const body = await parseBody(req);

  if (!body.name || !body.username || !body.password || !body.pin || !body.role) {
    const err = new Error("Ad, kullanıcı adı, şifre, PIN ve rol gerekli");
    err.status = 400;
    throw err;
  }
  if (!Object.values(ROLES).includes(body.role)) {
    const err = new Error("Geçersiz rol");
    err.status = 400;
    throw err;
  }
  if (String(body.pin).length < 4) {
    const err = new Error("PIN en az 4 haneli olmalı");
    err.status = 400;
    throw err;
  }
  if (String(body.password).length < 6) {
    const err = new Error("Şifre en az 6 karakter olmalı");
    err.status = 400;
    throw err;
  }

  const username = body.username.trim().toLowerCase();
  const existing = await User.findOne({ restaurantId: session.restaurantId, username });
  if (existing) {
    const err = new Error("Bu kullanıcı adı zaten kullanılıyor");
    err.status = 409;
    throw err;
  }

  const [passwordHash, pinCodeHash] = await Promise.all([
    hashSecret(body.password),
    hashSecret(String(body.pin)),
  ]);

  const user = await User.create({
    restaurantId: session.restaurantId,
    branchIds: [branchId],
    name: body.name,
    surname: body.surname || "",
    username,
    passwordHash,
    pinCodeHash,
    role: body.role,
  });

  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  delete safeUser.pinCodeHash;
  delete safeUser.refreshTokenHash;

  return jsonOk({ user: safeUser }, { status: 201 });
});
