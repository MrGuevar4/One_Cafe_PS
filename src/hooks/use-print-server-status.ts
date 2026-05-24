import { useEffect, useState } from "react";

const PRINT_SERVER_URL = import.meta.env.VITE_PRINT_SERVER_URL ?? "http://127.0.0.1:3001";

export function usePrintServerStatus() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${PRINT_SERVER_URL}/api/status`, {
          signal: AbortSignal.timeout(2000),
        });
        if (!cancelled) setIsOnline(res.ok);
      } catch {
        if (!cancelled) setIsOnline(false);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { isOnline };
}

/** Send a print job to the print server; falls back to window.print() on failure */
export async function sendPrintJob(payload: object): Promise<{
  success: boolean;
  fallback: boolean;
  warnings?: string[];
  error?: string;
}> {
  try {
    const res = await fetch(`${PRINT_SERVER_URL}/api/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return {
        success: true,
        fallback: false,
        warnings: data.warnings,
      };
    }
    return {
      success: false,
      fallback: true,
      error: data.error || data.details?.join(", ") || "Unknown error",
    };
  } catch (err) {
    // Graceful fallback to browser print dialog
    return {
      success: false,
      fallback: true,
      error: String(err),
    };
  }
}
