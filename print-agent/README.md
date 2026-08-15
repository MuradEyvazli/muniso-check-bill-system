# Muniso Print Agent (Faz 2)

Bu klasör, mutfak fişi / adisyon / ödeme fişini ESC/POS termal yazıcılara (58mm ve 80mm)
ağ (network, port 9100) veya USB üzerinden basacak bağımsız Node.js servisi için ayrılmıştır.

## Kapsam (Faz 2'de teslim edilecek)

- Express tabanlı basit HTTP servis (`POST /print`), yerel ağdaki bir bilgisayarda/terminalde çalışır.
- `src/lib/printing/printerClient.js` (Faz 2'de eklenecek) Next.js tarafından bu servise
  `PRINT_AGENT_URL` üzerinden iş gönderir.
- `escposEncoder.js`: adisyon/mutfak fişi/ödeme fişi için ESC/POS komutlarını üretir.
- `PrinterConfig` modeli (zaten Faz 1'de mevcut) hangi yazıcının hangi istasyona
  (mutfak/kasa) ve bağlantıya (network/usb) ait olduğunu tutar.
- Basılamayan işler için yeniden deneme kuyruğu ve durum loglama.

## Neden ayrı bir servis?

Tarayıcıdan doğrudan termal yazıcıya erişim mümkün olmadığı için, restoran içindeki bir
bilgisayarda/mini PC'de sürekli çalışan küçük bir Node.js servisi gerekir. Muniso web
uygulaması bu servise HTTP ile "şunu yazdır" isteği gönderir, servis de yazıcıya ESC/POS
komutlarını network soketi veya USB üzerinden iletir.

Faz 1 tesliminde bu servis iskelet halinde değildir; mimari `DESIGN.md` içinde tanımlıdır
ve Faz 2'de bu klasörün altında `package.json`, `index.js` ve `lib/escposEncoder.js` olarak
teslim edilecektir.
