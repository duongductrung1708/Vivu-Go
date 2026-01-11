"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PackingItem {
  id: string;
  itinerary_id: string;
  item_name: string;
  category?: string;
  is_checked: boolean;
  checked_by?: string;
  checked_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

export interface CreatePackingItemInput {
  itinerary_id: string;
  item_name: string;
  category?: string;
  sort_order?: number;
}

export interface UpdatePackingItemInput {
  item_name?: string;
  category?: string;
  is_checked?: boolean;
  sort_order?: number;
}

// Fetch all packing items for an itinerary
export function usePackingItems(itineraryId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["packing-items", itineraryId],
    queryFn: async () => {
      if (!user || !itineraryId) {
        return [];
      }

      const { data, error } = await supabase
        .from("packing_items")
        .select("*")
        .eq("itinerary_id", itineraryId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data as PackingItem[]) || [];
    },
    enabled: !!user && !!itineraryId,
  });
}

// Create a new packing item
export function useCreatePackingItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePackingItemInput) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get current max sort_order for this itinerary
      const { data: existingItems } = await supabase
        .from("packing_items")
        .select("sort_order")
        .eq("itinerary_id", input.itinerary_id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

      const nextSortOrder = existingItems?.sort_order
        ? existingItems.sort_order + 1
        : 0;

      const { data, error } = await supabase
        .from("packing_items")
        .insert({
          itinerary_id: input.itinerary_id,
          item_name: input.item_name,
          category: input.category,
          created_by: user.id,
          sort_order: input.sort_order ?? nextSortOrder,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as PackingItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["packing-items", variables.itinerary_id],
      });
    },
  });
}

// Update a packing item
export function useUpdatePackingItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      itineraryId,
      updates,
    }: {
      id: string;
      itineraryId: string;
      updates: UpdatePackingItemInput;
    }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // If toggling checked status, update checked_by and checked_at
      const updateData: any = { ...updates };
      if (updates.is_checked !== undefined) {
        if (updates.is_checked) {
          updateData.checked_by = user.id;
          updateData.checked_at = new Date().toISOString();
        } else {
          updateData.checked_by = null;
          updateData.checked_at = null;
        }
      }

      const { data, error } = await supabase
        .from("packing_items")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as PackingItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["packing-items", variables.itineraryId],
      });
    },
  });
}

// Delete a packing item
export function useDeletePackingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      itineraryId,
    }: {
      id: string;
      itineraryId: string;
    }) => {
      const { error } = await supabase
        .from("packing_items")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["packing-items", variables.itineraryId],
      });
    },
  });
}
