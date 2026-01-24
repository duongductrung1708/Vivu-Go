"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PWA_INSTALL_DISMISSED_KEY = "pwa_install_dismissed";

export function PWAInstaller() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Service worker should only be enabled in production builds.
    // In dev, SW caching can cause hydration mismatch (stale HTML vs new JS).
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV !== "production") {
        // Best-effort cleanup if a SW was registered before.
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
        if ("caches" in window) {
          caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
        }
      } else {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered:", registration);
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      }
    }

    // Check if user has already dismissed the prompt
    const hasDismissed = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "true";
    
    // Check if already installed
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show if not dismissed and not installed
      if (!hasDismissed && !isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      // Clear dismissed flag if user installs
      localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    // Save dismissed state to localStorage
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "true");
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AlertDialog open={showInstallPrompt} onOpenChange={(open) => {
      if (!open) handleDismiss();
      setShowInstallPrompt(open);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("pwa.installTitle", "Cài đặt Vivu Go")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "pwa.installDescription",
              "Cài đặt ứng dụng để sử dụng offline và truy cập nhanh hơn. Dữ liệu lịch trình sẽ được lưu cache để bạn có thể xem ngay cả khi không có internet.",
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>
            <X className="mr-2 h-4 w-4" />
            {t("pwa.later", "Để sau")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            {t("pwa.installNow", "Cài đặt ngay")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Export function to check if PWA can be installed
export function canInstallPWA(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches === false;
}

// Export function to manually trigger install prompt (for settings)
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    };
    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      // If no deferred prompt, show browser's native install instructions
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return { install, canInstall: !!deferredPrompt && !isInstalled, isInstalled };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
