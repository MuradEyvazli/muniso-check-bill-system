export const ACCESS_COOKIE = "muniso_access";
export const REFRESH_COOKIE = "muniso_refresh";

// DİKKAT: Bu, NODE_ENV=production'a değil, ayrı bir COOKIE_SECURE değişkenine
// bağlı. Sebep: "production build" ile "HTTPS üzerinden sunuluyor olmak" farklı
// şeyler. Restoran içi yerel ağda (ör. http://192.168.1.50:3000 gibi bir IP,
// TLS sertifikası olmadan) çalıştırılan bir production build hâlâ NODE_ENV'i
// "production" olur ama HTTPS değildir. Cookie'ye "Secure" bayrağı eskiden
// isProd'a göre konuyordu — bu, tarayıcının düz HTTP üzerinden o cookie'yi
// hiç saklamamasına, dolayısıyla girişin sessizce bozulmasına yol açardı.
// Gerçekten bir alan adı ve geçerli SSL sertifikasıyla (HTTPS) yayında olduğunuzda
// .env dosyasında COOKIE_SECURE=true yapın; yerel ağda/IP üzerinden çalıştırıyorsanız
// bunu false bırakın (varsayılan).
const useSecureCookies = process.env.COOKIE_SECURE === "true";

export function setAuthCookies(response, { accessToken, refreshToken }) {
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 dk; gerçek süre JWT içinde
  });
  if (refreshToken) {
    response.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 gün
    });
  }
  return response;
}

export function clearAuthCookies(response) {
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
