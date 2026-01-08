import { NextRequest, NextResponse } from "next/server";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export async function GET(request: NextRequest) {
  if (!OPENWEATHER_API_KEY) {
    return NextResponse.json(
      { error: "OpenWeather API key is not configured" },
      { status: 500 }
    );
  }

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

    // Fetch weather from OpenWeatherMap API
    const endpoint = type === "forecast" 
      ? "forecast" 
      : "weather";
    const url = `https://api.openweathermap.org/data/2.5/${endpoint}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=vi`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenWeather API error:", errorData);
      
      // Provide more specific error messages
      let errorMessage = "Failed to fetch weather data";
      if (response.status === 401) {
        errorMessage = "Invalid OpenWeather API key. Please check your OPENWEATHER_API_KEY in .env.local";
      } else if (response.status === 404) {
        errorMessage = "Location not found";
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle forecast data
    if (type === "forecast") {
      if (!data.list || !Array.isArray(data.list)) {
        console.error("Invalid forecast data structure:", data);
        return NextResponse.json(
          { error: "Invalid forecast data received" },
          { status: 500 }
        );
      }

      // Type for forecast list item
      type ForecastItem = {
        dt: number;
        main: {
          temp: number;
          feels_like: number;
          temp_min: number;
          temp_max: number;
          humidity: number;
        };
        weather: Array<{
          description: string;
          icon: string;
        }>;
        wind?: {
          speed: number;
        };
      };

      // Group forecast by date (day)
      const forecastByDate: Record<string, ForecastItem[]> = {};
      data.list.forEach((item: ForecastItem) => {
        const date = new Date(item.dt * 1000).toISOString().split("T")[0];
        if (!forecastByDate[date]) {
          forecastByDate[date] = [];
        }
        forecastByDate[date].push(item);
      });

      // Get daily forecast (use noon data or average)
      const dailyForecast = Object.entries(forecastByDate).map(([date, items]) => {
        // Find noon forecast (12:00) or use the first item
        const noonItem = items.find((item: ForecastItem) => {
          const hour = new Date(item.dt * 1000).getHours();
          return hour >= 11 && hour <= 13;
        }) || items[Math.floor(items.length / 2)] || items[0];

        return {
          date,
          temperature: Math.round(noonItem.main.temp),
          feelsLike: Math.round(noonItem.main.feels_like),
          description: noonItem.weather[0].description || "N/A",
          icon: noonItem.weather[0].icon || "01d",
          humidity: noonItem.main.humidity || 0,
          windSpeed: Math.round((noonItem.wind?.speed || 0) * 3.6),
          minTemp: Math.round(Math.min(...items.map((i: ForecastItem) => i.main.temp_min))),
          maxTemp: Math.round(Math.max(...items.map((i: ForecastItem) => i.main.temp_max))),
        };
      });

      return NextResponse.json({
        city: data.city?.name || "Unknown",
        country: data.city?.country || "",
        forecast: dailyForecast,
      });
    }

    // Handle current weather data
    if (!data.main || !data.weather || !data.weather[0]) {
      console.error("Invalid weather data structure:", data);
      return NextResponse.json(
        { error: "Invalid weather data received" },
        { status: 500 }
      );
    }

    // Format current weather data
    const weatherData = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description || "N/A",
      icon: data.weather[0].icon || "01d",
      humidity: data.main.humidity || 0,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // Convert m/s to km/h
      city: data.name || "Unknown",
      country: data.sys?.country || "",
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}

