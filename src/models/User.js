const mongoose = require("mongoose");
const { ROLES } = require("../lib/constants");

const UserSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    branchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
    name: { type: String, required: true, trim: true },
    surname: { type: String, default: "", trim: true },
    username: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, default: null },
    pinCodeHash: { type: String, default: null },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.GARSON,
    },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ restaurantId: 1, username: 1 }, { unique: true });

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
