"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mutfak (KDS) ekranı kaldırıldı — bu sayfaya gelen herkes masalara yönlendirilir.
export default function MutfakPageRemoved() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/masalar");
  }, [router]);
  return null;
}
