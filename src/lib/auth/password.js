const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

async function hashSecret(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function compareSecret(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

module.exports = { hashSecret, compareSecret };
