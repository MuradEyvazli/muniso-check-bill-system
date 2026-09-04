"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

// Bir sayı prop'u her değiştiğinde (ör. polling ile yeni bir ödeme geldiğinde)
// eski değerden yeniye doğru kısa bir "sayma" animasyonuyla geçiş yapar —
// raporlardaki rakamların statik değil, canlı hissetmesini sağlar.
export function useAnimatedNumber(value, duration = 0.6) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    const controls = animate(from, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prevRef.current = target;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

// value: sayı. format: (roundedNumber) => string — ör. formatCurrency.
export default function AnimatedNumber({ value, format }) {
  const display = useAnimatedNumber(value);
  const rounded = Math.round(display * 100) / 100;
  return <>{format ? format(rounded) : rounded}</>;
}
