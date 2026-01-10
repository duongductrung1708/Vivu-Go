"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ItineraryShare {
  id: string;
  itinerary_id: string;
  created_by: string;
  share_token: string;
  permission: "read" | "edit";
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItineraryCollaborator {
  id: string;
  itinerary_id: string;
  user_id: string;
  invited_by: string;
  permission: "read" | "edit";
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
  user_email?: string; // Joined from auth.users
  user_name?: string; // Joined from auth.users
}

export interface CreateShareInput {
  itinerary_id: string;
  permission: "read" | "edit";
  expires_at?: string; // ISO date string
}

export interface InviteCollaboratorInput {
  itinerary_id: string;
  email: string;
  permission: "read" | "edit";
}

// Get all shares for an itinerary
export function useItineraryShares(itineraryId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["itinerary-shares", itineraryId],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("itinerary_shares")
        .select("*")
        .eq("itinerary_id", itineraryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as ItineraryShare[]) || [];
    },
    enabled: !!user && !!itineraryId,
  });
}

// Get share by token (for accessing shared itinerary)
export function useShareByToken(token: string) {
  return useQuery({
    queryKey: ["share-by-token", token],
    queryFn: async () => {
      // First, verify the share token exists and get share info
      const { data: shareData, error: shareError } = await supabase
        .from("itinerary_shares")
        .select("*")
        .eq("share_token", token)
        .eq("is_active", true)
        .single();

      if (shareError) throw shareError;
      
      // Check if expired
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        throw new Error("Share link has expired");
      }

      // Use the SECURITY DEFINER function to get itinerary (bypasses RLS)
      const { data: itineraryData, error: itineraryError } = await supabase
        .rpc("get_itinerary_by_share_token", { p_token: token });

      if (itineraryError) throw itineraryError;
      
      if (!itineraryData || itineraryData.length === 0) {
        throw new Error("Itinerary not found");
      }

      const itinerary = itineraryData[0];

      // Return in the same format as before for compatibility
      return {
        ...shareData,
        itineraries: {
          id: itinerary.id,
          user_id: itinerary.user_id,
          title: itinerary.title,
          description: itinerary.description,
          start_date: itinerary.start_date,
          end_date: itinerary.end_date,
          total_budget: itinerary.total_budget,
          people_count: itinerary.people_count,
          is_public: itinerary.is_public,
          trip_data: itinerary.trip_data,
          created_at: itinerary.created_at,
          updated_at: itinerary.updated_at,
        },
        permission: itinerary.share_permission || shareData.permission,
      };
    },
    enabled: !!token,
  });
}

// Create a share link
export function useCreateShare() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateShareInput) => {
      if (!user) throw new Error("User not authenticated");

      // Generate token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc("generate_share_token");

      if (tokenError) throw tokenError;

      const shareToken = tokenData || crypto.randomUUID().replace(/-/g, "");

      const { data, error } = await supabase
        .from("itinerary_shares")
        .insert({
          itinerary_id: input.itinerary_id,
          created_by: user.id,
          share_token: shareToken,
          permission: input.permission,
          expires_at: input.expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ItineraryShare;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["itinerary-shares", variables.itinerary_id],
      });
    },
  });
}

// Update share
export function useUpdateShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareId,
      updates,
    }: {
      shareId: string;
      updates: Partial<Pick<ItineraryShare, "permission" | "expires_at" | "is_active">>;
    }) => {
      const { data, error } = await supabase
        .from("itinerary_shares")
        .update(updates)
        .eq("id", shareId)
        .select()
        .single();

      if (error) throw error;
      return data as ItineraryShare;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["itinerary-shares", data.itinerary_id],
      });
    },
  });
}

// Delete share
export function useDeleteShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shareId, itineraryId }: { shareId: string; itineraryId: string }) => {
      const { error } = await supabase
        .from("itinerary_shares")
        .delete()
        .eq("id", shareId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["itinerary-shares", variables.itineraryId],
      });
    },
  });
}

// Get collaborators for an itinerary
export function useItineraryCollaborators(itineraryId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["itinerary-collaborators", itineraryId],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("itinerary_collaborators")
        .select(`
          *,
          user:user_id (
            email,
            raw_user_meta_data->full_name
          )
        `)
        .eq("itinerary_id", itineraryId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to include user info
      return (data || []).map((item: any) => ({
        ...item,
        user_email: item.user?.email,
        user_name: item.user?.raw_user_meta_data?.full_name,
      })) as ItineraryCollaborator[];
    },
    enabled: !!user && !!itineraryId,
  });
}

// Invite collaborator by email
export function useInviteCollaborator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteCollaboratorInput) => {
      if (!user) throw new Error("User not authenticated");

      // Use RPC function to invite collaborator by email
      const { data, error } = await supabase.rpc('invite_collaborator_by_email', {
        p_itinerary_id: input.itinerary_id,
        p_email: input.email,
        p_permission: input.permission,
        p_invited_by: user.id
      });

      if (error) {
        throw new Error(error.message || "Không tìm thấy người dùng với email này. Người dùng cần đăng ký tài khoản trước.");
      }

      // Get itinerary title for email
      const { data: itinerary } = await supabase
        .from("itineraries")
        .select("title")
        .eq("id", input.itinerary_id)
        .single();

      // Get user name for email
      const { data: userData } = await supabase.auth.getUser();
      const inviterName = userData?.user?.user_metadata?.full_name || userData?.user?.email || "Một người dùng";

      // Send invitation email
      try {
        await fetch("/api/send-invitation-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: input.email,
            itineraryId: input.itinerary_id,
            itineraryTitle: itinerary?.title,
            inviterName,
            permission: input.permission,
          }),
        });
      } catch (emailError) {
        // Don't fail the invitation if email fails
        console.error("Failed to send invitation email:", emailError);
      }

      return data as ItineraryCollaborator;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["itinerary-collaborators", data.itinerary_id],
      });
    },
  });
}

// Accept/decline collaboration invitation
export function useUpdateCollaborationStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collaborationId,
      status,
      itineraryId,
    }: {
      collaborationId: string;
      status: "accepted" | "declined";
      itineraryId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("itinerary_collaborators")
        .update({ status })
        .eq("id", collaborationId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as ItineraryCollaborator;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["itinerary-collaborators", variables.itineraryId],
      });
      queryClient.invalidateQueries({
        queryKey: ["itineraries"],
      });
    },
  });
}

// Remove collaborator
export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collaborationId,
      itineraryId,
    }: {
      collaborationId: string;
      itineraryId: string;
    }) => {
      const { error } = await supabase
        .from("itinerary_collaborators")
        .delete()
        .eq("id", collaborationId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["itinerary-collaborators", variables.itineraryId],
      });
    },
  });
}

// Get user's pending invitations
export function usePendingInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pending-invitations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("itinerary_collaborators")
        .select(`
          *,
          itinerary:itinerary_id (
            id,
            title,
            description
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
