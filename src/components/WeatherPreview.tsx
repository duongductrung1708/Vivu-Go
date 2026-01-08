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

type ForecastDay = {
  date: string;
  temperature: number;
  description: string;
  icon: string;
  minTemp: number;
  maxTemp: number;
};

type WeatherPreviewProps = {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
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

export function WeatherPreview({
  latitude,
  longitude,
  startDate,
  endDate,
}: WeatherPreviewProps) {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/weather?lat=${latitude}&lon=${longitude}&type=forecast`
        );

        if (!response.ok) {
          throw new Error("Không thể tải dự báo");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Lọc dự báo để chỉ hiển thị các ngày trong khoảng ngày đã chọn
        const start = new Date(startDate);
        const end = new Date(endDate);
        const relevantForecast =
          data.forecast?.filter((day: ForecastDay) => {
            const dayDate = new Date(day.date);
            return dayDate >= start && dayDate <= end;
          }) || [];

        setForecast(relevantForecast);
      } catch (err) {
        console.error("Lỗi khi tải dự báo:", err);
        setError(err instanceof Error ? err.message : "Không thể tải dự báo");
      } finally {
        setIsLoading(false);
      }
    };

    if (latitude && longitude && startDate && endDate) {
      fetchForecast();
    }
  }, [latitude, longitude, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-sky-50 px-3 py-2 text-xs text-sky-700 flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Đang tải dự báo thời tiết...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700">
        ⚠️ {error}
      </div>
    );
  }

  if (forecast.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-sky-50 px-3 py-2 text-xs text-sky-700">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-3.5 w-3.5" />
        <span className="font-medium">Dự báo thời tiết</span>
      </div>
      <div className="space-y-1.5">
        {forecast.slice(0, 3).map((day) => {
          const WeatherIcon = getWeatherIcon(day.icon);
          return (
            <div
              key={day.date}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <WeatherIcon className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span className="font-medium">{formatDate(day.date)}</span>
                <span className="text-sky-600/70 truncate">
                  {day.description}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="font-semibold">{day.maxTemp}°</span>
                <span className="text-sky-600/70">/{day.minTemp}°</span>
              </div>
            </div>
          );
        })}
        {forecast.length > 3 && (
          <div className="text-sky-600/70 pt-1">
            +{forecast.length - 3} ngày khác
          </div>
        )}
      </div>
    </div>
  );
}
