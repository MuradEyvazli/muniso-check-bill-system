"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Paket Servis özelliği kaldırıldı — bu sayfaya gelen herkes masalara yönlendirilir.
export default function PaketOrderPageRemoved() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/masalar");
  }, [router]);
  return null;
}
