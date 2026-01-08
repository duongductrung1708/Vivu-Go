"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/store/useTripStore";
import type { TimeSlot } from "@/store/useTripStore";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type NearbyPlace = {
  id: string;
  name: string;
  category: string;
  distance: number;
  latitude: number;
  longitude: number;
  address?: string;
};

type NearbyPlacesProps = {
  latitude: number;
  longitude: number;
  radius?: number; // meters
  onClose?: () => void;
};

type MapboxFeature = {
  id: string;
  text?: string;
  place_name?: string;
  center: [number, number];
  properties?: {
    name?: string;
    address?: string;
  };
};

const categoryMap: Record<
  string,
  { label: string; icon: string; defaultTimeSlot: TimeSlot }
> = {
  restaurant: { label: "Nhà hàng", icon: "🍽️", defaultTimeSlot: "noon" },
  cafe: { label: "Cà phê", icon: "☕", defaultTimeSlot: "morning" },
  bar: { label: "Quán bar", icon: "🍺", defaultTimeSlot: "evening" },
  attraction: {
    label: "Điểm tham quan",
    icon: "🏛️",
    defaultTimeSlot: "morning",
  },
  museum: { label: "Bảo tàng", icon: "🎨", defaultTimeSlot: "afternoon" },
  park: { label: "Công viên", icon: "🌳", defaultTimeSlot: "morning" },
  shopping: { label: "Mua sắm", icon: "🛍️", defaultTimeSlot: "afternoon" },
  hotel: { label: "Khách sạn", icon: "🏨", defaultTimeSlot: "evening" },
  other: { label: "Khác", icon: "📍", defaultTimeSlot: "morning" },
};

export function NearbyPlaces({
  latitude,
  longitude,
  radius = 10000,
  onClose,
}: NearbyPlacesProps) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addPlace, getSelectedDay } = useTripStore();

  const selectedDay = getSelectedDay();

  useEffect(() => {
    if (!MAPBOX_TOKEN || !selectedDay) {
      return;
    }

    const fetchNearbyPlaces = async () => {
      setIsLoading(true);
      try {
        // Use Mapbox Geocoding API to search for nearby places
        const allPlaces: NearbyPlace[] = [];

        // Search terms for different categories
        const searchTerms: Record<string, string[]> = {
          restaurant: ["nhà hàng", "restaurant", "quán ăn", "food"],
          cafe: ["cà phê", "cafe", "coffee", "quán cà phê"],
          attraction: ["điểm tham quan", "attraction", "du lịch", "tourist"],
          museum: ["bảo tàng", "museum"],
          park: ["công viên", "park"],
          shopping: ["mua sắm", "shopping", "trung tâm thương mại", "mall"],
        };

        // Search for each category
        for (const [category, terms] of Object.entries(searchTerms)) {
          for (const term of terms.slice(0, 2)) {
            // Limit to first 2 terms per category
            try {
              // Use Mapbox Geocoding API with proximity search
              const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                term
              )}.json?proximity=${longitude},${latitude}&limit=5&types=poi&access_token=${MAPBOX_TOKEN}`;

              const response = await fetch(url);
              const data = await response.json();

              if (data.features && Array.isArray(data.features)) {
                data.features.forEach((feature: MapboxFeature) => {
                  const [lng, lat] = feature.center;
                  const distance = calculateDistance(
                    latitude,
                    longitude,
                    lat,
                    lng
                  );

                  if (distance <= radius) {
                    // Check if this place is already added
                    const existingIndex = allPlaces.findIndex(
                      (p) => p.latitude === lat && p.longitude === lng
                    );

                    if (existingIndex === -1) {
                      allPlaces.push({
                        id: feature.id || `${category}-${lat}-${lng}`,
                        name:
                          feature.text ||
                          feature.properties?.name ||
                          feature.place_name ||
                          term,
                        category: category,
                        distance: Math.round(distance),
                        latitude: lat,
                        longitude: lng,
                        address:
                          feature.place_name || feature.properties?.address,
                      });
                    }
                  }
                });
              }
            } catch {
              // Continue with other categories if one fails
            }
          }
        }

        // Remove duplicates and sort by distance
        const uniquePlaces = Array.from(
          new Map(allPlaces.map((place) => [place.id, place])).values()
        ).sort((a, b) => a.distance - b.distance);

        setPlaces(uniquePlaces.slice(0, 20)); // Limit to 20 places
      } catch {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbyPlaces();
  }, [latitude, longitude, radius, selectedDay]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleAddPlace = (place: NearbyPlace) => {
    if (!selectedDay) return;

    const categoryInfo = categoryMap[place.category] || categoryMap.other;

    addPlace(selectedDay.id, {
      name: place.name,
      timeSlot: categoryInfo.defaultTimeSlot,
      category:
        place.category === "restaurant"
          ? "food"
          : place.category === "cafe"
          ? "coffee"
          : place.category === "shopping"
          ? "shopping"
          : place.category === "attraction" || place.category === "museum"
          ? "sightseeing"
          : place.category === "park"
          ? "culture"
          : "other",
      estimatedCost: 0,
      latitude: place.latitude,
      longitude: place.longitude,
    });

    // Close the panel after adding
    if (onClose) {
      onClose();
    }
  };

  const filteredPlaces = selectedCategory
    ? places.filter((p) => p.category === selectedCategory)
    : places;

  const categories = Array.from(new Set(places.map((p) => p.category)));

  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 max-h-[40vh] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Địa điểm xung quanh</h3>
          {places.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({places.length} địa điểm)
            </span>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Đang tìm địa điểm...
          </span>
        </div>
      ) : places.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          Không tìm thấy địa điểm nào trong bán kính {radius / 1000}km
        </div>
      ) : (
        <>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-border">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                className="text-xs shrink-0"
                onClick={() => setSelectedCategory(null)}
              >
                Tất cả
              </Button>
              {categories.map((cat) => {
                const info = categoryMap[cat] || categoryMap.other;
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {info.icon} {info.label}
                  </Button>
                );
              })}
            </div>
          )}

          <div className="overflow-y-auto max-h-[calc(40vh-120px)]">
            <div className="divide-y divide-border">
              {filteredPlaces.map((place) => {
                const categoryInfo =
                  categoryMap[place.category] || categoryMap.other;
                return (
                  <div
                    key={place.id}
                    className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{categoryInfo.icon}</span>
                        <h4 className="font-medium text-sm truncate">
                          {place.name}
                        </h4>
                      </div>
                      {place.address && (
                        <p className="text-xs text-muted-foreground truncate">
                          {place.address}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {place.distance}m
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => handleAddPlace(place)}
                    >
                      Thêm
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
