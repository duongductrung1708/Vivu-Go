import { create } from "zustand";
import { optimizePlacesOrder } from "@/utils/routeOptimization";

export type TimeSlot = "morning" | "noon" | "afternoon" | "evening";

export type Place = {
  id: string;
  name: string;
  timeSlot: TimeSlot;
  category: "food" | "sightseeing" | "culture" | "coffee" | "shopping" | "other";
  estimatedCost: number;
  specificTime?: string; // Format: "HH:mm" (e.g., "09:30", "14:00")
  latitude?: number;
  longitude?: number;
};

export type Day = {
  id: string;
  date: string; // ISO date
  places: Place[];
};

export type Trip = {
  name: string;
  startDate: string;
  endDate: string;
  peopleCount: number;
  totalBudget: number;
  days: Day[];
};

type TripStore = {
  trip: Trip;
  selectedDayId: string;
  selectedPlaceId?: string;
  showNearbyPlacesForPlaceId?: string;
  setTrip: (trip: Trip) => void;
  resetTrip: () => void;
  setConfig: (config: {
    name: string;
    startDate: string;
    endDate: string;
    peopleCount: number;
    totalBudget: number;
  }) => void;
  selectDay: (dayId: string) => void;
  selectPlace: (placeId?: string) => void;
  showNearbyPlacesForPlace: (placeId?: string) => void;
  addPlace: (dayId: string, place: Omit<Place, "id">) => void;
  updatePlace: (dayId: string, placeId: string, updates: Partial<Place>) => void;
  removePlace: (dayId: string, placeId: string) => void;
  reorderPlaces: (dayId: string, fromIndex: number, toIndex: number) => void;
  optimizeRoute: (dayId: string, profile?: "driving" | "walking" | "cycling") => Promise<{ totalDistance: number } | null>;
  getDayById: (dayId: string) => Day | undefined;
  getSelectedDay: () => Day | undefined;
  getDayCost: (dayId: string) => number;
  getTotalCost: () => number;
  getCostPerPerson: () => number;
};

const emptyTrip: Trip = {
  name: "New Trip",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  peopleCount: 1,
  totalBudget: 0,
  days: [],
};

export const useTripStore = create<TripStore>()(
  (set, get) => ({
      trip: emptyTrip,
      selectedDayId: "",
      selectedPlaceId: undefined,
      showNearbyPlacesForPlaceId: undefined,

      setTrip: (trip) =>
        set(() => ({
          trip,
          selectedDayId: trip.days[0]?.id ?? "",
          selectedPlaceId: undefined,
          showNearbyPlacesForPlaceId: undefined,
        })),

      resetTrip: () =>
        set(() => ({
          trip: emptyTrip,
          selectedDayId: "",
          selectedPlaceId: undefined,
          showNearbyPlacesForPlaceId: undefined,
        })),

      setConfig: ({ name, startDate, endDate, peopleCount, totalBudget }) => {
        set((state) => {
          const days: Day[] = [];
          const start = new Date(startDate);
          const end = new Date(endDate);
          for (
            let dateCursor = new Date(start);
            dateCursor <= end;
            dateCursor.setDate(dateCursor.getDate() + 1)
          ) {
            const iso = dateCursor.toISOString().slice(0, 10);
            const existing = state.trip.days.find(
              (day) => day.date === iso,
            );
            days.push(
              existing ?? {
                id: `day-${iso}`,
                date: iso,
                places: [],
              },
            );
          }
          return {
            trip: {
              ...state.trip,
              name,
              startDate,
              endDate,
              peopleCount,
              totalBudget,
              days,
            },
            selectedDayId: days[0]?.id ?? state.selectedDayId,
          };
        });
      },

      selectDay: (dayId) => set({ selectedDayId: dayId }),

      selectPlace: (placeId) => set({ selectedPlaceId: placeId }),

      showNearbyPlacesForPlace: (placeId) => set({ showNearbyPlacesForPlaceId: placeId }),

      addPlace: (dayId, place) =>
        set((state) => ({
          trip: {
            ...state.trip,
            days: state.trip.days.map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    places: [
                      ...day.places,
                      {
                        ...place,
                        id: `${dayId}-p-${Date.now()}`,
                      },
                    ],
                  }
                : day,
            ),
          },
        })),

      updatePlace: (dayId, placeId, updates) =>
        set((state) => ({
          trip: {
            ...state.trip,
            days: state.trip.days.map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    places: day.places.map((place) =>
                      place.id === placeId ? { ...place, ...updates } : place,
                    ),
                  }
                : day,
            ),
          },
        })),

      removePlace: (dayId, placeId) =>
        set((state) => ({
          trip: {
            ...state.trip,
            days: state.trip.days.map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    places: day.places.filter(
                      (placeItem) => placeItem.id !== placeId,
                    ),
                  }
                : day,
            ),
          },
        })),

      reorderPlaces: (dayId, fromIndex, toIndex) =>
        set((state) => {
          const day = state.trip.days.find((tripDay) => tripDay.id === dayId);
          if (!day) {
            return state;
          }
          const updated = [...day.places];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          return {
            trip: {
              ...state.trip,
              days: state.trip.days.map((tripDay) =>
                tripDay.id === dayId ? { ...tripDay, places: updated } : tripDay,
              ),
            },
          };
        }),

      optimizeRoute: async (dayId, profile = "driving") => {
        const day = get().trip.days.find((tripDay) => tripDay.id === dayId);
        if (!day || day.places.length < 2) {
          return null;
        }

        const result = await optimizePlacesOrder(day.places, profile);
        if (!result) {
          return null;
        }

        // Update places order
        set((state) => ({
          trip: {
            ...state.trip,
            days: state.trip.days.map((tripDay) =>
              tripDay.id === dayId
                ? { ...tripDay, places: result.optimizedPlaces }
                : tripDay,
            ),
          },
        }));

        return { totalDistance: result.totalDistance };
      },

      getDayById: (dayId) => get().trip.days.find((day) => day.id === dayId),

      getSelectedDay: () =>
        get().trip.days.find((day) => day.id === get().selectedDayId),

      getDayCost: (dayId) => {
        const day = get().trip.days.find((tripDay) => tripDay.id === dayId);
        if (!day) {
          return 0;
        }
        return day.places.reduce(
          (sum, place) => sum + (place.estimatedCost || 0),
          0,
        );
      },

      getTotalCost: () =>
        get().trip.days.reduce(
          (tripSum, day) =>
            tripSum +
            day.places.reduce(
              (sum, place) => sum + (place.estimatedCost || 0),
              0,
            ),
          0,
        ),

      getCostPerPerson: () => {
        const total = get().getTotalCost();
        const people = get().trip.peopleCount || 1;
        return Math.round(total / people);
      },
    }),
);


