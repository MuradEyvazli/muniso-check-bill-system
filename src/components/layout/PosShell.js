"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Wallet, Users, BarChart3 } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const TITLES = [
  { prefix: "/masalar", title: "Masalar" },
  { prefix: "/kasa", title: "Kasa" },
  { prefix: "/menu-yonetimi", title: "Menü Yönetimi" },
  { prefix: "/musteriler", title: "Müşteriler" },
  { prefix: "/raporlar", title: "Raporlar" },
  { prefix: "/ayarlar", title: "Ayarlar" },
];

// Access token 15 dk'da bir sona eriyor. Bu süre dolmadan sessizce yenilenmezse
// kullanıcı her 15 dakikada bir oturumdan atılıp login ekranına düşer — uzun bir
// vardiya boyunca (ya da site günlerce açık kaldığında) bu ciddi bir sorun olur.
// Bu yüzden oturum boyunca arka planda düzenli aralıklarla /api/auth/refresh
// çağrılır; refresh cookie'si (30 gün) geçerli olduğu sürece kullanıcı hiç
// atılmaz. Sekme uykuya geçip geri geldiğinde de anında bir yenileme denenir.
const TOKEN_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 dk — 15 dk'lık ömürden önce

function useSilentSessionRefresh() {
  useEffect(() => {
    let cancelled = false;

    async function refreshSession() {
      try {
        await fetch("/api/auth/refresh", { method: "POST" });
      } catch {
        // Ağ hatası olursa sessizce geç; bir sonraki denemede veya sayfa
        // geçişinde middleware zaten gerektiğinde login'e yönlendirir.
      }
    }

    const timer = setInterval(() => {
      if (!cancelled) refreshSession();
    }, TOKEN_REFRESH_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") refreshSession();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}

export default function PosShell({ user, children }) {
  const pathname = usePathname();
  const title = TITLES.find((t) => pathname.startsWith(t.prefix))?.title || "Muniso";

  useSilentSessionRefresh();

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} title={title} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <MobileNav user={user} pathname={pathname} />
      </div>
    </div>
  );
}

function MobileNav({ user, pathname }) {
  const items = [
    { href: "/masalar", label: "Masalar", icon: UtensilsCrossed, roles: ["admin", "kasiyer", "garson", "mutfak"] },
    { href: "/kasa", label: "Kasa", icon: Wallet, roles: ["admin", "kasiyer"] },
    { href: "/musteriler", label: "Müşteri", icon: Users, roles: ["admin", "kasiyer", "garson"] },
    { href: "/raporlar", label: "Raporlar", icon: BarChart3, roles: ["admin"] },
  ].filter((item) => item.roles.includes(user?.role));
  return (
    <nav className="sm:hidden sticky bottom-0 z-30 bg-ink-soft/95 backdrop-blur border-t border-ink-border flex">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`tap-target flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              active ? "text-gold" : "text-white/45"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
