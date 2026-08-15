# Muniso

Restoran POS / adisyon sistemi. İlk müşteri: **Yegane Pilavcısı** (Eskişehir).

Next.js (App Router, JavaScript) + Tailwind CSS + MongoDB/Mongoose + JWT (HTTP-only cookie) +
polling ile canlı güncellemeler. Çok kiracılı (multi-tenant) hazır veri modeli — tüm operasyonel
kayıtlar `restaurantId` / `branchId` ile scope'lanır.

Bu teslimat **Faz 1 + Faz 2'nin bir kısmını** kapsar: temel POS operasyonları ve 80mm PDF fiş
çıktısı uçtan uca çalışır durumdadır. Faz planı ve veri modeli detayları için `DESIGN.md`
dosyasına bakın.

## Neler var

- JWT + HTTP-only cookie auth, şifre ve PIN ile hızlı giriş, rol bazlı yetkilendirme
  (admin / kasiyer / garson / mutfak)
- Kat planı: tek salon, 14 masa, canlı masa durumu (boş / dolu / ödeme bekliyor),
  açık tutar ve geçen süre (polling ile ~3-4 sn'de bir güncellenir), banner'da özet istatistikler
- Menü: 7 kategori / 46 ürün (Pilav Üstü Lezzetler, Salatalar, Kilo ile Lezzetler, Kovada Pilav,
  Ekstra Tavuk, Tatlılar, İçecekler) — açıklama, kalori, protein, indirim rozeti ve günlük stok
  adedi ile
- Adisyon ekranı: ürün ekle/çıkar, adet, not, modifier/opsiyon, ürün bazlı indirim, ikram (comp),
  gerekçeli void, adisyon geçmişi
- Günlük stok takibi: ürüne stok adedi girildiğinde adisyona eklenince otomatik düşer, ürün
  silinince/iade edilince geri yüklenir, 0'a inince "Tükendi" olarak işaretlenir
- Masa birleştirme, adisyon taşıma, hesap bölme (eşit / ürüne göre)
- Sipariş tipleri: masa, paket servis (müşteri telefon/adres defteri ile), gel-al
- Ödeme: nakit, kredi kartı, yemek kartı (Multinet/Sodexo/Ticket), parçalı/kısmi ödeme,
  nakitte para üstü hesaplama
- **80mm PDF fiş**: ödeme tamamlandığında veya istendiğinde ("Fiş / Adisyon" butonu) adisyon
  gerçek bir termal yazıcı fişi gibi biçimlendirilmiş PDF olarak indirilir/yazdırılır — Türkçe
  karakterler (ı, İ, ş, ğ, ö, ü, ç) dahil doğru render edilir
- Kasa: vardiya aç/kapa, nakit giriş-çıkış, kapanışta otomatik Z-raporu
- Menü yönetimi: kategori (alt başlıklı), ürün (fiyat listeleri, indirim, kalori/protein, rozet,
  stok adedi), opsiyon grupları
- Basit mutfak ekranı (KDS): istasyona göre filtre, dokunarak durum ilerletme
  (yeni → hazırlanıyor → hazır)
- Seed script: tam Yegane Pilavcısı menüsü + demo kullanıcılar + salon/masa düzeni
  (her çalıştırıldığında kat planı ve menüyü sıfırlayıp yeniden kurar — bkz. aşağıdaki uyarı)

## Bilinçli olarak ertelenenler

- **Gerçek ESC/POS termal yazıcı entegrasyonu** (ağ/USB üzerinden doğrudan basma, print agent
  servisi): `print-agent/README.md` içinde mimari tanımlı. Şimdilik PDF fiş, tarayıcının
  yazdırma diyaloğu üzerinden termal yazıcıya da gönderilebilir; doğrudan ESC/POS komutlarıyla
  otomatik basma Faz 2'nin devamında teslim edilecek.
- **Raporlar ekranı** (ciro, çok satan ürün, saatlik yoğunluk, garson performansı vb.): Faz 3,
  `/raporlar` şu an yer tutucu.
- **Marketplace adaptörleri** (Yemeksepeti/Getir/Trendyol + mock adapter): Faz 3.
- **Ayarlar ekranı** (yazıcı config, kullanıcı yönetim arayüzü): Faz 2/3, şu an yer tutucu.
- **"Ürüne göre hesap böl"** ile oluşan yeni adisyonlar herhangi bir masaya bağlı değildir;
  ödemesi aynı oturumda (Hesap Böl ekranından) alınmalıdır. Sayfa yenilenirse bu adisyona
  ulaşmak için `GET /api/tickets?status=acik` kullanılabilir — ileride "Açık Adisyonlar"
  listesi eklenmesi önerilir.

## ⚠️ Seed script'i tekrar çalıştırmak hakkında

`npm run seed` her çalıştığında **salon/masa düzenini ve tüm menüyü (kategori, ürün, opsiyon
grubu) siler ve bu repodaki güncel veriyle yeniden oluşturur.** Restoran, şube ve kullanıcı
hesapları etkilenmez (idempotent). Eğer menü yönetimi ekranından elle ürün eklediyseniz ve seed'i
tekrar çalıştırırsanız, o elle eklenen ürünler silinir. Canlıya geçmeden önce menüyü doğrudan
`src/seed/data/yeganePilavciMenu.js` dosyasından güncelleyip seed'i tekrar çalıştırmanız,
prod ortamında ise seed'i sadece ilk kurulumda çalıştırmanız önerilir.

## Kurulum

```bash
npm install
cp .env.example .env
# .env içindeki MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET değerlerini doldurun
npm run seed   # Yegane Pilavcısı menüsü + demo kullanıcıları oluşturur (yukarıdaki uyarıyı okuyun)
npm run dev    # http://localhost:3000
```

Prodüksiyon derlemesi: `npm run build && npm start`.

### Demo giriş bilgileri (seed sonrası)

| Rol | Kullanıcı adı | Şifre | PIN |
|---|---|---|---|
| Yönetici | admin (veya `SEED_ADMIN_USERNAME`) | `.env`'deki `SEED_ADMIN_PASSWORD` | `.env`'deki `SEED_ADMIN_PIN` |
| Kasiyer | kasiyer1 | kasiyer123 | 1111 |
| Garson | garson1 | garson123 | 2222 |
| Mutfak | mutfak1 | mutfak123 | 3333 |

Giriş ekranında hem PIN hem şifre ile giriş desteklenir (ortak terminallerde hızlı PIN girişi
önerilir).

## Ortam değişkenleri

`.env.example` dosyasına bakın. Özetle:

- `MONGODB_URI` — MongoDB bağlantı adresi (Atlas veya kendi sunucunuz)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — üretimde mutlaka değiştirin
- `PRINT_AGENT_URL` — gerçek ESC/POS entegrasyonu tamamlandığında kullanılacak
- `SEED_*` — seed script'inin oluşturacağı yönetici hesabı bilgileri

## Klasör yapısı

```
src/
  app/
    login/                 — giriş ekranı
    (pos)/                 — korumalı POS alanı (middleware ile)
      masalar/              — kat planı + masa bazlı adisyon ekranı
      paket/, gel-al/        — masaya bağlı olmayan sipariş tipleri
      mutfak/                — mutfak ekranı (KDS)
      kasa/                  — vardiya ve Z-raporu
      menu-yonetimi/         — kategori/ürün/opsiyon yönetimi
      musteriler/            — müşteri kayıtları ve sipariş geçmişi
      raporlar/, ayarlar/    — Faz 3 yer tutucular
    api/                    — tüm REST uçları (Next.js Route Handlers)
      tickets/[id]/receipt/  — 80mm PDF fiş/adisyon üretimi
  components/               — UI bileşenleri (ui, floor-plan, order-ticket, layout)
  models/                   — Mongoose şemaları
  lib/
    pdf/receipt.js           — pdfkit ile 80mm fiş oluşturucu (DejaVu Sans Mono, Türkçe destekli)
    stock.js                 — günlük stok adedi düşme/iade mantığı
    format.js                — para birimi formatlama
    ...                       — db bağlantısı, auth, izin matrisi, ortak hesaplamalar
  hooks/                    — usePolling, useCurrentUser
  seed/                     — seed script + Yegane Pilavcısı menü verisi
print-agent/                — gerçek ESC/POS entegrasyonu için ayrılmış klasör (bkz. içindeki README)
```

Mimari kararlar, veri modelleri ve tam faz planı için `DESIGN.md` dosyasına bakın.

## Teknik notlar

- `src/models/*.js`, `src/lib/db.js`, `src/lib/constants.js` ve `src/lib/auth/password.js`
  bilinçli olarak CommonJS (`require`/`module.exports`) ile yazıldı; böylece hem Next.js
  route handler'ları hem de düz Node ile çalışan `npm run seed` script'i aynı modelleri
  sorunsuz kullanabiliyor.
- Yetkilendirme tek noktadan yönetilir: `src/lib/permissions.js` (rol → aksiyon matrisi) ve
  `src/lib/apiUtils.js` (`withApi` sarmalayıcısı) tüm API route'larında kullanılır.
- Adisyon toplamları (`subtotal`, `discountTotal`, `grandTotal`) tek bir yerde,
  `src/lib/ticketCalc.js` içinde hesaplanır.
- PDF fiş `pdfkit` + `dejavu-fonts-ttf` (npm paketi) ile üretilir; font dosyası
  `node_modules/dejavu-fonts-ttf/ttf/DejaVuSansMono*.ttf` üzerinden çalışma anında yüklenir —
  bu nedenle üretim ortamında `node_modules`'ün mevcut olduğu bir Node sunucusunda
  (`next start`) çalıştırılması gerekir; tamamen serverless/edge dağıtımlarda font dosyasının
  ayrıca paket dahilinde olduğundan emin olun.
- `npm run build` bu ortamda doğrulandı (derleme, lint ve tip kontrolü başarılı; 31 sayfa/route
  başarıyla üretildi). PDF fiş oluşturma mantığı da izole bir Node script'i ile test edildi
  (Türkçe karakterler dahil doğru çıktı üretti). Canlı bir MongoDB bağlantısı ile uçtan uca test
  için `npm run seed` komutunu kendi ortamınızda çalıştırmanız gerekir.
