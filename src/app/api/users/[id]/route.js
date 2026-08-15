import connectDB from "@/lib/db";
import User from "@/models/User";
import { withApi, jsonOk, parseBody } from "@/lib/apiUtils";
import { hashSecret } from "@/lib/auth/password";
import { ROLES } from "@/lib/constants";

export const PATCH = withApi("users:manage", async (req, { params }, session) => {
  await connectDB();
  const body = await parseBody(req);

  const user = await User.findOne({ _id: params.id, restaurantId: session.restaurantId });
  if (!user) {
    const err = new Error("Kullanıcı bulunamadı");
    err.status = 404;
    throw err;
  }

  if (String(user._id) === session.sub) {
    if ("isActive" in body && !body.isActive) {
      const err = new Error("Kendi hesabınızı pasifleştiremezsiniz");
      err.status = 400;
      throw err;
    }
    if ("role" in body && body.role !== ROLES.ADMIN) {
      const err = new Error("Kendi yöneticilik rolünüzü değiştiremezsiniz");
      err.status = 400;
      throw err;
    }
  }

  if ("name" in body) user.name = body.name;
  if ("surname" in body) user.surname = body.surname;
  if ("role" in body) {
    if (!Object.values(ROLES).includes(body.role)) {
      const err = new Error("Geçersiz rol");
      err.status = 400;
      throw err;
    }
    user.role = body.role;
  }
  if ("isActive" in body) user.isActive = !!body.isActive;
  if (body.password) {
    if (String(body.password).length < 6) {
      const err = new Error("Şifre en az 6 karakter olmalı");
      err.status = 400;
      throw err;
    }
    user.passwordHash = await hashSecret(body.password);
  }
  if (body.pin) {
    if (String(body.pin).length < 4) {
      const err = new Error("PIN en az 4 haneli olmalı");
      err.status = 400;
      throw err;
    }
    user.pinCodeHash = await hashSecret(String(body.pin));
  }

  await user.save();

  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  delete safeUser.pinCodeHash;
  delete safeUser.refreshTokenHash;

  return jsonOk({ user: safeUser });
});
