"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  Wind,
  Droplets,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

type WeatherData = {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
};

type WeatherWidgetProps = {
  latitude: number;
  longitude: number;
  className?: string;
};

const getWeatherIcon = (iconCode: string) => {
  // Mã icon OpenWeatherMap: https://openweathermap.org/weather-conditions
  if (iconCode.includes("01")) return Sun; // Trời quang
  if (iconCode.includes("02")) return CloudSun; // Ít mây
  if (iconCode.includes("03") || iconCode.includes("04")) return Cloud; // Nhiều mây
  if (iconCode.includes("09") || iconCode.includes("10")) return CloudRain; // Mưa
  return Cloud;
};

export function WeatherWidget({
  latitude,
  longitude,
  className = "",
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/weather?lat=${latitude}&lon=${longitude}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorMsg = errorData.error || `HTTP ${response.status}`;

          // Cung cấp thông báo lỗi cụ thể
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

        setWeather(data);
      } catch (err) {
        console.error("Lỗi khi tải thời tiết:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Không thể tải thời tiết";

        // Kiểm tra các loại lỗi cụ thể
        if (
          errorMessage.includes("API key") ||
          errorMessage.includes("not configured")
        ) {
          setError("Chưa cấu hình OpenWeather API key");
        } else if (
          errorMessage.includes("401") ||
          errorMessage.includes("Invalid")
        ) {
          setError("API key không hợp lệ");
        } else {
          setError("Không thể tải thời tiết");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchWeather();
    }
  }, [latitude, longitude]);

  if (isLoading) {
    return (
      <div
        className={`rounded-lg bg-card border border-border p-3 shadow-lg ${className}`}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Đang tải thời tiết...
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
            <p className="text-xs font-medium text-foreground">Thời tiết</p>
            <p className="text-[10px] text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const WeatherIcon = getWeatherIcon(weather.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg bg-card border border-border p-3 shadow-lg ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <WeatherIcon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                {weather.city}, {weather.country}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {weather.description}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-foreground">
              {weather.temperature}°
            </span>
            <span className="text-xs text-muted-foreground">
              Cảm giác như {weather.feelsLike}°
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              <span>{weather.windSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              <span>{weather.humidity}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
