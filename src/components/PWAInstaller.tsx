"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
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

export function PWAInstaller() {
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

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallPrompt(false);
    }

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
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AlertDialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cài đặt Vivu Go</AlertDialogTitle>
          <AlertDialogDescription>
            Cài đặt ứng dụng để sử dụng offline và truy cập nhanh hơn. Dữ liệu lịch trình sẽ được
            lưu cache để bạn có thể xem ngay cả khi không có internet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowInstallPrompt(false)}>
            <X className="mr-2 h-4 w-4" />
            Để sau
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            Cài đặt ngay
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
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
