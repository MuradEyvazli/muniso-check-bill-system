/* eslint-disable no-console */
// Menü (kategori/ürün/opsiyon grubu) oluşturma mantığı — hem tam seed.js hem de
// menü-only güncelleme script'i (updateMenu.js) tarafından paylaşılır. Böylece
// iki yerde aynı mantık tekrar edilmez, tek doğru kaynak burasıdır.

const Category = require("../models/Category");
const Product = require("../models/Product");
const OptionGroup = require("../models/OptionGroup");

const menu = require("./data/yeganePilavciMenu");

// Sadece menüyü temizler — salon, masa, kullanıcı, vardiya, adisyon gibi hiçbir
// şeye dokunmaz. Geçmiş adisyonlar ürün adı/fiyatını "snapshot" olarak kendi
// içinde sakladığı için (nameSnapshot/unitPriceSnapshot), ürünlerin silinip
// yeniden oluşturulması geçmiş fişleri/raporları bozmaz.
async function resetMenu(branchId) {
  const oldCategories = await Category.countDocuments({ branchId });
  const oldProducts = await Product.countDocuments({ branchId });
  const oldOptionGroups = await OptionGroup.countDocuments({ branchId });
  await Product.deleteMany({ branchId });
  await Category.deleteMany({ branchId });
  await OptionGroup.deleteMany({ branchId });
  if (oldCategories || oldProducts || oldOptionGroups) {
    console.log(
      `• Eski menü temizlendi (${oldCategories} kategori, ${oldProducts} ürün, ${oldOptionGroups} opsiyon grubu)`
    );
  }
}

// menu.optionGroups içindeki (birden çok üründe paylaşılan) adlandırılmış opsiyon
// gruplarını oluşturur. Şu an menü verisinde boş — ürüne özel "Porsiyon" grupları
// aşağıda seedCategoriesAndProducts içinde ayrıca, her ürün için tek tek oluşturulur.
async function seedNamedOptionGroups(branchId) {
  const groupMap = new Map();
  for (const def of menu.optionGroups) {
    const group = await OptionGroup.create({
      branchId,
      name: def.name,
      selectionType: def.selectionType,
      isRequired: def.isRequired,
      showWhen: def.showWhen || undefined,
      options: def.options,
    });
    groupMap.set(def.name, group);
    console.log(`✓ Opsiyon grubu oluşturuldu: ${group.name}`);
  }
  return groupMap;
}

async function createProduct(branchId, category, catDef, productDef, productOrder, namedOptionGroupMap) {
  const optionGroupIds = (productDef.optionGroups || [])
    .map((name) => namedOptionGroupMap.get(name)?._id)
    .filter(Boolean);

  const price = productDef.price ?? 0;

  // 1 Porsiyon / 1,5 Porsiyon: her ürünün fiyat farkı farklı olduğu için
  // paylaşılan bir grup yerine ürüne özel bir "Porsiyon" grubu oluşturulur.
  if (productDef.portion15Price != null) {
    const delta = Math.round((productDef.portion15Price - price) * 100) / 100;
    const portionGroup = await OptionGroup.create({
      branchId,
      name: "Porsiyon",
      selectionType: "single",
      isRequired: false,
      options: [
        { name: "1 Porsiyon", priceDelta: 0 },
        { name: "1,5 Porsiyon", priceDelta: delta },
      ],
    });
    optionGroupIds.push(portionGroup._id);
  }

  await Product.create({
    branchId,
    categoryId: category._id,
    name: productDef.name,
    description: productDef.description || "",
    prepStation: catDef.prepStation || "mutfak",
    prices: {
      salon: price,
      paket: price,
      gelAl: price,
      marketplace: price,
    },
    compareAtPrice: productDef.compareAtPrice || null,
    calories: productDef.calories ?? null,
    proteinGrams: productDef.proteinGrams ?? null,
    badge: productDef.badge || "",
    stockQuantity:
      productDef.stockQuantity === undefined ? null : productDef.stockQuantity,
    stockStatus: productDef.stockQuantity === 0 ? "kapali" : "acik",
    order: productOrder,
    optionGroupIds,
  });
}

async function seedCategoriesAndProducts(branchId, namedOptionGroupMap) {
  let categoryOrder = 0;
  for (const catDef of menu.categories) {
    const category = await Category.create({
      branchId,
      name: catDef.name,
      description: catDef.description || "",
      order: categoryOrder,
    });
    categoryOrder += 1;
    console.log(`✓ Kategori oluşturuldu: ${category.name}`);

    let productOrder = 0;
    for (const productDef of catDef.products) {
      await createProduct(branchId, category, catDef, productDef, productOrder, namedOptionGroupMap);
      productOrder += 1;
    }
    console.log(`  ↳ ${catDef.products.length} ürün eklendi (${category.name})`);
  }
}

async function seedMenu(branchId) {
  await resetMenu(branchId);
  const namedOptionGroupMap = await seedNamedOptionGroups(branchId);
  await seedCategoriesAndProducts(branchId, namedOptionGroupMap);
}


// Mevcut menüye DOKUNMADAN sadece eksik olanları ekler: adı zaten var olan ürünler,
// kategoriler ve opsiyon grupları olduğu gibi kalır (fiyat/stok/elle yapılan düzenlemeler
// korunur). Yeni ürün eklerken `npm run add-menu-items` bunu kullanır.
async function addMissingMenuItems(branchId) {
  const groupMap = new Map();
  for (const def of menu.optionGroups) {
    let group = await OptionGroup.findOne({ branchId, name: def.name, isActive: true });
    if (!group) {
      group = await OptionGroup.create({
        branchId,
        name: def.name,
        selectionType: def.selectionType,
        isRequired: def.isRequired,
        showWhen: def.showWhen || undefined,
        options: def.options,
      });
      console.log(`+ Opsiyon grubu eklendi: ${def.name}`);
    }
    groupMap.set(def.name, group);
  }

  let added = 0;
  for (const catDef of menu.categories) {
    let category = await Category.findOne({ branchId, name: catDef.name });
    if (!category) {
      const count = await Category.countDocuments({ branchId });
      category = await Category.create({
        branchId,
        name: catDef.name,
        description: catDef.description || "",
        order: count,
      });
      console.log(`+ Kategori eklendi: ${category.name}`);
    }
    let order = await Product.countDocuments({ branchId, categoryId: category._id });
    for (const productDef of catDef.products) {
      const exists = await Product.exists({ branchId, name: productDef.name });
      if (exists) continue;
      await createProduct(branchId, category, catDef, productDef, order, groupMap);
      order += 1;
      added += 1;
      console.log(`+ Ürün eklendi: ${productDef.name}`);
    }
  }
  console.log(`Toplam ${added} yeni ürün eklendi.`);
}

module.exports = {
  addMissingMenuItems,
  seedMenu,
  resetMenu,
  seedNamedOptionGroups,
  seedCategoriesAndProducts,
};
