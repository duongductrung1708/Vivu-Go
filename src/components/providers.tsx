"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { PWAInstaller } from "@/components/PWAInstaller";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh longer for offline
            gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep cached data for offline access (React Query v5)
            refetchOnWindowFocus: false,
            refetchOnReconnect: true, // Refetch when back online
            retry: 1, // Retry once on failure
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <ScrollToTopButton />
            <PWAInstaller />
            <OfflineIndicator />
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
