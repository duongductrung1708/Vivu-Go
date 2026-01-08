"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <ThemeToggle />
            <ScrollToTopButton />
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
