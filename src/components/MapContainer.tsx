"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  X,
  Car,
  Footprints,
  Bike,
  Route,
  MapPin,
  LocateFixed,
  RefreshCw,
  Sparkles,
  Box,
  Map as MapIcon,
  Crosshair,
} from "lucide-react";
import { useTripStore } from "@/store/useTripStore";
import { useGeolocation } from "@/hooks/use-geolocation";
import { NearbyPlaces } from "./NearbyPlaces";
import { PlaceChatAssistant } from "./PlaceChatAssistant";
import { WeatherWidget } from "./WeatherWidget";
import { WeatherForecast } from "./WeatherForecast";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "YOUR_MAPBOX_ACCESS_TOKEN";
const DEFAULT_MAPBOX_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE ?? "mapbox://styles/mapbox/streets-v12";

mapboxgl.accessToken = MAPBOX_TOKEN;

type RouteProfile = "driving" | "walking" | "cycling";

type RouteCache = {
  coordinates: string; // "lng,lat;lng,lat;..."
  profile: RouteProfile;
  geometry: GeoJSON.LineString;
  distance: number; // meters
  duration: number; // seconds
};

export function MapContainer() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [routeProfile, setRouteProfile] = useState<RouteProfile>("driving");
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [useMyLocation, setUseMyLocation] = useState(false);
  const [manualUserLocation, setManualUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [isSelectingCustomLocation, setIsSelectingCustomLocation] =
    useState(false);
  const [customSelectedLocation, setCustomSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const customLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { position, error: geoError } = useGeolocation(useMyLocation);
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeCacheRef = useRef<Map<string, RouteCache>>(new Map());
  const hasFlewToLocationRef = useRef(false);
  const {
    trip,
    getSelectedDay,
    selectedPlaceId,
    updatePlace,
    selectPlace,
    showNearbyPlacesForPlaceId,
    showNearbyPlacesForPlace,
  } = useTripStore();

  const selectedDay = getSelectedDay();

  // Determine time of day: dawn, day, dusk, night
  type TimeOfDay = "dawn" | "day" | "dusk" | "night";

  const timeOfDay = useMemo((): TimeOfDay => {
    const hour = currentTime.getHours();
    // Dawn: 5:00 - 7:00 (bình minh)
    if (hour >= 5 && hour < 7) {
      return "dawn";
    }
    // Day: 7:00 - 18:00 (ban ngày)
    if (hour >= 7 && hour < 18) {
      return "day";
    }
    // Dusk: 18:00 - 20:00 (hoàng hôn)
    if (hour >= 18 && hour < 20) {
      return "dusk";
    }
    // Night: 20:00 - 5:00 (ban đêm)
    return "night";
  }, [currentTime]);

  // Get appropriate map style based on time of day
  const mapStyle = useMemo(() => {
    switch (timeOfDay) {
      case "dawn":
        // Light style with warm tones for dawn
        return DEFAULT_MAPBOX_STYLE;
      case "day":
        // Bright light style for day
        return DEFAULT_MAPBOX_STYLE;
      case "dusk":
        // Transition to darker style for dusk
        return "mapbox://styles/mapbox/dark-v11";
      case "night":
        // Dark style for night
        return "mapbox://styles/mapbox/dark-v11";
      default:
        return DEFAULT_MAPBOX_STYLE;
    }
  }, [timeOfDay]);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Update map style when time changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const newStyle = mapStyle;
    const currentStyleName = map.getStyle().name || "";
    const newStyleName = newStyle.split("/").pop() || "";

    // Determine time of day for logging
    const hour = new Date().getHours();
    let currentTimeOfDay: TimeOfDay = "day";
    if (hour >= 5 && hour < 7) currentTimeOfDay = "dawn";
    else if (hour >= 7 && hour < 18) currentTimeOfDay = "day";
    else if (hour >= 18 && hour < 20) currentTimeOfDay = "dusk";
    else currentTimeOfDay = "night";

    if (currentStyleName !== newStyleName) {
      console.log(
        `Updating map style to ${currentTimeOfDay} mode (${newStyleName})`
      );
      map.setStyle(newStyle);

      // Re-add 3D buildings after style change
      map.once("style.load", () => {
        const layers = map.getStyle().layers;
        if (layers) {
          const firstSymbolLayer = layers.find(
            (layer) => layer.type === "symbol"
          );

          if (firstSymbolLayer) {
            map.addLayer(
              {
                id: "3d-buildings",
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 14,
                layout: {
                  visibility: is3DMode ? "visible" : "none",
                },
                paint: {
                  "fill-extrusion-color": "#aaa",
                  "fill-extrusion-height": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    14,
                    0,
                    15,
                    ["get", "height"],
                  ],
                  "fill-extrusion-base": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    14,
                    0,
                    15,
                    ["get", "min_height"],
                  ],
                  "fill-extrusion-opacity": 0.6,
                },
              },
              firstSymbolLayer.id
            );
          }
        }
      });
    }
  }, [mapStyle, isMapLoaded, is3DMode]);

  // Toggle 3D mode (pitch and buildings visibility)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    if (is3DMode) {
      // Enable 3D view with pitch
      map.easeTo({
        pitch: 60,
        duration: 1000,
      });

      // Show 3D buildings
      if (map.getLayer("3d-buildings")) {
        map.setLayoutProperty("3d-buildings", "visibility", "visible");
      }
    } else {
      // Disable 3D view
      map.easeTo({
        pitch: 0,
        duration: 1000,
      });

      // Hide 3D buildings
      if (map.getLayer("3d-buildings")) {
        map.setLayoutProperty("3d-buildings", "visibility", "none");
      }
    }
  }, [is3DMode, isMapLoaded]);

  // Center map on user location when available (GPS or manual)
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapLoaded) {
      return;
    }

    if (!useMyLocation) {
      // Remove marker if we're not using location
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      setManualUserLocation(null);
      // Don't reset hasFlewToLocationRef - keep it so we don't fly again when re-enabled
      return;
    }

    // Use GPS position if available, otherwise use manual location
    const location = position
      ? { lat: position.coords.latitude, lng: position.coords.longitude }
      : manualUserLocation;

    if (!location) {
      return;
    }

    const { lat: latitude, lng: longitude } = location;

    // Update or create user location marker
    if (!userLocationMarkerRef.current) {
      // Create a custom marker element for better visibility
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#22c55e";
      el.style.border = "4px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      // Add pulsing animation
      el.style.animation = "pulse 2s infinite";

      userLocationMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .addTo(map);

      // Only fly to location on very first time (when marker has never existed before)
      if (!hasFlewToLocationRef.current) {
        map.flyTo({ center: [longitude, latitude], zoom: 14 });
        hasFlewToLocationRef.current = true;
      }
      // If marker was removed and recreated, don't fly - user might be viewing a different area
    } else {
      // Update existing marker position without moving the map
      userLocationMarkerRef.current.setLngLat([longitude, latitude]);
    }
  }, [position, manualUserLocation, isMapLoaded, useMyLocation]);

  // Handle map click to set manual user location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || !useMyLocation) {
      return;
    }

    // Allow manual selection if:
    // 1. User clicked "Update location" button (isSelectingLocation = true)
    // 2. OR GPS failed and no position available
    const shouldAllowManualSelection =
      isSelectingLocation || (geoError && !position);

    if (!shouldAllowManualSelection) {
      return;
    }

    const handleMapClickForLocation = (e: mapboxgl.MapMouseEvent) => {
      // Don't set location if a place is selected (to avoid conflicts)
      if (selectedPlaceId) {
        return;
      }

      const { lat, lng } = e.lngLat;
      setManualUserLocation({ lat, lng });
      setIsSelectingLocation(false); // Exit selection mode after setting
    };

    map.on("click", handleMapClickForLocation);
    return () => {
      map.off("click", handleMapClickForLocation);
    };
  }, [
    isMapLoaded,
    useMyLocation,
    geoError,
    position,
    isSelectingLocation,
    selectedPlaceId,
  ]);

  const handleUseMyLocationClick = () => {
    const newValue = !useMyLocation;
    setUseMyLocation(newValue);
    if (!newValue) {
      // Clear manual location and exit selection mode when disabling
      setManualUserLocation(null);
      setIsSelectingLocation(false);
    }
  };

  // Initialize map only once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === "YOUR_MAPBOX_ACCESS_TOKEN") {
      return;
    }

    try {
      // Determine initial style based on current time
      const hour = new Date().getHours();
      let initialStyle = DEFAULT_MAPBOX_STYLE;

      // Dawn: 5:00 - 7:00
      if (hour >= 5 && hour < 7) {
        initialStyle = DEFAULT_MAPBOX_STYLE; // dawn
      }
      // Day: 7:00 - 18:00
      else if (hour >= 7 && hour < 18) {
        initialStyle = DEFAULT_MAPBOX_STYLE; // day
      }
      // Dusk: 18:00 - 20:00
      else if (hour >= 18 && hour < 20) {
        initialStyle = "mapbox://styles/mapbox/dark-v11"; // dusk
      }
      // Night: 20:00 - 5:00
      else {
        initialStyle = "mapbox://styles/mapbox/dark-v11"; // night
      }

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: [105.8342, 21.0278],
        zoom: 12,
        interactive: true,
        dragRotate: true,
        touchZoomRotate: true,
        doubleClickZoom: true,
        scrollZoom: true,
        boxZoom: true,
      });

      map.on("load", () => {
        setIsMapLoaded(true);

        // Add navigation controls (zoom, rotate, pitch)
        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Enable 3D terrain if available
        if (map.getSource("mapbox-dem")) {
          map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
        }

        // Add 3D buildings layer if style supports it
        const layers = map.getStyle().layers;
        if (layers) {
          // Find the first symbol layer to insert buildings before it
          const firstSymbolLayer = layers.find(
            (layer) => layer.type === "symbol"
          );

          if (firstSymbolLayer) {
            map.addLayer(
              {
                id: "3d-buildings",
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 14,
                layout: {
                  visibility: "none", // Hidden by default
                },
                paint: {
                  "fill-extrusion-color": "#aaa",
                  "fill-extrusion-height": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    14,
                    0,
                    15,
                    ["get", "height"],
                  ],
                  "fill-extrusion-base": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    14,
                    0,
                    15,
                    ["get", "min_height"],
                  ],
                  "fill-extrusion-opacity": 0.6,
                },
              },
              firstSymbolLayer.id
            );
          }
        }
      });

      map.on("error", () => {
        // Handle mapbox errors silently
      });

      mapRef.current = map;

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch {
      // Handle initialization errors silently
    }
  }, []);

  // Handle map click to set location for selected place
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) {
      return;
    }

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      // Handle custom location selection
      if (isSelectingCustomLocation) {
        const { lat, lng } = e.lngLat;
        setCustomSelectedLocation({ lat, lng });
        setIsSelectingCustomLocation(false);
        return;
      }

      // Handle place location setting
      if (selectedPlaceId && selectedDay) {
        const place = selectedDay.places.find((p) => p.id === selectedPlaceId);
        if (place) {
          // Set/update location
          updatePlace(selectedDay.id, selectedPlaceId, {
            latitude: e.lngLat.lat,
            longitude: e.lngLat.lng,
          });
          // Auto-deselect after setting location so user can drag map
          setTimeout(() => {
            selectPlace(undefined);
          }, 1000);
        }
      }
    };

    // Remove any existing click handlers first (if any)
    // Note: map.off() without handler removes all handlers for that event
    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [
    isMapLoaded,
    selectedPlaceId,
    selectedDay,
    updatePlace,
    selectPlace,
    isSelectingCustomLocation,
  ]);

  // Display marker for custom selected location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    if (customSelectedLocation) {
      // Remove existing marker if any
      if (customLocationMarkerRef.current) {
        customLocationMarkerRef.current.remove();
      }

      // Create marker for custom location
      const el = document.createElement("div");
      el.className = "custom-location-marker";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#3b82f6";
      el.style.border = "4px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      customLocationMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([customSelectedLocation.lng, customSelectedLocation.lat])
        .addTo(map);
    } else {
      // Remove marker if location is cleared
      if (customLocationMarkerRef.current) {
        customLocationMarkerRef.current.remove();
        customLocationMarkerRef.current = null;
      }
    }

    return () => {
      if (customLocationMarkerRef.current) {
        customLocationMarkerRef.current.remove();
        customLocationMarkerRef.current = null;
      }
    };
  }, [customSelectedLocation, isMapLoaded]);

  // Function to fetch route from Mapbox Directions API with caching
  const fetchRoute = async (
    coordinates: [number, number][],
    profile: RouteProfile
  ) => {
    if (coordinates.length < 2) {
      return null;
    }

    // Format coordinates as "lng,lat;lng,lat;..."
    const coordinatesString = coordinates
      .map((coord) => `${coord[0]},${coord[1]}`)
      .join(";");

    // Check cache
    const cacheKey = `${coordinatesString}|${profile}`;
    const cached = routeCacheRef.current.get(cacheKey);
    if (cached) {
      setRouteInfo({ distance: cached.distance, duration: cached.duration });
      return cached.geometry;
    }

    try {
      setIsLoadingRoute(true);
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}?geometries=geojson&access_token=${MAPBOX_TOKEN}&overview=full&steps=true`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.geometry;
        const distance = route.distance; // meters
        const duration = route.duration; // seconds

        // Cache the result
        routeCacheRef.current.set(cacheKey, {
          coordinates: coordinatesString,
          profile,
          geometry,
          distance,
          duration,
        });

        setRouteInfo({ distance, duration });
        return geometry;
      }

      setRouteInfo(null);
      return null;
    } catch {
      setRouteInfo(null);
      return null;
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Format distance and duration for display
  const formatRouteInfo = useMemo(() => {
    if (!routeInfo) return null;

    const distanceKm = (routeInfo.distance / 1000).toFixed(1);
    const durationMinutes = Math.round(routeInfo.duration / 60);
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;

    let durationText = "";
    if (durationHours > 0) {
      durationText = `${durationHours} giờ ${remainingMinutes} phút`;
    } else {
      durationText = `${durationMinutes} phút`;
    }

    return {
      distance: `${distanceKm} km`,
      duration: durationText,
    };
  }, [routeInfo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) {
      return;
    }

    // Clear existing route layers and sources
    const style = map.getStyle();
    if (style && style.layers) {
      style.layers
        .filter((layer) => layer.id.startsWith("route-"))
        .forEach((layer) => {
          if (map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        });
    }
    if (style && style.sources) {
      Object.keys(style.sources).forEach((sourceId) => {
        if (sourceId.startsWith("route-") && map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
    }

    if (!selectedDay) {
      return;
    }

    const placesWithCoords = selectedDay.places.filter(
      (place) =>
        typeof place.longitude === "number" &&
        typeof place.latitude === "number"
    );

    // Base coordinates from places
    const placeCoords = placesWithCoords.map((place) => [
      place.longitude as number,
      place.latitude as number,
    ]) as [number, number][];

    // If using my location and we have GPS or manual location, prepend it as the starting point
    let coords: [number, number][] = placeCoords;
    if (useMyLocation) {
      if (position) {
        const { latitude, longitude } = position.coords;
        coords = [[longitude, latitude], ...placeCoords];
      } else if (manualUserLocation) {
        coords = [
          [manualUserLocation.lng, manualUserLocation.lat],
          ...placeCoords,
        ];
      }
    }

    if (coords.length === 0) {
      map.flyTo({ center: [105.8342, 21.0278], zoom: 12 });
      return;
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for each place
    selectedDay.places.forEach((place) => {
      if (
        typeof place.longitude === "number" &&
        typeof place.latitude === "number"
      ) {
        const el = document.createElement("div");
        el.className = "marker";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor =
          place.id === selectedPlaceId ? "#0ea5e9" : "#10b981";
        el.style.border = "3px solid white";
        el.style.cursor = "pointer";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

        const marker = new mapboxgl.Marker(el)
          .setLngLat([place.longitude, place.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers
    if (coords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds, { padding: 60, duration: 800 });

      // Fetch and draw route if we have 2+ points
      if (coords.length >= 2) {
        fetchRoute(coords, routeProfile).then((routeGeometry) => {
          // Map may have been unmounted or style reset while the request was in-flight
          const mapCurrent = mapRef.current;
          if (!mapCurrent || !isMapLoaded) {
            return;
          }

          if (!routeGeometry || !mapCurrent.getSource) {
            // Fallback to straight line if route fetch fails
            const sourceId = `route-${selectedDay.id}`;
            if (!mapCurrent.getSource(sourceId)) {
              mapCurrent.addSource(sourceId, {
                type: "geojson",
                data: {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: coords,
                  },
                  properties: {},
                },
              });
              mapCurrent.addLayer({
                id: sourceId,
                type: "line",
                source: sourceId,
                paint: {
                  "line-color": "#94a3b8",
                  "line-width": 3,
                  "line-opacity": 0.5,
                  "line-dasharray": [2, 2],
                },
              });
            }
            return;
          }

          const sourceId = `route-${selectedDay.id}`;
          if (!mapCurrent.getSource(sourceId)) {
            mapCurrent.addSource(sourceId, {
              type: "geojson",
              data: {
                type: "Feature",
                geometry: routeGeometry,
                properties: {},
              },
            });

            // Add route line layer
            mapCurrent.addLayer({
              id: sourceId,
              type: "line",
              source: sourceId,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#0ea5e9",
                "line-width": 5,
                "line-opacity": 0.8,
              },
            });

            // Add route outline for better visibility
            mapCurrent.addLayer(
              {
                id: `${sourceId}-outline`,
                type: "line",
                source: sourceId,
                layout: {
                  "line-join": "round",
                  "line-cap": "round",
                },
                paint: {
                  "line-color": "#ffffff",
                  "line-width": 7,
                  "line-opacity": 0.5,
                },
              },
              sourceId
            ); // Insert before the main route layer
          } else {
            // Update existing source
            const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
            source.setData({
              type: "Feature",
              geometry: routeGeometry,
              properties: {},
            });
          }
        });
      } else if (coords.length === 1) {
        // Single point - just center on it
        map.flyTo({
          center: coords[0],
          zoom: 15,
          duration: 800,
        });
      }
    }
  }, [
    selectedDay,
    isMapLoaded,
    selectedPlaceId,
    routeProfile,
    useMyLocation,
    position,
    manualUserLocation,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || !selectedDay || !selectedPlaceId) {
      return;
    }
    const place = selectedDay.places.find(
      (item) => item.id === selectedPlaceId
    );
    if (
      !place ||
      typeof place.longitude !== "number" ||
      typeof place.latitude !== "number"
    ) {
      return;
    }
    map.flyTo({
      center: [place.longitude, place.latitude],
      zoom: 15,
      essential: true,
    });
  }, [selectedPlaceId, selectedDay, isMapLoaded]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        style={{ pointerEvents: "auto" }}
      />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 pointer-events-none">
          <div className="text-sm text-slate-500">Loading map...</div>
        </div>
      )}
      {/* Place selection banner */}
      {isMapLoaded && selectedPlaceId && selectedDay && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-medium text-white shadow-lg pointer-events-auto animate-pulse">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Nhấp vào bản đồ để đặt vị trí cho &quot;
            {selectedDay.places.find((p) => p.id === selectedPlaceId)?.name}
            &quot;
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              selectPlace(undefined);
            }}
            className="ml-2 rounded-full bg-white/20 p-1 hover:bg-white/30 transition"
            title="Bỏ chọn để có thể kéo xem bản đồ"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {/* Use my location button - always visible */}
      {isMapLoaded && (
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleUseMyLocationClick();
            }}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium shadow-lg transition ${
              useMyLocation
                ? "bg-primary text-primary-foreground"
                : "bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-white"
            }`}
            title={
              useMyLocation
                ? "Tắt theo dõi vị trí của tôi"
                : "Dùng vị trí hiện tại của tôi"
            }
          >
            <LocateFixed
              className={`h-4 w-4 ${useMyLocation ? "animate-pulse" : ""}`}
            />
            <span>{useMyLocation ? "Đang dùng vị trí" : "Vị trí của tôi"}</span>
          </button>

          {/* Select custom location button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsSelectingCustomLocation(true);
              setShowNearbyPlaces(false); // Close nearby places if open
            }}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium shadow-lg transition ${
              isSelectingCustomLocation || customSelectedLocation
                ? "bg-primary text-primary-foreground"
                : "bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-white"
            }`}
            title="Chọn vị trí cụ thể trên bản đồ"
          >
            <Crosshair
              className={`h-4 w-4 ${
                isSelectingCustomLocation ? "animate-pulse" : ""
              }`}
            />
            <span>
              {isSelectingCustomLocation
                ? "Đang chọn..."
                : customSelectedLocation
                ? "Vị trí đã chọn"
                : "Chọn vị trí"}
            </span>
          </button>

          {/* Clear custom location button */}
          {customSelectedLocation && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCustomSelectedLocation(null);
                setIsSelectingCustomLocation(false);
              }}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium shadow-lg transition bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-white"
              title="Xóa vị trí đã chọn"
            >
              <X className="h-4 w-4" />
              <span>Xóa vị trí</span>
            </button>
          )}

          {/* Update location button - shown when location is active */}
          {useMyLocation && (position || manualUserLocation) && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelectingLocation(true);
                }}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium shadow-lg transition ${
                  isSelectingLocation
                    ? "bg-accent text-accent-foreground animate-pulse"
                    : "bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-white"
                }`}
                title="Cập nhật vị trí của bạn trên bản đồ"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isSelectingLocation ? "animate-spin" : ""
                  }`}
                />
                <span>
                  {isSelectingLocation ? "Đang chọn..." : "Cập nhật vị trí"}
                </span>
              </button>

              {/* Nearby places button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNearbyPlaces(!showNearbyPlaces);
                }}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium shadow-lg transition ${
                  showNearbyPlaces
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-white"
                }`}
                title="Xem địa điểm xung quanh"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {showNearbyPlaces ? "Ẩn gợi ý" : "Địa điểm gần đây"}
                </span>
              </button>
            </>
          )}
          {/* Selection mode indicator */}
          {isSelectingLocation && (
            <div className="mt-2 rounded-lg bg-accent/90 text-accent-foreground px-3 py-2 text-xs shadow-lg max-w-xs animate-pulse">
              <div className="font-medium mb-1">📍 Chọn vị trí của bạn</div>
              <div className="text-[10px] opacity-90">
                Nhấp vào bản đồ để cập nhật vị trí hiện tại
              </div>
            </div>
          )}

          {/* Custom location selection indicator */}
          {isSelectingCustomLocation && (
            <div className="mt-2 rounded-lg bg-primary/90 text-primary-foreground px-3 py-2 text-xs shadow-lg max-w-xs animate-pulse">
              <div className="font-medium mb-1">🎯 Chọn vị trí trên bản đồ</div>
              <div className="text-[10px] opacity-90">
                Nhấp vào bản đồ để chọn vị trí và tìm địa điểm xung quanh
              </div>
            </div>
          )}

          {/* Show nearby places button for custom location */}
          {customSelectedLocation && !isSelectingCustomLocation && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNearbyPlaces(!showNearbyPlaces);
              }}
              className={`mt-2 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium shadow-lg transition ${
                showNearbyPlaces
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-white"
              }`}
              title="Xem địa điểm xung quanh vị trí đã chọn"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {showNearbyPlaces ? "Ẩn địa điểm" : "Xem địa điểm xung quanh"}
              </span>
            </button>
          )}

          {/* GPS error message */}
          {useMyLocation && geoError && !position && !isSelectingLocation && (
            <div className="mt-2 rounded-lg bg-destructive/90 text-destructive-foreground px-3 py-2 text-xs shadow-lg max-w-xs">
              <div className="font-medium mb-1">
                ⚠️ Không thể track vị trí thực tế
              </div>
              <div className="mb-2 text-[11px]">{geoError}</div>
              <div className="text-[10px] opacity-90 mb-2 space-y-1">
                <div>
                  💡 <strong>Giải pháp:</strong> Nhấp vào bản đồ để đặt điểm
                  xuất phát thủ công.
                </div>
              </div>
              {manualUserLocation && (
                <div className="text-[10px] opacity-80 border-t border-destructive-foreground/20 pt-2 mt-2">
                  ✅ Đã đặt: {manualUserLocation.lat.toFixed(4)},{" "}
                  {manualUserLocation.lng.toFixed(4)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Weather Widget */}
      {isMapLoaded &&
        (() => {
          // Determine location for weather
          const weatherLocation =
            customSelectedLocation ||
            (position
              ? {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                }
              : null) ||
            (manualUserLocation
              ? { lat: manualUserLocation.lat, lng: manualUserLocation.lng }
              : null);

          if (!weatherLocation) return null;

          return (
            <div className="absolute top-47 left-3 z-20 flex flex-col gap-2">
              <WeatherWidget
                latitude={weatherLocation.lat}
                longitude={weatherLocation.lng}
              />
              {trip.days.length > 0 && (
                <WeatherForecast
                  latitude={weatherLocation.lat}
                  longitude={weatherLocation.lng}
                />
              )}
            </div>
          );
        })()}

      {/* Route Profile Selector and Info */}
      {isMapLoaded &&
        selectedDay &&
        (() => {
          const placesWithCoords = selectedDay.places.filter(
            (place) =>
              typeof place.longitude === "number" &&
              typeof place.latitude === "number"
          );

          // Check if route includes user location
          const hasUserLocation =
            useMyLocation && (!!position || !!manualUserLocation);
          const hasRoute =
            (hasUserLocation && placesWithCoords.length >= 1) ||
            placesWithCoords.length >= 2;

          if (!hasRoute) return null;

          return (
            <div className="absolute top-30 right-3 z-20 flex flex-col gap-2">
              {/* 3D Toggle Button */}
              <button
                type="button"
                onClick={() => setIs3DMode(!is3DMode)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-lg transition ${
                  is3DMode
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-white"
                }`}
                title={is3DMode ? "Tắt chế độ 3D" : "Bật chế độ 3D"}
              >
                {is3DMode ? (
                  <MapIcon className="h-4 w-4" />
                ) : (
                  <Box className="h-4 w-4" />
                )}
                <span>{is3DMode ? "2D" : "3D"}</span>
              </button>

              <div className="flex items-center gap-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRouteProfile("driving")}
                  className={`px-3 py-2 transition ${
                    routeProfile === "driving"
                      ? "bg-sky-500 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Đi bằng ô tô"
                >
                  <Car className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRouteProfile("walking")}
                  className={`px-3 py-2 transition ${
                    routeProfile === "walking"
                      ? "bg-sky-500 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Đi bộ"
                >
                  <Footprints className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRouteProfile("cycling")}
                  className={`px-3 py-2 transition ${
                    routeProfile === "cycling"
                      ? "bg-sky-500 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Đi bằng xe đạp"
                >
                  <Bike className="h-4 w-4" />
                </button>
              </div>

              {/* Route Info */}
              {formatRouteInfo && (
                <div className="rounded-lg bg-white/95 backdrop-blur-sm px-3 py-2 text-xs text-slate-700 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-sky-500" />
                    <div className="flex-1">
                      {hasUserLocation && (
                        <div className="text-[10px] text-sky-600 font-medium mb-0.5">
                          📍 Từ vị trí của bạn
                        </div>
                      )}
                      <div className="font-medium">
                        {formatRouteInfo.distance}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatRouteInfo.duration}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingRoute && (
                <div className="rounded-lg bg-white/95 backdrop-blur-sm px-3 py-2 text-xs text-slate-600 shadow-lg">
                  Đang tính toán đường đi...
                </div>
              )}
            </div>
          );
        })()}

      {isMapLoaded && !selectedPlaceId && (
        <div className="absolute bottom-3 left-3 z-20 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-2 text-xs text-slate-600 shadow-md pointer-events-none">
          💡 Mẹo: Chọn một địa điểm, sau đó nhấp vào bản đồ để đặt vị trí
        </div>
      )}

      {/* Nearby Places Panel for Custom Selected Location */}
      {showNearbyPlaces &&
        customSelectedLocation &&
        !showNearbyPlacesForPlaceId && (
          <NearbyPlaces
            latitude={customSelectedLocation.lat}
            longitude={customSelectedLocation.lng}
            radius={10000}
            onClose={() => setShowNearbyPlaces(false)}
          />
        )}

      {/* Nearby Places Panel for User Location */}
      {showNearbyPlaces &&
        !customSelectedLocation &&
        (position || manualUserLocation) &&
        !showNearbyPlacesForPlaceId && (
          <NearbyPlaces
            latitude={
              position ? position.coords.latitude : manualUserLocation!.lat
            }
            longitude={
              position ? position.coords.longitude : manualUserLocation!.lng
            }
            radius={10000}
            onClose={() => setShowNearbyPlaces(false)}
          />
        )}

      {/* Nearby Places Panel for Selected Place */}
      {showNearbyPlacesForPlaceId &&
        (() => {
          const place = selectedDay?.places.find(
            (p) => p.id === showNearbyPlacesForPlaceId
          );
          if (place?.latitude && place?.longitude) {
            return (
              <NearbyPlaces
                latitude={place.latitude}
                longitude={place.longitude}
                radius={10000}
                onClose={() => showNearbyPlacesForPlace(undefined)}
              />
            );
          }
          return null;
        })()}

      {/* AI Chat Assistant */}
      <PlaceChatAssistant
        userLocation={
          position
            ? { lat: position.coords.latitude, lng: position.coords.longitude }
            : manualUserLocation
        }
      />
    </div>
  );
}
