"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Wallet, Users, BarChart3, Menu, X } from "lucide-react";
import Sidebar, { NAV_ITEMS, initials } from "./Sidebar";
import Topbar from "./Topbar";
import { ROLE_LABELS } from "@/lib/constants";

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
  const [menuOpen, setMenuOpen] = useState(false);

  useSilentSessionRefresh();

  // Sayfa değiştiğinde menü açık kalmasın.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} title={title} />
        <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6">{children}</main>
        <MobileNav user={user} pathname={pathname} onMoreClick={() => setMenuOpen(true)} />
      </div>
      <MobileMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} user={user} pathname={pathname} />
    </div>
  );
}

function MobileNav({ user, pathname, onMoreClick }) {
  const items = [
    { href: "/masalar", label: "Masalar", icon: UtensilsCrossed, roles: ["admin", "kasiyer", "garson", "mutfak"] },
    { href: "/kasa", label: "Kasa", icon: Wallet, roles: ["admin", "kasiyer"] },
    { href: "/musteriler", label: "Müşteri", icon: Users, roles: ["admin", "kasiyer", "garson"] },
    { href: "/raporlar", label: "Raporlar", icon: BarChart3, roles: ["admin"] },
  ].filter((item) => item.roles.includes(user?.role));
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-ink-soft/95 backdrop-blur border-t border-ink-border flex">
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
      <button
        onClick={onMoreClick}
        className="tap-target flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-white/45 transition-colors"
      >
        <Menu size={20} strokeWidth={1.75} />
        Menü
      </button>
    </nav>
  );
}

// Sidebar'daki TÜM menü öğelerini (Genel + Yönetim) mobilde de eksiksiz
// ulaşılabilir kılmak için — alt gezinme çubuğu yalnızca en sık kullanılan 4
// kısayolu gösteriyor, geri kalanı (Menü Yönetimi, Ayarlar vb.) buradan.
function MobileMenuSheet({ open, onClose, user, pathname }) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const genelItems = items.filter((i) => i.group === "genel");
  const yonetimItems = items.filter((i) => i.group === "yonetim");

  return (
    <div
      className={`sm:hidden fixed inset-0 z-40 transition-opacity duration-200 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`absolute bottom-0 left-0 right-0 bg-ink-soft border-t border-ink-border rounded-t-2xl max-h-[80vh] overflow-y-auto transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-border/70">
          <div>
            <div className="font-display italic text-white font-medium text-lg leading-none">
              Yegane Pilav
            </div>
            <div className="text-gold/50 text-[10px] leading-none mt-2 tracking-[0.18em] uppercase">
              Muniso POS
            </div>
          </div>
          <button
            onClick={onClose}
            className="tap-target w-9 h-9 flex items-center justify-center rounded-full bg-ink-card text-white/60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-3 py-4 flex flex-col gap-5">
          <MobileNavGroup label="Genel" items={genelItems} pathname={pathname} />
          {yonetimItems.length > 0 && (
            <MobileNavGroup label="Yönetim" items={yonetimItems} pathname={pathname} />
          )}
        </div>

        <div className="px-5 py-4 border-t border-ink-border/70 flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-ink font-bold text-xs">
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-semibold leading-none truncate">
              {user?.name || "Kullanıcı"}
            </div>
            <div className="text-white/35 text-[11px] leading-none mt-1.5 truncate">
              {ROLE_LABELS[user?.role] || user?.role}
            </div>
          </div>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}

function MobileNavGroup({ label, items, pathname }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="section-label px-3 mb-1">{label}</span>
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`tap-target relative flex items-center gap-3 rounded-xl2 px-3 font-semibold text-sm transition-all duration-200 ${
              active
                ? "bg-gradient-to-r from-burgundy to-burgundy-light text-white shadow-glow"
                : "text-white/60 hover:bg-ink-card hover:text-white"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-gold" />
            )}
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                active ? "bg-white/15" : "bg-white/5"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
