"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Clock,
  MapPin,
  Navigation,
  Tag,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Utensils,
  Coffee,
  Landmark,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { useTripStore, type TimeSlot, type Place } from "@/store/useTripStore";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "YOUR_MAPBOX_ACCESS_TOKEN";

type PlaceSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  dayId: string;
};

type GeocodingResult = {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
  properties?: {
    name_vi?: string;
    "name:vi"?: string;
    category?: string;
    relevance?: number;
    place_type?: string[];
    [key: string]: string | number | string[] | undefined;
  };
};

// Common Vietnamese landmarks with alternative names (moved outside component to avoid dependency issues)
const vietnameseLandmarks: Record<
  string,
  { name: string; lat: number; lng: number }
> = {
  "lăng bác": {
    name: "Lăng Chủ Tịch Hồ Chí Minh",
    lat: 21.0368,
    lng: 105.8342,
  },
  "lăng chủ tịch": {
    name: "Lăng Chủ Tịch Hồ Chí Minh",
    lat: 21.0368,
    lng: 105.8342,
  },
  "ho chi minh mausoleum": {
    name: "Lăng Chủ Tịch Hồ Chí Minh",
    lat: 21.0368,
    lng: 105.8342,
  },
  "ho chi minh lăng": {
    name: "Lăng Chủ Tịch Hồ Chí Minh",
    lat: 21.0368,
    lng: 105.8342,
  },
  "hồ gươm": { name: "Hồ Hoàn Kiếm", lat: 21.0285, lng: 105.8542 },
  "hoan kiem": { name: "Hồ Hoàn Kiếm", lat: 21.0285, lng: 105.8542 },
  "hoan kiem lake": { name: "Hồ Hoàn Kiếm", lat: 21.0285, lng: 105.8542 },
  "văn miếu": { name: "Văn Miếu - Quốc Tử Giám", lat: 21.0267, lng: 105.8356 },
  "temple of literature": {
    name: "Văn Miếu - Quốc Tử Giám",
    lat: 21.0267,
    lng: 105.8356,
  },
  "chùa một cột": { name: "Chùa Một Cột", lat: 21.0358, lng: 105.8322 },
  "one pillar pagoda": { name: "Chùa Một Cột", lat: 21.0358, lng: 105.8322 },
};

export function PlaceSearchModal({
  isOpen,
  onClose,
  dayId,
}: PlaceSearchModalProps) {
  const { addPlace } = useTripStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>("morning");
  const [selectedCategory, setSelectedCategory] =
    useState<Place["category"]>("sightseeing");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [searchMode, setSearchMode] = useState<"search" | "coordinates">(
    "search"
  );
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isTimeSlotOpen, setIsTimeSlotOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const timeSlotDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const timeSlotOptions: {
    value: TimeSlot;
    label: string;
    icon: typeof Sunrise;
  }[] = [
    { value: "morning", label: "Sáng", icon: Sunrise },
    { value: "noon", label: "Trưa", icon: Sun },
    { value: "afternoon", label: "Chiều", icon: Sunset },
    { value: "evening", label: "Tối", icon: Moon },
  ];

  const categoryOptions: {
    value: Place["category"];
    label: string;
    icon: typeof Utensils;
  }[] = [
    { value: "food", label: "Ẩm Thực", icon: Utensils },
    { value: "coffee", label: "Cà Phê", icon: Coffee },
    { value: "sightseeing", label: "Tham Quan", icon: MapPin },
    { value: "culture", label: "Văn Hóa", icon: Landmark },
    { value: "shopping", label: "Mua Sắm", icon: ShoppingBag },
    { value: "other", label: "Khác", icon: Tag },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timeSlotDropdownRef.current &&
        !timeSlotDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTimeSlotOpen(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current !== undefined) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const normalizedQuery = query.toLowerCase().trim();

        // Check if query matches a known landmark
        let landmarkMatch: { name: string; lat: number; lng: number } | null =
          null;
        for (const [key, value] of Object.entries(vietnameseLandmarks)) {
          if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
            landmarkMatch = value;
            break;
          }
        }

        // Extract potential address parts (number + street name)
        // Example: "T-Box Café Hồng Hà" or "79 Hồng Hà" -> try "79 Hồng Hà"
        const addressPattern = /(\d+)\s+([^\d,]+)/;
        const addressMatch = query.match(addressPattern);
        const addressQuery = addressMatch
          ? `${addressMatch[1]} ${addressMatch[2].trim()}`
          : null;

        // Also try extracting just street name if query contains café/restaurant names
        const streetNameMatch = query.match(
          /(?:café|coffee|restaurant|nhà hàng|quán|tiệm)\s+(.+)/i
        );
        const streetNameQuery = streetNameMatch
          ? streetNameMatch[1].trim()
          : null;

        let results: GeocodingResult[] = [];
        const allResults: GeocodingResult[] = [];
        const seenIds = new Set<string>();

        // Helper function to add unique results
        const addUniqueResults = (newResults: GeocodingResult[]) => {
          for (const result of newResults) {
            if (!seenIds.has(result.id)) {
              seenIds.add(result.id);
              allResults.push(result);
            }
          }
        };

        // Strategy 1: Search with full query (POI + address)
        const searchParams1 = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          limit: "15",
          language: "vi",
          country: "VN",
          types: "poi,place,address,postcode,neighborhood,locality",
          proximity: "105.8342,21.0278",
          autocomplete: "true",
        });
        const url1 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?${searchParams1.toString()}`;
        const response1 = await fetch(url1);
        const data1 = await response1.json();
        addUniqueResults(data1.features || []);

        // Strategy 2: If address pattern found, search by address only
        if (addressQuery && addressQuery !== query) {
          const addressParams = new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            limit: "10",
            language: "vi",
            country: "VN",
            types: "address,poi",
            proximity: "105.8342,21.0278",
          });
          const addressUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            addressQuery
          )}.json?${addressParams.toString()}`;
          const addressResponse = await fetch(addressUrl);
          const addressData = await addressResponse.json();
          addUniqueResults(addressData.features || []);
        }

        // Strategy 3: Try with street name only (if extracted)
        if (streetNameQuery && streetNameQuery !== query) {
          const streetParams = new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            limit: "10",
            language: "vi",
            country: "VN",
            types: "address,poi",
            proximity: "105.8342,21.0278",
          });
          const streetUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            streetNameQuery
          )}.json?${streetParams.toString()}`;
          const streetResponse = await fetch(streetUrl);
          const streetData = await streetResponse.json();
          addUniqueResults(streetData.features || []);
        }

        // Strategy 4: Try without autocomplete for exact matches
        if (allResults.length === 0) {
          const exactParams = new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            limit: "15",
            language: "vi",
            country: "VN",
            types: "poi,place,address",
            proximity: "105.8342,21.0278",
            // No autocomplete for exact search
          });
          const exactUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?${exactParams.toString()}`;
          const exactResponse = await fetch(exactUrl);
          const exactData = await exactResponse.json();
          addUniqueResults(exactData.features || []);
        }

        // Strategy 5: Fallback with English language
        if (allResults.length === 0) {
          const englishParams = new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            limit: "15",
            language: "en",
            country: "VN",
            types: "poi,place,address,postcode,neighborhood,locality",
            autocomplete: "true",
          });
          const englishUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?${englishParams.toString()}`;
          const englishResponse = await fetch(englishUrl);
          const englishData = await englishResponse.json();
          addUniqueResults(englishData.features || []);
        }

        // Strategy 6: Try without country restriction
        if (allResults.length === 0) {
          const globalParams = new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            limit: "15",
            language: "vi",
            types: "poi,place,address,postcode,neighborhood,locality",
            proximity: "105.8342,21.0278",
            autocomplete: "true",
          });
          const globalUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?${globalParams.toString()}`;
          const globalResponse = await fetch(globalUrl);
          const globalData = await globalResponse.json();
          addUniqueResults(globalData.features || []);
        }

        results = allResults;

        // If landmark match found, add it to results (prioritize it)
        if (landmarkMatch) {
          const landmarkFeature: GeocodingResult = {
            id: `landmark-${landmarkMatch.name}`,
            place_name: landmarkMatch.name,
            center: [landmarkMatch.lng, landmarkMatch.lat] as [number, number],
            text: landmarkMatch.name,
            properties: {
              name_vi: landmarkMatch.name,
              category: "landmark",
            },
          };
          // Remove duplicates and add landmark at the top
          results = results.filter(
            (r: GeocodingResult) =>
              Math.abs(r.center[0] - landmarkMatch.lng) > 0.001 ||
              Math.abs(r.center[1] - landmarkMatch.lat) > 0.001
          );
          results.unshift(landmarkFeature);
        }

        // Sort results by relevance (if available) or prioritize addresses and POIs
        results = results.sort((a: GeocodingResult, b: GeocodingResult) => {
          const aRelevance = a.properties?.relevance || 0;
          const bRelevance = b.properties?.relevance || 0;
          // Prioritize addresses and POIs
          const aType =
            a.properties?.category || a.properties?.place_type?.[0] || "";
          const bType =
            b.properties?.category || b.properties?.place_type?.[0] || "";
          if (aType === "address" && bType !== "address") return -1;
          if (bType === "address" && aType !== "address") return 1;
          if (aType === "poi" && bType !== "poi" && bType !== "address")
            return -1;
          if (bType === "poi" && aType !== "poi" && aType !== "address")
            return 1;
          return bRelevance - aRelevance;
        });

        setResults(results);
      } catch (error) {
        console.error("Geocoding error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [query]);

  const handleSelectPlace = (result: GeocodingResult) => {
    addPlace(dayId, {
      name: result.text || result.place_name,
      timeSlot: selectedTimeSlot,
      category: selectedCategory,
      estimatedCost,
      latitude: result.center[1],
      longitude: result.center[0],
    });
    setQuery("");
    setResults([]);
    onClose();
  };

  const handleAddByCoordinates = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert("Vui lòng nhập tọa độ hợp lệ (số thập phân)");
      return;
    }

    if (lat < -90 || lat > 90) {
      alert("Vĩ độ phải nằm trong khoảng -90 đến 90");
      return;
    }

    if (lng < -180 || lng > 180) {
      alert("Kinh độ phải nằm trong khoảng -180 đến 180");
      return;
    }

    // Try to get place name from reverse geocoding
    let placeName = `Địa điểm (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    try {
      const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=vi&limit=1`;
      const response = await fetch(reverseGeocodeUrl);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        placeName = data.features[0].place_name || placeName;
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Use default name if reverse geocoding fails
    }

    addPlace(dayId, {
      name: placeName,
      timeSlot: selectedTimeSlot,
      category: selectedCategory,
      estimatedCost,
      latitude: lat,
      longitude: lng,
    });
    setLatitude("");
    setLongitude("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Thêm Địa Điểm Mới
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="mb-4 flex gap-2 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setSearchMode("search");
                setResults([]);
              }}
              className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                searchMode === "search"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="mr-1.5 inline h-3.5 w-3.5" />
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode("coordinates");
                setResults([]);
                setQuery("");
              }}
              className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                searchMode === "coordinates"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Navigation className="mr-1.5 inline h-3.5 w-3.5" />
              Tọa độ
            </button>
          </div>

          {/* Search Mode */}
          {searchMode === "search" && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm địa điểm hoặc địa chỉ (ví dụ: Hồ Gươm, 123 Phố Hàng Bông, Phở Bưng Hàng Trống)..."
                  className="w-full rounded-2xl border border-border bg-muted py-2 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Coordinates Mode */}
          {searchMode === "coordinates" && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Vĩ độ (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="21.0278"
                  className="w-full rounded-2xl border border-border bg-muted px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Khoảng: -90 đến 90 (Ví dụ: 21.0278 cho Hà Nội)
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Kinh độ (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="105.8342"
                  className="w-full rounded-2xl border border-border bg-muted px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Khoảng: -180 đến 180 (Ví dụ: 105.8342 cho Hà Nội)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddByCoordinates}
                disabled={!latitude || !longitude}
                className="w-full rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Thêm địa điểm từ tọa độ
              </button>
            </div>
          )}

          {isSearching && (
            <div className="mb-4 text-center text-xs text-muted-foreground">
              Đang tìm kiếm...
            </div>
          )}

          {!isSearching && query.length >= 3 && results.length === 0 && (
            <div className="mb-4 text-center text-xs text-muted-foreground">
              Không tìm thấy kết quả. Thử tìm kiếm với tên khác hoặc địa chỉ cụ
              thể hơn.
            </div>
          )}

          {results.length > 0 && (
            <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
              {results.map((result) => {
                // Extract Vietnamese name if available, otherwise use default
                const displayName =
                  result.properties?.name_vi ||
                  result.properties?.["name:vi"] ||
                  result.text ||
                  result.place_name;
                const fullAddress = result.place_name;

                // Determine result type for better display
                const resultType =
                  result.properties?.category ||
                  result.properties?.place_type?.[0] ||
                  "";
                const typeLabel: Record<string, string> = {
                  address: "Địa chỉ",
                  poi: "Địa điểm",
                  place: "Địa điểm",
                  postcode: "Mã bưu điện",
                  neighborhood: "Khu vực",
                  locality: "Địa phương",
                };

                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelectPlace(result)}
                    className="w-full rounded-2xl border border-border bg-card p-3 text-left text-sm transition hover:border-primary/50 hover:bg-primary/10"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {displayName}
                          </p>
                          {typeLabel[resultType] && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {typeLabel[resultType]}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fullAddress}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                Khung Giờ
              </label>
              <div className="relative" ref={timeSlotDropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTimeSlotOpen(!isTimeSlotOpen);
                  }}
                  className="flex w-full items-center gap-2 rounded-2xl border-2 border-border bg-muted px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {(() => {
                    const selected = timeSlotOptions.find(
                      (opt) => opt.value === selectedTimeSlot
                    );
                    const Icon = selected?.icon || Sunrise;
                    return (
                      <>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-left">
                          {selected?.label || "Sáng"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </>
                    );
                  })()}
                </button>
                <AnimatePresence>
                  {isTimeSlotOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-50 mt-1 w-full rounded-2xl border-2 border-border bg-card shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {timeSlotOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTimeSlot(option.value);
                              setIsTimeSlotOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition ${
                              selectedTimeSlot === option.value
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                selectedTimeSlot === option.value
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                <Tag className="h-3.5 w-3.5" />
                Danh Mục
              </label>
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCategoryOpen(!isCategoryOpen);
                  }}
                  className="flex w-full items-center gap-2 rounded-2xl border-2 border-border bg-muted px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {(() => {
                    const selected = categoryOptions.find(
                      (opt) => opt.value === selectedCategory
                    );
                    const Icon = selected?.icon || MapPin;
                    return (
                      <>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-left">
                          {selected?.label || "Tham Quan"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </>
                    );
                  })()}
                </button>
                <AnimatePresence>
                  {isCategoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-50 mt-1 w-full rounded-2xl border-2 border-border bg-card shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {categoryOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory(option.value);
                              setIsCategoryOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition ${
                              selectedCategory === option.value
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                selectedCategory === option.value
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Chi Phí Ước Tính (VND)
              </label>
              <input
                type="number"
                min="0"
                value={estimatedCost}
                onChange={(e) =>
                  setEstimatedCost(parseInt(e.target.value) || 0)
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="0"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
