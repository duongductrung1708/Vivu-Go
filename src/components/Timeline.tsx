"use client";

import { useMemo, useState } from "react";
import { DndContext, type DragEndEvent, type DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { format } from "date-fns";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { Plus, Users, Route, Loader2 } from "lucide-react";
import { useTripStore } from "@/store/useTripStore";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { PlaceCard } from "./PlaceCard";
import { PlaceSearchModal } from "./PlaceSearchModal";
import { DayWeather } from "./DayWeather";

import type { TimeSlot } from "@/store/useTripStore";

const timeSlotLabel: Record<TimeSlot, string> = {
  morning: "Sáng",
  noon: "Trưa",
  afternoon: "Chiều",
  evening: "Tối",
};

export function Timeline() {
  const isMounted = useIsMounted();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const {
    trip,
    selectedDayId,
    selectedPlaceId,
    selectDay,
    selectPlace,
    reorderPlaces,
    removePlace,
    updatePlace,
    getDayCost,
    showNearbyPlacesForPlace,
    optimizeRoute,
  } = useTripStore();

  // Configure sensors for drag and drop (including touch support)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    })
  );

  const selectedDay = useMemo(() => {
    const day = trip.days.find((day) => day.id === selectedDayId) ?? trip.days[0];
    // Ensure places is always an array
    if (day && !day.places) {
      return { ...day, places: [] };
    }
    return day;
  }, [trip.days, selectedDayId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActivePlaceId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlaceId(null);
    if (!over || !selectedDay || !selectedDay.places) {
      return;
    }
    if (active.id === over.id) {
      return;
    }
    const oldIndex = selectedDay.places.findIndex(
      (place) => place.id === active.id
    );
    const newIndex = selectedDay.places.findIndex(
      (place) => place.id === over.id
    );
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    reorderPlaces(selectedDay.id, oldIndex, newIndex);
  };

  const dayCost = selectedDay ? getDayCost(selectedDay.id) : 0;

  // Check if selected day has places with coordinates
  const hasPlacesWithCoords = selectedDay && selectedDay.places
    ? selectedDay.places.some(
        (place) =>
          typeof place.latitude === "number" &&
          typeof place.longitude === "number"
      )
    : false;
  const placesWithCoordsCount = selectedDay && selectedDay.places
    ? selectedDay.places.filter(
        (place) =>
          typeof place.latitude === "number" &&
          typeof place.longitude === "number"
      ).length
    : 0;

  const handleOptimizeRoute = async () => {
    if (!selectedDay || placesWithCoordsCount < 2) {
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeRoute(selectedDay.id, "driving");
      if (result) {
        setRouteDistance(result.totalDistance);
      }
    } catch (error) {
      console.error("Error optimizing route:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Get location from trip places if available, otherwise return null
  const getLocation = () => {
    // Find first place with coordinates
    for (const day of trip.days) {
      for (const place of day.places) {
        if (place.latitude && place.longitude) {
          return {
            lat: place.latitude,
            lng: place.longitude,
          };
        }
      }
    }
    // Return null if no places with coordinates
    return null;
  };

  const location = getLocation();

  return (
    <div
      className="flex h-full flex-col gap-2 rounded-3xl bg-muted/80 p-3 border border-border/50"
      onClick={(e) => {
        // Click vào vùng trống của timeline container để bỏ chọn place
        const target = e.target as HTMLElement;
        // Chỉ bỏ chọn nếu click vào background của container, không phải vào các elements con
        if (
          (target === e.currentTarget ||
            target.classList.contains("rounded-3xl") ||
            target.classList.contains("bg-muted/80")) &&
          selectedPlaceId
        ) {
          selectPlace(undefined);
        }
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Chuyến đi
          </p>
          <h1 className="text-base font-semibold text-foreground">
            {trip.name}
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-card px-2.5 py-1 text-xs text-card-foreground shadow-sm border border-border">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>{trip.peopleCount} người</span>
        </div>
      </div>

      <LayoutGroup>
        <div className="shrink-0 flex gap-2 overflow-x-auto pb-1">
          {trip.days.map((day) => {
            const isActive = day.id === selectedDayId;
            const label = isMounted
              ? format(new Date(day.date), "EEE dd MMM")
              : day.date;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => selectDay(day.id)}
                className="relative inline-flex flex-col items-start rounded-2xl px-2.5 py-1.5 text-left text-xs text-foreground"
              >
                <span className="font-medium">{label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {day.places.length} địa điểm
                </span>
                {location && (
                  <DayWeather
                    latitude={location.lat}
                    longitude={location.lng}
                    date={day.date}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="day-indicator"
                    className="absolute inset-0 -z-10 rounded-2xl bg-card shadow-sm border border-border"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="shrink-0 space-y-2">
        <div className="flex items-center justify-between rounded-2xl bg-card px-3 py-1.5 text-xs text-card-foreground shadow-sm border border-border">
          <span>Tổng ngày</span>
          <span className="font-semibold text-foreground">
            {dayCost.toLocaleString("vi-VN")} đ
          </span>
        </div>

        {hasPlacesWithCoords && placesWithCoordsCount >= 2 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOptimizeRoute}
              disabled={isOptimizing}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang tối ưu...</span>
                </>
              ) : (
                <>
                  <Route className="h-3.5 w-3.5" />
                  <span>Tối ưu lịch trình ngắn nhất</span>
                </>
              )}
            </button>
            {routeDistance !== null && (
              <div className="rounded-2xl bg-card px-3 py-1.5 text-xs text-card-foreground shadow-sm border border-border">
                <span className="text-muted-foreground">Tổng: </span>
                <span className="font-semibold text-foreground">
                  {(routeDistance / 1000).toFixed(1)} km
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          className="flex-1 min-h-0 space-y-2 overflow-y-auto"
          onClick={(e) => {
            // Click vào vùng trống để bỏ chọn
            if (
              e.target === e.currentTarget ||
              (e.target as HTMLElement).classList.contains("space-y-2")
            ) {
              selectPlace(undefined);
            }
          }}
        >
          {selectedDay && (
            <SortableContext
              items={(selectedDay.places || []).map((place) => place.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence initial={false}>
                {(selectedDay.places || []).map((place) => (
                  <motion.div
                    key={place.id}
                    layout
                    layoutId={place.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <PlaceCard
                      place={place}
                      timeLabel={timeSlotLabel[place.timeSlot]}
                      isActive={place.id === selectedPlaceId}
                      onClick={() => {
                        // Toggle: Click again to deselect
                        if (place.id === selectedPlaceId) {
                          selectPlace(undefined);
                        } else {
                          selectPlace(place.id);
                        }
                      }}
                      onDelete={() => removePlace(selectedDay.id, place.id)}
                      onUpdateCost={(cost) =>
                        updatePlace(selectedDay.id, place.id, {
                          estimatedCost: cost,
                        })
                      }
                      onUpdateName={(name) =>
                        updatePlace(selectedDay.id, place.id, {
                          name,
                        })
                      }
                      onUpdateTimeSlot={(timeSlot) =>
                        updatePlace(selectedDay.id, place.id, {
                          timeSlot,
                        })
                      }
                      onUpdateCategory={(category) =>
                        updatePlace(selectedDay.id, place.id, {
                          category,
                        })
                      }
                      onUpdateTime={(time) =>
                        updatePlace(selectedDay.id, place.id, {
                          specificTime: time || undefined,
                        })
                      }
                      onRemoveLocation={() =>
                        updatePlace(selectedDay.id, place.id, {
                          latitude: undefined,
                          longitude: undefined,
                        })
                      }
                      onShowNearbyPlaces={() => {
                        showNearbyPlacesForPlace(place.id);
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
          )}
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/10 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm địa điểm (tìm kiếm)
          </button>
        </div>
        <DragOverlay>
          {activePlaceId && selectedDay ? (() => {
            const activePlace = selectedDay.places?.find(p => p.id === activePlaceId);
            return activePlace ? (
              <div className="rotate-3 opacity-90">
                <PlaceCard
                  place={activePlace}
                  timeLabel={timeSlotLabel[activePlace.timeSlot]}
                  isActive={false}
                  onClick={() => {}}
                  onDelete={() => {}}
                  onUpdateCost={() => {}}
                  onUpdateName={() => {}}
                  onUpdateTimeSlot={() => {}}
                  onUpdateCategory={() => {}}
                  onUpdateTime={() => {}}
                  onRemoveLocation={() => {}}
                  onShowNearbyPlaces={() => {}}
                />
              </div>
            ) : null;
          })() : null}
        </DragOverlay>
      </DndContext>

      {selectedDay && (
        <PlaceSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          dayId={selectedDay.id}
        />
      )}
    </div>
  );
}
