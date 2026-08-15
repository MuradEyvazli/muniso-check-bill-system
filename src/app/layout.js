// Genel arayüz metni için modern, geometrik bir sans-serif (Manrope) ve
// marka/başlıklar için zarif bir serif (Fraunces). @fontsource paketleri
// font dosyalarını npm bağımlılığı olarak proje içine gömer — derleme
// sırasında Google Fonts'a (veya başka bir dış adrese) hiç istek atılmaz,
// bu yüzden kısıtlı/kapalı ağlarda bile sorunsuz derlenir ve çalışır.
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/fraunces/500-italic.css";
import "@fontsource/fraunces/600-italic.css";
import "./globals.css";

export const metadata = {
  title: "Muniso — Restoran POS",
  description: "Muniso | Yegane Pilavcısı için adisyon ve sipariş yönetimi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
