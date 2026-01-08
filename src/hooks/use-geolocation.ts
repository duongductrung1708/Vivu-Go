"use client";

import { useEffect, useState } from "react";

type GeolocationState = {
  position: GeolocationPosition | null;
  error: string | null;
};

export function useGeolocation(enable: boolean) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
  });

  useEffect(() => {
    if (!enable) {
      setState({ position: null, error: null });
      return;
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({ position: null, error: "Trình duyệt không hỗ trợ định vị." });
      return;
    }

    let watcherId: number | null = null;

    // First try getCurrentPosition with relaxed options
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({ position: pos, error: null });
        
        // After getting initial position, start watching for updates
        watcherId = navigator.geolocation.watchPosition(
          (updatedPos) => {
            setState({ position: updatedPos, error: null });
          },
          (err) => {
            // Don't overwrite successful position with watch errors
          },
          { 
            enableHighAccuracy: false,
            maximumAge: 30_000,
            timeout: 10_000
          },
        );
      },
      (err) => {
        // Map error codes to user-friendly messages
        let errorMessage = "";
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.";
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = "Không thể xác định vị trí. Vui lòng kiểm tra GPS hoặc kết nối mạng.";
            break;
          case 3: // TIMEOUT
            errorMessage = "Hết thời gian chờ định vị. Vui lòng thử lại.";
            break;
          default:
            errorMessage = err.message || "Không thể lấy vị trí. Vui lòng thử lại.";
        }
        
        setState({ position: null, error: errorMessage });
      },
      { 
        enableHighAccuracy: false, // Không yêu cầu GPS hardware
        maximumAge: 300_000, // Chấp nhận vị trí cũ đến 5 phút
        timeout: 10_000 // Timeout 10 giây
      },
    );

    return () => {
      if (watcherId !== null) {
        navigator.geolocation.clearWatch(watcherId);
      }
    };
  }, [enable]);

  return state;
}


