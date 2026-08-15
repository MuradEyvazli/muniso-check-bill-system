"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UtensilsCrossed,
  Wallet,
  Users,
  BookOpen,
  BarChart3,
  Settings,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";

const NAV_ITEMS = [
  {
    href: "/masalar",
    label: "Masalar",
    roles: ["admin", "kasiyer", "garson", "mutfak"],
    icon: UtensilsCrossed,
    group: "genel",
  },
  {
    href: "/kasa",
    label: "Kasa",
    roles: ["admin", "kasiyer"],
    icon: Wallet,
    group: "genel",
  },
  {
    href: "/musteriler",
    label: "Müşteriler",
    roles: ["admin", "kasiyer", "garson"],
    icon: Users,
    group: "genel",
  },
  {
    href: "/menu-yonetimi",
    label: "Menü Yönetimi",
    roles: ["admin"],
    icon: BookOpen,
    group: "yonetim",
  },
  {
    href: "/raporlar",
    label: "Raporlar",
    roles: ["admin"],
    icon: BarChart3,
    group: "yonetim",
  },
  {
    href: "/ayarlar",
    label: "Ayarlar",
    roles: ["admin"],
    icon: Settings,
    group: "yonetim",
  },
];

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const genelItems = items.filter((i) => i.group === "genel");
  const yonetimItems = items.filter((i) => i.group === "yonetim");

  return (
    <aside className="hidden sm:flex flex-col w-64 shrink-0 bg-ink-soft border-r border-ink-border h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-ink-border/70">
        <div className="relative shrink-0">
          <div className="absolute -inset-0.5 rounded-xl2 bg-gradient-to-br from-gold/50 via-transparent to-burgundy/40 blur-[2px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/yegane-logo.png"
            alt="Yegane Pilav"
            className="relative w-10 h-10 rounded-xl2 shadow-[0_0_0_1px_rgba(201,162,39,0.35)] object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="font-display text-white font-semibold text-[17px] leading-none truncate">
            Yegane Pilav
          </div>
          <div className="text-gold/50 text-[10px] leading-none mt-2 tracking-[0.14em] uppercase">
            Muniso POS
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto">
        <NavGroup label="Genel" items={genelItems} pathname={pathname} />
        {yonetimItems.length > 0 && (
          <NavGroup label="Yönetim" items={yonetimItems} pathname={pathname} />
        )}
      </nav>

      <div className="px-3 py-3 border-t border-ink-border/70">
        <div className="flex items-center gap-3 rounded-xl2 px-2.5 py-2.5 bg-ink-card/60">
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
      </div>
    </aside>
  );
}

function NavGroup({ label, items, pathname }) {
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
            className={`tap-target group relative flex items-center gap-3 rounded-xl2 px-3 font-semibold text-sm transition-all duration-200 ${
              active
                ? "bg-gradient-to-r from-burgundy to-burgundy-light text-white shadow-glow"
                : "text-white/55 hover:bg-ink-card hover:text-white"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-gold" />
            )}
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors ${
                active ? "bg-white/15" : "bg-white/5 group-hover:bg-white/10"
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
