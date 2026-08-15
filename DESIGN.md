# Muniso — Tasarım Dokümanı (v1)

Restoran POS / adisyon sistemi. İlk müşteri: **Yegane Pilavcısı** (Eskişehir).
Stack: Next.js (App Router) + JS + Tailwind + MongoDB/Mongoose + JWT (HTTP-only cookie) + Polling.

---

## 1. Çok-Kiracılı (Multi-Tenant) Model

Her operasyonel kayıt `restaurantId` + `branchId` ile scope'lanır. Şu an tek restoran/tek şube
çalışsa da tüm sorgular bu iki alana göre filtrelenir, böylece yeni bir restoran eklemek
sadece yeni bir `Restaurant`/`Branch` dokümanı + kullanıcı demek olur.

```
Restaurant (Yegane Pilavcısı)
  └─ Branch (Merkez Şube)
       ├─ Hall (Salon, Bahçe, Üst Kat)
       │    └─ Table
       ├─ Category → Product → OptionGroup
       ├─ Ticket (adisyon)
       ├─ Shift (kasa)
       ├─ Customer
       └─ PrinterConfig
```

## 2. Mongoose Modelleri

**Restaurant** — `name, slug, logoUrl, brandColors{primary,gold}, currency, timezone, isActive`

**Branch** — `restaurantId, name, address, phone, isActive`

**User** — `restaurantId, branchIds[], name, surname, username, passwordHash, pinCodeHash,
role (admin|kasiyer|garson|mutfak), isActive, refreshTokenHash, lastLoginAt`
- Şifre: admin/kasiyer web login. PIN: ortak terminalde hızlı giriş (4 haneli, hash'li).

**Hall** (Salon) — `branchId, name, order, isActive`

**Table** (Masa) — `branchId, hallId, name, capacity, position{x,y},
status (bos|dolu|odeme_bekliyor), currentTicketId, mergedGroupId`
- `mergedGroupId`: birleştirilen masalar aynı grup id'sini paylaşır, tek adisyon üzerinden yönetilir.

**Category** — `branchId, name, order, isActive`

**Product** (Ürün) — `branchId, categoryId, name, description, images[], prepStation
(mutfak|bar|tatli), prices{salon, paket, gelAl, marketplace}, optionGroupIds[],
stockStatus (acik|kapali), isActive`

**OptionGroup** — `branchId, name (Ekstra Tavuk, Sos, Porsiyon), selectionType (single|multiple),
isRequired, options[{name, priceDelta}]`
- Ürünlere referansla bağlanır, yeniden kullanılabilir (ör. "Sos" grubu birçok üründe).

**Ticket** (Adisyon) — `branchId, orderType (masa|paket|gel_al), tableId, hallId, mergedGroupId,
customerId, waiterId, status (acik|kapandi|iptal), items[TicketItem],
subtotal, discountTotal, serviceCharge, grandTotal, paidTotal,
history[{action, actorId, detail, at}], openedAt, closedAt`

**TicketItem** (subdoc) — `productId, nameSnapshot, unitPriceSnapshot, quantity,
selectedOptions[{groupName, optionName, priceDelta}], note,
discount{type(percent|amount), value}, isComp(ikram), isVoided, voidReason,
prepStation, kdsStatus (yeni|hazirlaniyor|hazir), addedBy, addedAt`

**Payment** — `ticketId, branchId, shiftId, method (nakit|kredi_karti|yemek_karti_multinet|
yemek_karti_sodexo|yemek_karti_ticket), amount, receivedAmount, changeAmount,
processedBy, createdAt`
- Bir tickete birden çok Payment kaydı → split/partial ödeme.

**Shift** (Kasa) — `branchId, openedBy, openedAt, openingCash, closedBy, closedAt,
closingCashCounted, expectedCash, difference, cashMovements[], status (acik|kapali),
zReportSnapshot{}`

**CashMovement** (subdoc/collection) — `shiftId, type (giris|cikis), amount, reason, createdBy, createdAt`

**Customer** — `restaurantId, phone (indexed, unique per restaurant), name,
addresses[{label, addressText, note, isDefault}], createdAt`

**MarketplaceOrder** — `branchId, provider (yemeksepeti|getir|trendyol|mock), externalOrderId,
rawPayload, mappedTicketId, status (alindi|isleniyor|hata), receivedAt`

**PrinterConfig** — `branchId, name, role (mutfak|kasa), connectionType (network|usb),
ip, port, paperWidth (58|80), prepStations[]`

Yardımcı (DB dışı): `lib/permissions.js` içinde rol → izin matrisi (DB tablosu değil, kod).

---

## 3. Klasör Yapısı

```
muniso/
├── README.md
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.js  (brand: burgundy #7B1E2B, gold #C9A227, black)
├── jsconfig.json
├── public/logo/
├── src/
│   ├── app/
│   │   ├── layout.js, globals.css
│   │   ├── login/page.js              (şifre + PIN giriş)
│   │   ├── (pos)/                     (korumalı alan, middleware ile)
│   │   │   ├── layout.js              (sidebar/topbar, vardiya durumu)
│   │   │   ├── masalar/page.js        (kat planı: salonlar + masa grid'i)
│   │   │   ├── masalar/[tableId]/page.js  (adisyon ekranı)
│   │   │   ├── paket/page.js          (paket servis siparişleri + adres defteri)
│   │   │   ├── gel-al/page.js
│   │   │   ├── mutfak/page.js         (KDS — Faz 2)
│   │   │   ├── kasa/page.js           (vardiya aç/kapa, nakit giriş-çıkış)
│   │   │   ├── menu-yonetimi/page.js  (kategori/ürün/opsiyon/stok)
│   │   │   ├── musteriler/page.js
│   │   │   ├── raporlar/page.js       (Faz 3)
│   │   │   └── ayarlar/page.js        (yazıcılar, salon/masa düzeni, kullanıcılar)
│   │   └── api/
│   │       ├── auth/{login,pin-login,refresh,logout}/route.js
│   │       ├── halls/route.js  |  halls/[id]/route.js
│   │       ├── tables/route.js |  tables/[id]/route.js
│   │       │      tables/[id]/merge/route.js | move/route.js
│   │       ├── categories/route.js | products/route.js | option-groups/route.js
│   │       ├── tickets/route.js | tickets/[id]/route.js
│   │       │      tickets/[id]/items/route.js | items/[itemId]/route.js
│   │       │      tickets/[id]/split/route.js | close/route.js
│   │       ├── payments/route.js
│   │       ├── shifts/route.js | shifts/[id]/close/route.js | cash-movement/route.js
│   │       ├── customers/route.js | customers/search/route.js
│   │       ├── reports/{revenue,best-sellers,heatmap,payments,waiters,voids}/route.js
│   │       ├── kds/route.js
│   │       └── marketplace/webhook/[provider]/route.js
│   ├── components/
│   │   ├── ui/ (Button, Modal, Badge, TapCard…)
│   │   ├── floor-plan/, order-ticket/, kds/, menu/, reports/
│   ├── models/            (Mongoose şemaları — yukarıdaki liste)
│   ├── lib/
│   │   ├── db.js, auth/, permissions.js, constants.js
│   │   ├── printing/ (escpos.js, printerClient.js)
│   │   └── marketplace/ (adapterInterface.js, adapters/{mock,yemeksepeti,getir,trendyol}.js)
│   ├── hooks/ (usePolling, useAuth, useTicket…)
│   ├── middleware.js
│   └── seed/ (seed.js, data/yeganePilavciMenu.js)
└── print-agent/            (bağımsız Node/Express servisi — USB/ağ üzerinden ESC/POS)
    ├── package.json, index.js, lib/escposEncoder.js, README.md
```

---

## 4. Faz Planı (onay checkpoint'li)

**Faz 1 — Çekirdek Operasyon**
Proje iskeleti, tüm Mongoose modelleri, JWT+PIN auth, rol/izin middleware, seed script
(Yegane Pilavcısı gerçek pilav menüsü + demo kullanıcılar), kat planı UI, adisyon ekranı
(ekle/çıkar, not, modifier, indirim, ikram, void), masa birleştirme/taşıma/hesap bölme,
sipariş tipleri (masa/paket/gel-al) + müşteri adres defteri, ödeme (nakit/kart/yemek kartı,
split, kısmi, para üstü), kasa (vardiya aç/kapa, nakit giriş-çıkış), temel menü yönetimi UI.

**Faz 2 — Mutfak & Yazdırma**
KDS ekranı (yeni/hazırlanıyor/hazır, polling), ESC/POS soyutlama katmanı, print-agent
(bağımsız Node servisi), mutfak fişi/adisyon/ödeme fişi şablonları, istasyon bazlı yazdırma.

**Faz 3 — Raporlama & Entegrasyon**
Raporlar (günlük/haftalık/aylık ciro, çok satan ürün, saatlik ısı haritası, ödeme yöntemi
kırılımı, garson performansı, iptal/ikram raporu), marketplace adapter arayüzü + mock adapter
+ webhook + otomatik adisyon/yazdırma, müşteri kayıtları ekranının tamamlanması, ayarlar
(yazıcı config, kullanıcı yönetimi).

Her fazın sonunda kısa bir demo/özet ile onayınızı alıp bir sonrakine geçeceğim.

---

## 5. Netleştirilen Kararlar

- Real-time: **Polling** (KDS ve masa durumu için ~3-5 sn aralıklı fetch).
- DB: Kod + `.env.example` ile `MONGODB_URI` placeholder; canlı bağlantıyı siz kurarsınız.
- Auth: Web login (kullanıcı adı/şifre) admin/kasiyer için, PIN hızlı giriş ortak terminallerde.
- Print agent gerçek donanımla test edilemez (sandbox'ta fiziksel yazıcı yok) — kod ve arayüz
  eksiksiz teslim edilir, ESC/POS komut çıktısı simülasyon/log modunda doğrulanır.
