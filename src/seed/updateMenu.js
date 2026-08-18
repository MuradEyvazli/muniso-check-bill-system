/* eslint-disable no-console */
// SADECE menüyü (kategori/ürün/opsiyon grubu) günceller — src/seed/data/yeganePilavciMenu.js
// dosyasındaki içerikle DB'deki menüyü eşitler. Tam seed.js'in aksine salon, masa,
// kullanıcı, vardiya veya adisyona HİÇ dokunmaz. Restoran/şube zaten var olmalı
// (yani en az bir kere normal seed çalıştırılmış olmalı).
//
// Kullanım:  npm run update-menu

const connectDB = require("../lib/db");
const Restaurant = require("../models/Restaurant");
const Branch = require("../models/Branch");
const { seedMenu } = require("./menuSeeder");

const RESTAURANT_SLUG = "yegane-pilavcisi";

async function run() {
  await connectDB();
  console.log("MongoDB bağlantısı kuruldu.\n");

  const restaurant = await Restaurant.findOne({ slug: RESTAURANT_SLUG });
  if (!restaurant) {
    throw new Error(
      `Restoran bulunamadı (slug: ${RESTAURANT_SLUG}). Önce normal seed (npm run seed) çalıştırılmış olmalı.`
    );
  }
  const branch = await Branch.findOne({ restaurantId: restaurant._id, name: "Merkez Şube" });
  if (!branch) {
    throw new Error("Şube bulunamadı (Merkez Şube).");
  }

  console.log(`Şube bulundu: ${branch.name} (${branch._id})`);
  console.log(
    "NOT: Bu script SADECE menüyü günceller. Salon, masa, kullanıcı, açık adisyon " +
      "ve vardiyalara dokunmaz.\n"
  );

  await seedMenu(branch._id);

  console.log("\nMenü güncelleme tamamlandı.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Menü güncelleme hatası:", err);
  process.exit(1);
});
