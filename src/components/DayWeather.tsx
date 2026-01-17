"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, CloudSun } from "lucide-react";

type ForecastDay = {
  date: string;
  temperature: number;
  description: string;
  icon: string;
  minTemp: number;
  maxTemp: number;
};

type DayWeatherProps = {
  latitude: number;
  longitude: number;
  date: string;
};

const getWeatherIcon = (iconCode: string) => {
  if (iconCode.includes("01")) return Sun;
  if (iconCode.includes("02")) return CloudSun;
  if (iconCode.includes("03") || iconCode.includes("04")) return Cloud;
  if (iconCode.includes("09") || iconCode.includes("10")) return CloudRain;
  return Cloud;
};

export function DayWeather({ latitude, longitude, date }: DayWeatherProps) {
  const [weather, setWeather] = useState<ForecastDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tính khoảng cách ngày so với hôm nay trước khi gọi API
    if (!latitude || !longitude || !date) {
      setIsLoading(false);
      return;
    }

    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const daysFromToday = Math.floor(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Open-Meteo hỗ trợ dự báo đến 16 ngày, nếu vượt quá thì không gọi API
    if (daysFromToday > 16 || daysFromToday < 0) {
      setIsLoading(false);
      setWeather(null);
      return;
    }

    const fetchWeather = async () => {
      setIsLoading(true);
      setWeather(null);
      try {
        const response = await fetch(
          `/api/weather?lat=${latitude}&lon=${longitude}&type=forecast`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.error || !data.forecast || !Array.isArray(data.forecast)) {
          return;
        }

        // Chuẩn hóa định dạng ngày (YYYY-MM-DD)
        const normalizedDate = date.split("T")[0];

        // Tìm thời tiết cho ngày cụ thể này
        const dayWeather = data.forecast.find(
          (day: ForecastDay) => day.date.split("T")[0] === normalizedDate
        );

        if (dayWeather) {
          setWeather(dayWeather);
        } else {
          // Kiểm tra xem ngày có quá xa trong tương lai không (vượt quá 16 ngày)
          const targetDate = new Date(normalizedDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          targetDate.setHours(0, 0, 0, 0);
          const daysFromToday = Math.floor(
            (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysFromToday <= 16) {
            // Thử tìm ngày gần nhất nếu không tìm thấy khớp chính xác (trong phạm vi dự báo)
            const closestWeather = data.forecast.reduce(
              (closest: ForecastDay | null, day: ForecastDay) => {
                const dayDate = new Date(day.date);
                const diff = Math.abs(dayDate.getTime() - targetDate.getTime());
                if (!closest) return day;
                const closestDiff = Math.abs(
                  new Date(closest.date).getTime() - targetDate.getTime()
                );
                return diff < closestDiff ? day : closest;
              },
              null
            );

            if (closestWeather) {
              const closestDate = new Date(closestWeather.date);
              const daysDiff = Math.abs(
                Math.floor(
                  (closestDate.getTime() - targetDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              );
              // Chỉ sử dụng nếu chênh lệch trong vòng 1 ngày
              if (daysDiff <= 1) {
                setWeather(closestWeather);
              }
            }
          }
        }
      } catch (err) {
        console.error("DayWeather: Lỗi khi tải thời tiết:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude, date]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 mt-0.5">
        <div className="h-3 w-3 rounded-full bg-muted-foreground/20 animate-pulse" />
        <span className="text-[10px] text-muted-foreground/50">...</span>
      </div>
    );
  }

  if (!weather) {
    // Kiểm tra xem ngày có vượt quá phạm vi dự báo không
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const daysFromToday = Math.floor(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysFromToday > 16) {
      // Ngày vượt quá phạm vi dự báo 16 ngày, không hiển thị gì
      return null;
    }

    // Hiển thị placeholder cho các ngày trong phạm vi nhưng không có dữ liệu
    return (
      <div className="flex items-center gap-1 mt-0.5">
        <Cloud className="h-3 w-3 text-muted-foreground/30" />
        <span className="text-[10px] text-muted-foreground/30">--</span>
      </div>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.icon);

  return (
    <div className="flex items-center gap-1 mt-0.5">
      <WeatherIcon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-[10px] text-muted-foreground">
        {weather.maxTemp}°/{weather.minTemp}°
      </span>
    </div>
  );
}
