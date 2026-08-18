/* eslint-disable no-console */
const connectDB = require("../lib/db");
const { hashSecret } = require("../lib/auth/password");
const { ROLES } = require("../lib/constants");

const Restaurant = require("../models/Restaurant");
const Branch = require("../models/Branch");
const User = require("../models/User");
const Hall = require("../models/Hall");
const Table = require("../models/Table");

const menu = require("./data/yeganePilavciMenu");
const { seedMenu } = require("./menuSeeder");

const RESTAURANT_NAME = process.env.SEED_RESTAURANT_NAME || "Yegane Pilav";
const RESTAURANT_SLUG = "yegane-pilavcisi";

// Güvenlik: hiçbir kullanıcı şifresi/PIN'i kod içinde sabit değer olarak durmaz —
// hepsi .env dosyasından okunur. .env'de eksikse seed işlemi başlamadan durur
// (bkz. aşağıdaki doğrulama), böylece kimse yanlışlıkla bilinen bir şifreyle
// canlıya kullanıcı oluşturmaz.
const DEMO_USERS = [
  {
    role: ROLES.ADMIN,
    name: "Yönetici",
    surname: "",
    username: process.env.SEED_ADMIN_USERNAME || "admin",
    password: process.env.SEED_ADMIN_PASSWORD,
    pin: process.env.SEED_ADMIN_PIN,
  },
  {
    role: ROLES.KASIYER,
    name: "Kasiyer",
    surname: "Demo",
    username: process.env.SEED_KASIYER_USERNAME || "kasiyer1",
    password: process.env.SEED_KASIYER_PASSWORD,
    pin: process.env.SEED_KASIYER_PIN,
  },
  {
    role: ROLES.GARSON,
    name: "Garson",
    surname: "Demo",
    username: process.env.SEED_GARSON_USERNAME || "garson1",
    password: process.env.SEED_GARSON_PASSWORD,
    pin: process.env.SEED_GARSON_PIN,
  },
];

function assertDemoCredentialsConfigured() {
  const missing = DEMO_USERS.filter((u) => !u.password || !u.pin).map((u) => u.username);
  if (missing.length > 0) {
    throw new Error(
      `Şu kullanıcılar için şifre/PIN .env dosyasında tanımlı değil: ${missing.join(", ")}. ` +
        "SEED_ADMIN_PASSWORD/PIN, SEED_KASIYER_PASSWORD/PIN, SEED_GARSON_PASSWORD/PIN " +
        "değerlerini .env dosyanıza ekleyin (.env.example'a bakın). " +
        "Güvenlik nedeniyle şifreler kod içinde sabit tutulmuyor."
    );
  }
}

async function upsertRestaurant() {
  let restaurant = await Restaurant.findOne({ slug: RESTAURANT_SLUG });
  if (!restaurant) {
    restaurant = await Restaurant.create({
      name: RESTAURANT_NAME,
      slug: RESTAURANT_SLUG,
      brandColors: { primary: "#7B1E2B", gold: "#C9A227" },
      currency: "TRY",
    });
    console.log(`✓ Restoran oluşturuldu: ${restaurant.name}`);
  } else {
    console.log(`• Restoran zaten mevcut: ${restaurant.name}`);
  }
  return restaurant;
}

async function upsertBranch(restaurantId) {
  let branch = await Branch.findOne({ restaurantId, name: "Merkez Şube" });
  if (!branch) {
    branch = await Branch.create({
      restaurantId,
      name: "Merkez Şube",
      address: "Tunalı Mah. Balören Sok. No: 4/A",
      phone: "0545 170 72 80 / 0536 996 54 84",
    });
    console.log(`✓ Şube oluşturuldu: ${branch.name}`);
  } else {
    console.log(`• Şube zaten mevcut: ${branch.name}`);
  }
  return branch;
}

// Kat planı (salon/masa) ve menü (kategori/ürün/opsiyon) tamamen bu script'in kaynağı olan
// veriye göre YENİDEN OLUŞTURULUR. Böylece Bahçe/Üst Kat gibi eski salonlar veya eski menü
// kalıntıları DB'de kalmaz. Restoran / şube / kullanıcılar bundan etkilenmez (idempotent).
async function resetHallsAndTables(branchId) {
  const oldHalls = await Hall.countDocuments({ branchId });
  const oldTables = await Table.countDocuments({ branchId });
  await Table.deleteMany({ branchId });
  await Hall.deleteMany({ branchId });
  if (oldHalls || oldTables) {
    console.log(`• Eski kat planı temizlendi (${oldHalls} salon, ${oldTables} masa)`);
  }
}

async function seedHallsAndTables(branchId) {
  await resetHallsAndTables(branchId);
  const hallMap = new Map();
  for (const hallDef of menu.halls) {
    const hall = await Hall.create({
      branchId,
      name: hallDef.name,
      order: hallDef.order,
    });
    hallMap.set(hallDef.name, hall);
    console.log(`✓ Salon oluşturuldu: ${hall.name}`);

    const tables = [];
    for (let i = 1; i <= hallDef.tableCount; i += 1) {
      tables.push({
        branchId,
        hallId: hall._id,
        name: `${hallDef.name.slice(0, 1)}${i}`,
        capacity: 4,
        position: { x: ((i - 1) % 7) * 130, y: Math.floor((i - 1) / 7) * 130 },
      });
    }
    await Table.insertMany(tables);
    console.log(`  ↳ ${tables.length} masa eklendi (${hall.name})`);
  }
  return hallMap;
}

async function seedUsers(restaurantId, branchId) {
  for (const def of DEMO_USERS) {
    const existing = await User.findOne({ restaurantId, username: def.username });
    if (existing) {
      console.log(`• Kullanıcı zaten mevcut: ${def.username}`);
      continue;
    }
    const passwordHash = await hashSecret(def.password);
    const pinCodeHash = await hashSecret(def.pin);
    await User.create({
      restaurantId,
      branchIds: [branchId],
      name: def.name,
      surname: def.surname,
      username: def.username,
      passwordHash,
      pinCodeHash,
      role: def.role,
    });
    console.log(`✓ Kullanıcı oluşturuldu: ${def.username} (${def.role})`);
  }
}

async function run() {
  assertDemoCredentialsConfigured();

  await connectDB();
  console.log("MongoDB bağlantısı kuruldu.\n");

  const restaurant = await upsertRestaurant();
  const branch = await upsertBranch(restaurant._id);
  await seedHallsAndTables(branch._id);
  await seedUsers(restaurant._id, branch._id);
  await seedMenu(branch._id);

  console.log("\n--- Giriş Bilgileri ---");
  for (const u of DEMO_USERS) {
    console.log(`${u.role.padEnd(8)} → kullanıcı: ${u.username} / şifre: ${u.password} / PIN: ${u.pin}`);
  }
  console.log("\nSeed tamamlandı.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed hatası:", err);
  process.exit(1);
});
