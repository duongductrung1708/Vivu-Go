"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Itinerary } from "./useItineraries";
import type { Trip } from "@/store/useTripStore";

/**
 * Hook to subscribe to realtime changes for an itinerary
 * Automatically updates React Query cache and Zustand store when changes occur
 */
export function useItineraryRealtime(
  itineraryId: string | undefined,
  setTrip?: (trip: Trip) => void,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isApplyingRemoteChange, setIsApplyingRemoteChange] = useState(false);
  const lastLocalUpdateRef = useRef<string>("");
  const lastRemoteUpdateRef = useRef<string>("");

  useEffect(() => {
    if (!itineraryId) return;

    const channel = supabase
      .channel(`itinerary:${itineraryId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "itineraries",
          filter: `id=eq.${itineraryId}`,
        },
        (payload) => {
          const updatedItinerary = payload.new as Itinerary;
          const tripDataString = JSON.stringify(updatedItinerary.trip_data);

          // Check if this is a different update than what we last saved
          if (tripDataString === lastLocalUpdateRef.current) {
            // This is our own update, just update cache
            queryClient.setQueryData(["itinerary", itineraryId], updatedItinerary);
            queryClient.invalidateQueries({ queryKey: ["itineraries"] });
            return;
          }

          // This is a remote update
          if (tripDataString !== lastRemoteUpdateRef.current) {
            setIsApplyingRemoteChange(true);

            // Always update React Query cache
            queryClient.setQueryData(["itinerary", itineraryId], updatedItinerary);

            // Sync with Zustand store if setTrip is provided
            if (setTrip && updatedItinerary.trip_data) {
              setTrip({
                ...updatedItinerary.trip_data,
                name: updatedItinerary.title || updatedItinerary.trip_data.name,
                startDate: updatedItinerary.start_date || updatedItinerary.trip_data.startDate,
                endDate: updatedItinerary.end_date || updatedItinerary.trip_data.endDate,
                peopleCount:
                  updatedItinerary.people_count ?? updatedItinerary.trip_data.peopleCount,
                totalBudget:
                  updatedItinerary.total_budget ?? updatedItinerary.trip_data.totalBudget,
              });
            }

            lastRemoteUpdateRef.current = tripDataString;

            // Reset flag after a short delay
            setTimeout(() => {
              setIsApplyingRemoteChange(false);
            }, 500);
          }

          // Also invalidate the list query
          queryClient.invalidateQueries({ queryKey: ["itineraries"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itineraryId, queryClient, user, setTrip]);

  return {
    isApplyingRemoteChange,
    markLocalUpdate: (tripData: Trip) => {
      lastLocalUpdateRef.current = JSON.stringify(tripData);
    },
  };
}
