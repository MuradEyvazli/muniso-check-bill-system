"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NumPad from "@/components/ui/NumPad";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("pin"); // "pin" | "password"
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitPin() {
    if (pin.length < 4) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      router.push("/masalar");
      router.refresh();
    } catch (err) {
      setError(err.message || "PIN hatalı");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  async function submitPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      router.push("/masalar");
      router.refresh();
    } catch (err) {
      setError(err.message || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/yegane-logo.png"
          alt="Yegane Pilav"
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl2 shadow-[0_0_0_1px_rgba(201,162,39,0.35),0_12px_40px_rgba(0,0,0,0.55)] mb-4 object-cover"
        />
        <h1 className="font-display text-white text-2xl sm:text-3xl font-semibold tracking-tight">
          Yegane Pilav
        </h1>
        <p className="text-gold/50 text-[11px] uppercase tracking-[0.22em] mt-2">
          Muniso Adisyon Sistemi
        </p>
      </div>

      <div className="card w-full max-w-md p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
        <div className="grid grid-cols-2 gap-2 mb-6 bg-ink-soft rounded-xl2 p-1">
          <button
            onClick={() => setMode("pin")}
            className={`tap-target rounded-xl2 font-semibold text-sm ${
              mode === "pin" ? "bg-burgundy text-white" : "text-white/50"
            }`}
          >
            PIN ile Giriş
          </button>
          <button
            onClick={() => setMode("password")}
            className={`tap-target rounded-xl2 font-semibold text-sm ${
              mode === "password" ? "bg-burgundy text-white" : "text-white/50"
            }`}
          >
            Şifre ile Giriş
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl2 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {mode === "pin" ? (
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border border-gold/50 ${
                    i < pin.length ? "bg-gold" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
            <NumPad value={pin} onChange={setPin} maxLength={6} />
            <Button
              variant="gold"
              className="w-full max-w-xs"
              disabled={pin.length < 4 || loading}
              onClick={submitPin}
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </Button>
          </div>
        ) : (
          <form onSubmit={submitPassword} className="flex flex-col gap-4">
            <input
              className="input-field"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <input
              className="input-field"
              placeholder="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
