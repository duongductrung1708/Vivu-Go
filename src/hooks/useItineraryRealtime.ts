"use client";

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Itinerary } from "./useItineraries";

/**
 * Hook to subscribe to realtime changes for an itinerary
 * Automatically updates React Query cache when changes occur
 */
export function useItineraryRealtime(itineraryId: string | undefined) {
  const queryClient = useQueryClient();

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
          // Update React Query cache with new data
          const updatedItinerary = payload.new as Itinerary;
          
          // Invalidate and refetch to ensure consistency
          queryClient.setQueryData(
            ["itinerary", itineraryId],
            updatedItinerary
          );
          
          // Also invalidate the list query
          queryClient.invalidateQueries({ queryKey: ["itineraries"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itineraryId, queryClient]);
}
