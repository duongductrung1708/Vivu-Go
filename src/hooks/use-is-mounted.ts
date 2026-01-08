import { useState, useLayoutEffect } from "react";

/**
 * Hook to check if component is mounted on client side
 * Useful for avoiding hydration mismatches in Next.js
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

