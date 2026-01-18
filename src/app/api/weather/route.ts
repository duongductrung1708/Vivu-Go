import { NextRequest, NextResponse } from "next/server";

// Helper function to map WMO weather codes to descriptions (Vietnamese)
function mapWeatherCodeToDescription(code: number): string {
  const codes: Record<number, string> = {
    0: "Trời quang",
    1: "Chủ yếu quang",
    2: "Có mây một phần",
    3: "Có mây",
    45: "Sương mù",
    48: "Sương mù đóng băng",
    51: "Mưa phùn nhẹ",
    53: "Mưa phùn vừa",
    55: "Mưa phùn dày",
    56: "Mưa phùn đóng băng nhẹ",
    57: "Mưa phùn đóng băng dày",
    61: "Mưa nhẹ",
    63: "Mưa vừa",
    65: "Mưa nặng",
    66: "Mưa đóng băng nhẹ",
    67: "Mưa đóng băng nặng",
    71: "Tuyết nhẹ",
    73: "Tuyết vừa",
    75: "Tuyết nặng",
    77: "Hạt tuyết",
    80: "Mưa rào nhẹ",
    81: "Mưa rào vừa",
    82: "Mưa rào nặng",
    85: "Mưa tuyết nhẹ",
    86: "Mưa tuyết nặng",
    95: "Dông",
    96: "Dông có mưa đá",
    99: "Dông có mưa đá nặng",
  };
  return codes[code] || "Không xác định";
}

// Helper function to map WMO weather codes to OpenWeatherMap icon format (for compatibility)
function mapWeatherCodeToIcon(code: number): string {
  // Map WMO codes to OpenWeatherMap icon format
  if (code === 0) return "01d"; // Clear sky
  if (code === 1) return "02d"; // Mainly clear
  if (code === 2) return "02d"; // Partly cloudy
  if (code === 3) return "03d"; // Overcast
  if (code === 45 || code === 48) return "50d"; // Fog
  if (code >= 51 && code <= 57) return "09d"; // Drizzle
  if (code >= 61 && code <= 67) return "10d"; // Rain
  if (code >= 71 && code <= 77) return "13d"; // Snow
  if (code >= 80 && code <= 82) return "09d"; // Rain showers
  if (code >= 85 && code <= 86) return "13d"; // Snow showers
  if (code >= 95 && code <= 99) return "11d"; // Thunderstorm
  return "01d"; // Default
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const type = searchParams.get("type") || "current"; // "current" or "forecast"

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Fetch weather from Open-Meteo API (free, no API key required)
    // Open-Meteo supports up to 16 days of forecast for free tier
    if (type === "forecast") {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia/Ho_Chi_Minh&forecast_days=16`;

      // Add timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Vivu-Go/1.0",
          },
        });
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
          console.error("Open-Meteo API timeout");
          return NextResponse.json(
            { error: "Request timeout - API không phản hồi kịp thời" },
            { status: 504 }
          );
        }
        throw error;
      }

      if (!response.ok) {
        console.error("Open-Meteo API error:", response.status, response.statusText);
        return NextResponse.json(
          { error: "Failed to fetch weather forecast data" },
          { status: response.status }
        );
      }

      const data = await response.json();

      if (!data.daily || !data.daily.time || !Array.isArray(data.daily.time)) {
        console.error("Invalid forecast data structure:", data);
        return NextResponse.json(
          { error: "Invalid forecast data received" },
          { status: 500 }
        );
      }

      // Map Open-Meteo format to app format
      const dailyForecast = data.daily.time.map((date: string, index: number) => {
        const weatherCode = data.daily.weather_code[index];
        const maxTemp = data.daily.temperature_2m_max[index];
        const minTemp = data.daily.temperature_2m_min[index];
        // Use max temp as main temperature (noon temperature)
        const temperature = Math.round(maxTemp);

        return {
          date,
          temperature,
          feelsLike: temperature, // Open-Meteo doesn't have feels_like, use temperature
          description: mapWeatherCodeToDescription(weatherCode),
          icon: mapWeatherCodeToIcon(weatherCode),
          humidity: Math.round(data.daily.relative_humidity_2m_max[index] || 0),
          windSpeed: Math.round((data.daily.wind_speed_10m_max[index] || 0) * 3.6), // Convert m/s to km/h
          minTemp: Math.round(minTemp),
          maxTemp: Math.round(maxTemp),
        };
      });

      return NextResponse.json({
        city: "Unknown", // Open-Meteo doesn't provide city name
        country: "",
        forecast: dailyForecast,
      });
    } else {
      // Current weather
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia/Ho_Chi_Minh`;

      // Add timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Vivu-Go/1.0",
          },
        });
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
          console.error("Open-Meteo API timeout");
          return NextResponse.json(
            { error: "Request timeout - API không phản hồi kịp thời" },
            { status: 504 }
          );
        }
        throw error;
      }

      if (!response.ok) {
        console.error("Open-Meteo API error:", response.status, response.statusText);
        return NextResponse.json(
          { error: "Failed to fetch weather data" },
          { status: response.status }
        );
      }

      const data = await response.json();

      if (!data.current) {
        console.error("Invalid weather data structure:", data);
        return NextResponse.json(
          { error: "Invalid weather data received" },
          { status: 500 }
        );
      }

      const weatherCode = data.current.weather_code;
      const temperature = Math.round(data.current.temperature_2m);

      // Format current weather data (compatible with existing components)
      const weatherData = {
        temperature,
        feelsLike: temperature, // Open-Meteo doesn't have feels_like, use temperature
        description: mapWeatherCodeToDescription(weatherCode),
        icon: mapWeatherCodeToIcon(weatherCode),
        humidity: Math.round(data.current.relative_humidity_2m || 0),
        windSpeed: Math.round((data.current.wind_speed_10m || 0) * 3.6), // Convert m/s to km/h
        city: "Unknown", // Open-Meteo doesn't provide city name
        country: "",
      };

      return NextResponse.json(weatherData);
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
    
    // Provide more specific error messages
    let errorMessage = "Không thể tải dữ liệu thời tiết";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        errorMessage = "Kết nối timeout - Vui lòng thử lại sau";
        statusCode = 504;
      } else if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Không thể kết nối đến API thời tiết - Vui lòng kiểm tra kết nối mạng";
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

