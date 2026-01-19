"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Trip } from "@/store/useTripStore";

export type RouteProfile = "driving" | "walking" | "cycling";

export type RouteCacheEntry = {
  coordinates: string; // "lng,lat;lng,lat;..."
  profile: RouteProfile;
  geometry: GeoJSON.LineString;
  distance: number; // meters
  duration: number; // seconds
  created_at?: string; // ISO timestamp for debugging/invalidations
};

export type RouteCacheMap = Record<string, RouteCacheEntry>;

export interface Itinerary {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_budget: number;
  people_count: number;
  is_public: boolean;
  trip_data: Trip;
  route_cache?: RouteCacheMap;
  created_at: string;
  updated_at: string;
  version?: number; // For optimistic locking
}

export interface CreateItineraryInput {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  people_count?: number;
  is_public?: boolean;
  trip_data?: Trip;
  route_cache?: RouteCacheMap;
}

// Fetch all itineraries for the current user (including shared ones)
export function useItineraries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["itineraries", user?.id],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      // RLS policy will automatically filter to:
      // 1. Itineraries owned by user
      // 2. Public itineraries
      // 3. Itineraries where user is an accepted collaborator
      // So we don't need to filter by user_id here
      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data as Itinerary[]) || [];
    },
    enabled: !!user,
  });
}

// Create a new itinerary
export function useCreateItinerary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateItineraryInput) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("itineraries")
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description,
          start_date: input.start_date,
          end_date: input.end_date,
          total_budget: input.total_budget || 0,
          people_count: input.people_count || 1,
          is_public: input.is_public || false,
          trip_data: input.trip_data || {
            name: input.title,
            startDate: input.start_date || new Date().toISOString().slice(0, 10),
            endDate: input.end_date || new Date().toISOString().slice(0, 10),
            peopleCount: input.people_count || 1,
            totalBudget: input.total_budget || 0,
            days: [],
          },
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Itinerary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries", user?.id] });
    },
  });
}

// Update an existing itinerary with optimistic locking
export function useUpdateItinerary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      expectedVersion,
    }: {
      id: string;
      updates: Partial<CreateItineraryInput & { trip_data?: Trip }>;
      expectedVersion?: number; // For optimistic locking
    }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // If version is provided, check current version first (optimistic locking)
      if (expectedVersion !== undefined) {
        const { data: currentData, error: fetchError } = await supabase
          .from("itineraries")
          .select("version")
          .eq("id", id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        // Check for version conflict
        if (currentData && currentData.version !== expectedVersion) {
          // For auto-save, we can skip version check and let realtime handle sync
          // But for manual save, we should inform the user
          throw new Error(
            "Lịch trình đã được cập nhật bởi người khác. Vui lòng làm mới trang và thử lại."
          );
        }
      }

      // Perform the update
      const { data, error } = await supabase
        .from("itineraries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Không thể cập nhật lịch trình.");
      }

      return data as Itinerary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries", user?.id] });
    },
  });
}

// Delete an itinerary (only owner can delete)
export function useDeleteItinerary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Verify user is owner before deleting
      const { data: isOwner, error: ownerError } = await supabase.rpc(
        "user_owns_itinerary",
        {
          p_itinerary_id: id,
        }
      );

      if (ownerError) {
        throw new Error("Không thể xác minh quyền sở hữu");
      }

      if (!isOwner) {
        throw new Error("Chỉ chủ sở hữu mới có thể xóa lịch trình");
      }

      // RLS policy will also enforce this, but we check here for better error message
      const { error } = await supabase
        .from("itineraries")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries", user?.id] });
    },
  });
}

// Get a single itinerary by ID (including shared ones)
export function useItinerary(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["itinerary", id],
    queryFn: async () => {
      if (!user) {
        return null;
      }

      // RLS policy will automatically filter to:
      // 1. Itineraries owned by user
      // 2. Public itineraries
      // 3. Itineraries where user is an accepted collaborator
      // So we don't need to filter by user_id here
      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return (data as Itinerary) || null;
    },
    enabled: !!user && !!id,
  });
}

// (PDF export now uses itinerary.trip_data directly, so no extra hook needed)