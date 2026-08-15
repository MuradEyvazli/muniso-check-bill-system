// PM2 process manager yapılandırması.
//
// Neden gerekli: "npm run start" (next start) doğrudan bir Terminal penceresinde
// çalıştırılırsa, terminal kapanırsa / bilgisayar uyursa / uygulama bir hata ile
// çökerse site durur ve kimse fark etmeden saatlerce kapalı kalabilir. PM2 bunu
// arka planda, terminal kapansa bile çalışan, çökerse otomatik yeniden başlatan
// bir servis olarak çalıştırır — aylarca kesintisiz çalışması istenen bir POS
// sistemi için gerekli olan budur.
//
// Kurulum (bir kere):
//   npm install -g pm2
//   npm run build
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup      -> çıktısındaki komutu çalıştırın (Mac yeniden başlayınca PM2'yi otomatik başlatır)
//
// Güncelleme sonrası:
//   npm run build && pm2 restart muniso
//
// Faydalı komutlar:
//   pm2 status        -> çalışıyor mu, kaç kere restart oldu
//   pm2 logs muniso    -> canlı loglar
//   pm2 monit          -> CPU / RAM takibi

module.exports = {
  apps: [
    {
      name: "muniso",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
