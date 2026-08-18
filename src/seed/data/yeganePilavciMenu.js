// Yegane Pilav — güncel tam menü (seed verisi).
// Kaynak: Yegane Pilav resmi fiyat listesi PDF'i, 05.08.2026 tarihinden itibaren geçerli.
// Sıralama PDF'deki sırayla birebir aynıdır.
//
// portion15Price: PDF'deki "1,5 Porsiyon" fiyatı. Doluysa, ürüne otomatik olarak
// "Porsiyon" adında bir opsiyon grubu eklenir (1 Porsiyon / 1,5 Porsiyon), fiyat farkı
// price ile portion15Price arasındaki farktan otomatik hesaplanır (bkz. menuSeeder.js).
//
// Not: Stok adedi takip edilmiyor — tüm ürünler sınırsız kabul edilir, açık/kapalı durumu
// sadece Menü Yönetimi ekranından elle değiştirilir.

module.exports = {
  // Bahçe ve Üst Kat kaldırıldı: tek salon, 14 masa.
  halls: [{ name: "Salon", order: 0, tableCount: 14 }],

  optionGroups: [],

  categories: [
    {
      name: "Pilav Üstü Lezzetler",
      description:
        "Her soslu porsiyon 350 g tereyağlı pilav + 150 g tavuk — turşu, mevsim yeşillikleri ve meze ile.",
      products: [
        {
          name: "Sade Pilav",
          description: "Tereyağlı basmati pirinç pilav, turşu ve mevsim yeşillikleri ile.",
          calories: 560,
          proteinGrams: 9,
          price: 120,
          compareAtPrice: 150,
          portion15Price: 180,
        },
        {
          name: "Nohut & Pilav",
          description: "Nohutlu tereyağlı pilav, turşu ve mevsim yeşillikleri ile.",
          calories: 685,
          proteinGrams: 17,
          price: 130,
          portion15Price: 190,
        },
        {
          name: "Mısırlı Ton Balığı & Pilav",
          description: "100 g ton balığı, taze mısır ve limonlu sos — 350 g pilav üzerinde.",
          calories: 770,
          proteinGrams: 40,
          price: 285,
          portion15Price: 400,
        },
        {
          name: "Tavuklu Pilav",
          description: "150 g haşlanmış taze tavuk göğsü, 350 g tereyağlı pilav üzerinde.",
          calories: 810,
          proteinGrams: 56,
          price: 195,
          compareAtPrice: 220,
          portion15Price: 270,
        },
        {
          name: "Soya Soslu Tavuk & Pilav",
          description: "Soya sosu, sarımsak ve zencefil ile — 150 g tavuk, 350 g tereyağlı pilav üzerinde.",
          calories: 835,
          proteinGrams: 57,
          price: 245,
          portion15Price: 375,
        },
        {
          name: "Köri Soslu Tavuk & Pilav",
          description: "Hint baharatlarıyla köri sos — 150 g tavuk, 350 g tereyağlı pilav üzerinde.",
          calories: 875,
          proteinGrams: 56,
          price: 245,
          portion15Price: 375,
        },
        {
          name: "Meksika Soslu Tavuk & Pilav",
          description: "Chipotle, jalapeño ve domates ile Meksika usulü — 150 g tavuk, 350 g pilav üzerinde.",
          calories: 875,
          proteinGrams: 58,
          price: 245,
          portion15Price: 375,
        },
        {
          name: "Barbekü Soslu Tavuk & Pilav",
          description: "Dumanlı barbekü sos — 150 g tavuk, 350 g tereyağlı pilav üzerinde.",
          calories: 880,
          proteinGrams: 56,
          price: 245,
          portion15Price: 375,
        },
        {
          name: "Peri Peri Soslu Tavuk & Pilav",
          description: "Portekiz usulü acı-baharatlı peri peri sos — 150 g tavuk, 350 g pilav üzerinde.",
          calories: 895,
          proteinGrams: 57,
          price: 245,
          portion15Price: 375,
          badge: "Yeni",
        },
        {
          name: "Sweet Chili Soslu Tavuk & Pilav",
          description: "Tatlı-acı Asya biberi sosu — 150 g tavuk, 350 g tereyağlı pilav üzerinde.",
          calories: 900,
          proteinGrams: 56,
          price: 245,
          portion15Price: 375,
        },
        {
          name: "Ranch Soslu Tavuk & Pilav",
          description: "Krema, dereotu ve sarımsaklı ranch sos — 150 g tavuk, 350 g pilav üzerinde.",
          calories: 935,
          proteinGrams: 57,
          price: 245,
          portion15Price: 375,
        },
        {
          name: "Pesto Soslu Tavuk & Pilav",
          description: "Taze fesleğen pesto sos — 150 g tavuk, 350 g tereyağlı pilav üzerinde.",
          calories: 955,
          proteinGrams: 60,
          price: 245,
          portion15Price: 375,
        },
        {
          name: "Cafe de Paris Soslu Tavuk & Pilav",
          description: "Tereyağı, kapari ve otlu Cafe de Paris sos — 150 g tavuk, 350 g pilav üzerinde.",
          calories: 960,
          proteinGrams: 56,
          price: 245,
          portion15Price: 375,
        },
        {
          name: "Çetos Soslu Kremalı Tavuklu Pilav",
          description: "150 g tavuk, çetos + cheddar kremalı özel sos — bizim imza lezzetimiz.",
          calories: 970,
          proteinGrams: 60,
          price: 275,
          portion15Price: 400,
          badge: "Şefin Spesiyali",
        },
      ],
    },
    {
      name: "Kilo ile Lezzetler",
      description: "Toplu sipariş ve paket servis için kilogram bazlı seçenekler",
      products: [
        {
          name: "Sade Pilav (1 kg)",
          description: "Tereyağlı basmati pirinç pilav, 1 kilogram.",
          calories: 1400,
          proteinGrams: 26,
          price: 300,
        },
        {
          name: "Nohut & Pilav (1 kg)",
          description: "Nohutlu tereyağlı pilav, 1 kilogram.",
          calories: 1400,
          proteinGrams: 47,
          price: 330,
        },
        {
          name: "Tavuklu Pilav (1 kg)",
          description: "700 g pilav + 300 g haşlanmış tavuk. Yaklaşık 2 kişilik.",
          calories: 1630,
          proteinGrams: 111,
          price: 400,
          compareAtPrice: 440,
        },
        {
          name: "Soslu Tavuk & Pilav (1 kg)",
          description: "700 g pilav + 300 g soslu tavuk. Sos seçimi ile.",
          calories: 1750,
          proteinGrams: 111,
          price: 450,
          compareAtPrice: 520,
        },
      ],
    },
    {
      name: "Kovada Pilav",
      description: "Mevsim yeşillikleri, meze ve turşu ile birlikte tek kovada servis",
      products: [
        {
          name: "Kovada Pilav",
          description: "350 g pilav, mevsim yeşillikleri, meze, turşu, mısır, ceviz ile.",
          calories: 750,
          proteinGrams: 14,
          price: 240,
        },
        {
          name: "Kovada Tiftik Tavuk & Pilav",
          description: "350 g pilav + 120 g lif lif ayrılmış tiftik tavuk.",
          calories: 765,
          proteinGrams: 46,
          price: 280,
        },
        {
          name: "Kovada Soslu Tavuk & Pilav",
          description: "350 g pilav + 175 g soslu tavuk, premium sunum.",
          calories: 920,
          proteinGrams: 64,
          price: 320,
        },
      ],
    },
    {
      name: "Ekstra Tavuk",
      description: "Porsiyonunuza ekstra tavuk ekleyin",
      products: [
        {
          name: "Haşlanmış Tavuk (50g)",
          description: "Herhangi bir yemeğe 50g haşlanmış tavuk ekleme.",
          calories: 55,
          proteinGrams: 11,
          price: 50,
        },
        {
          name: "Soslu Tavuk (50g)",
          description: "Herhangi bir yemeğe 50g soslu tavuk ekleme.",
          calories: 80,
          proteinGrams: 11,
          price: 80,
        },
      ],
    },
    {
      name: "İçecekler",
      prepStation: "bar",
      description: "Soğuk servis içecek seçenekleri",
      products: [
        {
          name: "Ayran Küçük",
          description: "Soğuk servis ayran, küçük boy.",
          calories: 60,
          proteinGrams: 3,
          price: 40,
        },
        {
          name: "Ayran Büyük",
          description: "Soğuk servis ayran, büyük boy.",
          calories: 105,
          proteinGrams: 5,
          price: 60,
        },
        {
          name: "Kola / Fanta / Sprite (Cam Şişe)",
          description: "Cam şişe — Coca Cola, Fanta portakal veya Sprite.",
          calories: 140,
          proteinGrams: 0,
          price: 65,
        },
        {
          name: "Kola / Fanta / Sprite (Kutu 330ml)",
          description: "330ml kutu — Coca Cola, Fanta veya Sprite.",
          calories: 139,
          proteinGrams: 0,
          price: 90,
        },
        {
          name: "Fuse Tea (330ml)",
          description: "Soğuk çay, 330ml.",
          calories: 55,
          proteinGrams: 0,
          price: 90,
        },
        {
          name: "Maden Suyu (330ml)",
          description: "Soğuk maden suyu, 330ml.",
          calories: 0,
          proteinGrams: 0,
          price: 35,
        },
        {
          name: "Su (500ml)",
          description: "Şişe içme suyu, 500ml.",
          calories: 0,
          proteinGrams: 0,
          price: 20,
        },
      ],
    },
  ],
};
