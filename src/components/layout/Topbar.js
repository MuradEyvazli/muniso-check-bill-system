"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/constants";

export default function Topbar({ user, title }) {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [shift, setShift] = useState(undefined);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadShift() {
      try {
        const res = await fetch("/api/shifts?active=true");
        const data = await res.json();
        if (active) setShift(data.ok ? data.data.shift : null);
      } catch {
        if (active) setShift(null);
      }
    }
    loadShift();
    const timer = setInterval(loadShift, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const dateStr = now.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3 bg-ink/80 backdrop-blur border-b border-ink-border relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/yegane-logo.png"
          alt="Yegane Pilav"
          className="sm:hidden w-9 h-9 rounded-xl2 shadow-[0_0_0_1px_rgba(201,162,39,0.35)] object-cover"
        />
        <div>
          <h1 className="font-display text-white font-semibold text-lg tracking-tight">{title}</h1>
          <p className="text-white/40 text-xs">
            {dateStr} · {timeStr}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {shift === null && (
          <Badge tone="danger">Vardiya Kapalı</Badge>
        )}
        {shift && (
          <Badge tone="success">Vardiya Açık</Badge>
        )}
        <div className="text-right hidden sm:block">
          <div className="text-white text-sm font-semibold leading-none">{user?.name}</div>
          <div className="text-white/40 text-xs leading-none mt-1">
            {ROLE_LABELS[user?.role] || user?.role}
          </div>
        </div>
        <button
          onClick={logout}
          className="tap-target rounded-xl2 border border-ink-border px-3 text-white/60 hover:text-white hover:border-gold/50 hover:bg-ink-card text-sm transition-colors"
        >
          Çıkış
        </button>
      </div>
    </header>
  );
}
