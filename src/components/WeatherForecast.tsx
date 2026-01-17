"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  Loader2,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTripStore } from "@/store/useTripStore";

type ForecastDay = {
  date: string;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  minTemp: number;
  maxTemp: number;
};

type WeatherForecastData = {
  city: string;
  country: string;
  forecast: ForecastDay[];
};

type WeatherForecastProps = {
  latitude: number;
  longitude: number;
  className?: string;
};

const getWeatherIcon = (iconCode: string) => {
  if (iconCode.includes("01")) return Sun;
  if (iconCode.includes("02")) return CloudSun;
  if (iconCode.includes("03") || iconCode.includes("04")) return Cloud;
  if (iconCode.includes("09") || iconCode.includes("10")) return CloudRain;
  return Cloud;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hôm nay";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Ngày mai";
  }

  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dayName = days[date.getDay()];
  return `${dayName}, ${date.getDate()}/${date.getMonth() + 1}`;
};

export function WeatherForecast({
  latitude,
  longitude,
  className = "",
}: WeatherForecastProps) {
  const { trip } = useTripStore();
  const [forecast, setForecast] = useState<WeatherForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Kiểm tra xem có ngày nào trong phạm vi dự báo (16 ngày) không
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 16); // Open-Meteo hỗ trợ đến 16 ngày

    const hasDateWithinRange = trip.days.some((day) => {
      const d = new Date(day.date);
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= maxAllowedDate;
    });

    if (!latitude || !longitude || trip.days.length === 0 || !hasDateWithinRange) {
      setIsLoading(false);
      setForecast(null);
      return;
    }

    const fetchForecast = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/weather?lat=${latitude}&lon=${longitude}&type=forecast`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorMsg = errorData.error || `HTTP ${response.status}`;

          if (response.status === 401) {
            errorMsg = "API key không hợp lệ hoặc chưa được cấu hình";
          } else if (response.status === 404) {
            errorMsg = "Không tìm thấy vị trí";
          } else if (response.status === 429) {
            errorMsg = "Đã vượt quá giới hạn API";
          }

          throw new Error(errorMsg);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setForecast(data);
      } catch (err) {
        console.error("Lỗi khi tải dự báo:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Không thể tải dự báo";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecast();
  }, [latitude, longitude, trip.days]);

  // Lọc dự báo để chỉ hiển thị các ngày trong chuyến đi
  const tripDates = new Set(trip.days.map((day) => day.date));
  const relevantForecast =
    forecast?.forecast.filter((day) => tripDates.has(day.date)) || [];

  if (isLoading) {
    return (
      <div
        className={`rounded-lg bg-card border border-border p-3 shadow-lg ${className}`}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Đang tải dự báo...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-lg bg-card border border-border p-3 shadow-lg ${className}`}
      >
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">
              Dự báo thời tiết
            </p>
            <p className="text-[10px] text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!forecast || relevantForecast.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg bg-card border border-border shadow-lg ${className}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">
              Dự báo thời tiết
            </p>
            <p className="text-[10px] text-muted-foreground">
              {forecast.city}, {forecast.country}
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {relevantForecast.length} ngày
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-3 space-y-3 max-h-96 overflow-y-auto">
          {relevantForecast.map((day) => {
            const WeatherIcon = getWeatherIcon(day.icon);
            return (
              <div
                key={day.date}
                className="flex items-center justify-between gap-3 pb-2 border-b border-border last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <WeatherIcon className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {formatDate(day.date)}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {day.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {day.maxTemp}°/{day.minTemp}°
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {day.temperature}°C
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
