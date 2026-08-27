"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, User } from "lucide-react";
import NumPad from "@/components/ui/NumPad";
import Button from "@/components/ui/Button";

const EASE = [0.16, 1, 0.3, 1];

const panelStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function LoginPage() {
  const router = useRouter();
  const panelRef = useRef(null);

  const [mode, setMode] = useState("pin"); // "pin" | "password"
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sol paneldeki "spotlight" fare takibi — imlecin bulunduğu yeri CSS custom
  // property'lerine yazıp radyal bir gold ışık huzmesi olarak yansıtıyoruz.
  function handlePanelMouseMove(e) {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    panelRef.current.style.setProperty("--spot-x", `${x}%`);
    panelRef.current.style.setProperty("--spot-y", `${y}%`);
  }

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
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-5 relative">
      <div className="login-grain" />

      {/* Sol taraf — sinematik marka paneli (sadece geniş ekranlarda) */}
      <div
        ref={panelRef}
        onMouseMove={handlePanelMouseMove}
        className="hidden lg:flex lg:col-span-3 relative overflow-hidden items-center justify-center p-20 login-cinematic"
      >
        <div className="login-blob login-blob-a" />
        <div className="login-blob login-blob-b" />
        <div className="login-spotlight" />

        <motion.div
          variants={panelStagger}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-lg"
        >
          <motion.div variants={fadeUp} className="mb-8 flex items-center gap-3">
            <span className="w-8 h-px bg-gold/50" />
            <span className="text-gold/70 text-[11px] font-bold uppercase tracking-[0.24em]">
              Eskişehir · Tepebaşı
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="font-display italic text-white text-5xl xl:text-6xl leading-[1.08] mb-7 font-medium"
          >
            Her tabak,
            <br />
            bir hikayenin
            <br />
            başlangıcı.
          </motion.h2>

          <motion.p variants={fadeUp} className="text-white/45 text-base max-w-sm leading-relaxed">
            Yegane Pilav mutfağını ve salonunu yöneten adisyon sistemine hoş geldiniz.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-12 flex items-center gap-3 text-white/30 text-[11px] font-bold uppercase tracking-[0.22em]"
          >
            <span className="w-8 h-px bg-gold/40" />
            Muniso Adisyon Sistemi
          </motion.div>
        </motion.div>
      </div>

      {/* Sağ taraf — giriş kartı */}
      <div className="lg:col-span-2 relative flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
        <div className="lg:hidden login-blob login-blob-mobile" />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-10 w-full max-w-md flex flex-col items-center"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <motion.img
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              src="/logo/yegane-logo.png"
              alt="Yegane Pilav"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-[0_0_0_1px_rgba(201,162,39,0.35),0_12px_40px_rgba(0,0,0,0.55)] mb-4 object-cover"
            />
            <h1 className="font-display italic text-white text-2xl sm:text-3xl font-medium tracking-tight">
              Yegane Pilav
            </h1>
            <p className="text-gold/50 text-[11px] uppercase tracking-[0.22em] mt-2">
              Muniso Adisyon Sistemi
            </p>
          </div>

          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.55)] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

            <div className="grid grid-cols-2 gap-1 mb-6 bg-ink-soft/80 rounded-xl2 p-1">
              {[
                { key: "pin", label: "PIN ile Giriş" },
                { key: "password", label: "Şifre ile Giriş" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMode(tab.key)}
                  className={`relative tap-target rounded-xl2 font-semibold text-sm transition-colors duration-200 ${
                    mode === tab.key ? "text-white" : "text-white/40"
                  }`}
                >
                  {mode === tab.key && (
                    <motion.div
                      layoutId="login-tab-pill"
                      className="absolute inset-0 rounded-xl2 bg-burgundy shadow-glow -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="rounded-xl2 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              {mode === "pin" ? (
                <motion.div
                  key="pin"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="flex gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={i < pin.length ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                        transition={{ duration: 0.28, ease: EASE }}
                        className={`w-4 h-4 rounded-full border border-gold/50 transition-colors ${
                          i < pin.length ? "bg-gold shadow-[0_0_14px_rgba(201,162,39,0.65)]" : "bg-transparent"
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
                </motion.div>
              ) : (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  onSubmit={submitPassword}
                  className="flex flex-col gap-4"
                >
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input
                      className="input-field pl-11"
                      placeholder="Kullanıcı adı"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input
                      className="input-field pl-11"
                      placeholder="Şifre"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
