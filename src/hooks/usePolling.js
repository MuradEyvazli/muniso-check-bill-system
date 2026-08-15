"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Belirtilen aralıkta fetcher'ı çağırır. Sekme arka plandayken durur.
 */
export function usePolling(fetcher, intervalMs = 4000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const tick = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    tick();
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") tick();
    }, intervalMs);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, intervalMs]);

  return { data, error, loading, refresh: tick };
}
