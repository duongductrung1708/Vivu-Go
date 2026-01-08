"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Trip } from "@/store/useTripStore";

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
  created_at: string;
  updated_at: string;
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
}

// Fetch all itineraries for the current user
export function useItineraries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["itineraries", user?.id],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .eq("user_id", user.id)
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

// Update an existing itinerary
export function useUpdateItinerary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateItineraryInput & { trip_data?: Trip }>;
    }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("itineraries")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
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

// Delete an itinerary
export function useDeleteItinerary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("itineraries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries", user?.id] });
    },
  });
}

// Get a single itinerary by ID
export function useItinerary(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["itinerary", id],
    queryFn: async () => {
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        throw error;
      }

      return (data as Itinerary) || null;
    },
    enabled: !!user && !!id,
  });
}
