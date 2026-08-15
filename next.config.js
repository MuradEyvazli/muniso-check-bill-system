/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // pdfkit, fiş PDF'i oluştururken kendi içindeki .afm font metrik dosyalarını
  // (ör. Helvetica.afm) paketin gerçek node_modules yolundan dosya sistemiyle
  // okuyor. Next.js bu paketi webpack ile derleyip .next içine taşırsa o dosya
  // yolları bozuluyor ve "ENOENT: .../Helvetica.afm" hatası veriyor. Bu paketleri
  // "external" işaretleyip webpack derlemesinin dışında bırakıyoruz ki çalışma
  // zamanında düz node_modules'tan require edilsinler ve dosya yolları sağlam kalsın.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "dejavu-fonts-ttf"],
  },
  // Temel güvenlik header'ları: clickjacking (bu site bir <iframe> içine
  // gömülemez), MIME-sniffing ve referrer sızıntısına karşı savunma.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
