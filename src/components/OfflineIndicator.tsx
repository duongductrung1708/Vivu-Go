"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-auto max-w-md border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
      <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        Bạn đang offline. Dữ liệu đã cache sẽ được hiển thị. Thay đổi sẽ được đồng bộ khi có kết nối.
      </AlertDescription>
    </Alert>
  );
}
