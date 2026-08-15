"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "temizle", "0", "sil"];

export default function NumPad({ value, onChange, maxLength = 6 }) {
  function press(key) {
    if (key === "temizle") return onChange("");
    if (key === "sil") return onChange(value.slice(0, -1));
    if (value.length >= maxLength) return;
    onChange(value + key);
  }

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => press(key)}
          className="tap-target h-16 rounded-xl2 bg-ink-soft border border-ink-border text-xl font-semibold text-white hover:border-gold/50 active:scale-95 transition-transform"
        >
          {key === "temizle" ? "C" : key === "sil" ? "⌫" : key}
        </button>
      ))}
    </div>
  );
}
