"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Gel-Al özelliği kaldırıldı — bu sayfaya gelen herkes masalara yönlendirilir.
export default function GelAlOrderPageRemoved() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/masalar");
  }, [router]);
  return null;
}
