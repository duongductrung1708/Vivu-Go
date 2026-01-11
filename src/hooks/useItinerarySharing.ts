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
  inviter_email?: string; // Joined from auth.users for inviter
  inviter_name?: string; // Joined from auth.users for inviter
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

interface PendingInvitationRPCResult {
  id: string;
  itinerary_id: string;
  user_id: string;
  invited_by: string;
  permission: string;
  status: string;
  created_at: string;
  updated_at: string;
  inviter_email: string;
  inviter_name: string;
  itinerary_title: string;
  itinerary_description: string;
  itinerary_start_date: string | null;
  itinerary_end_date: string | null;
  itinerary_total_budget: number;
  itinerary_people_count: number;
  itinerary_trip_data: unknown;
}

interface PendingInvitationFallback {
  id: string;
  itinerary_id: string;
  user_id: string;
  invited_by: string;
  permission: string;
  status: string;
  created_at: string;
  updated_at: string;
  itinerary: {
    id: string;
    title: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    total_budget: number;
    people_count: number;
    trip_data: unknown;
  };
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
      // Use the SECURITY DEFINER function to get itinerary and share info (bypasses RLS)
      // This function verifies the token, checks expiration, and returns both share and itinerary data
      const { data: resultData, error: rpcError } = await supabase.rpc(
        "get_itinerary_by_share_token",
        { p_token: token }
      );

      if (rpcError) throw rpcError;

      if (!resultData || resultData.length === 0) {
        throw new Error("Share link không hợp lệ hoặc đã hết hạn");
      }

      const result = resultData[0];

      // Return in the same format as before for compatibility
      return {
        id: result.share_id,
        itinerary_id: result.id,
        created_by: result.share_created_by,
        share_token: token,
        permission: result.share_permission || "read",
        expires_at: result.share_expires_at,
        is_active: true,
        created_at: result.share_created_at,
        updated_at: result.share_created_at,
        itineraries: {
          id: result.id,
          user_id: result.user_id,
          title: result.title,
          description: result.description,
          start_date: result.start_date,
          end_date: result.end_date,
          total_budget: result.total_budget,
          people_count: result.people_count,
          is_public: result.is_public,
          trip_data: result.trip_data,
          created_at: result.created_at,
          updated_at: result.updated_at,
        },
        permission: result.share_permission || "read",
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
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        "generate_share_token"
      );

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
      updates: Partial<
        Pick<ItineraryShare, "permission" | "expires_at" | "is_active">
      >;
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
    mutationFn: async ({
      shareId,
    }: {
      shareId: string;
      itineraryId: string;
    }) => {
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

      // Try RPC function first (if migration has been run)
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_itinerary_collaborators",
        {
          p_itinerary_id: itineraryId,
        }
      );

      console.log("RPC call result:", {
        rpcData,
        rpcError,
        hasData: !!rpcData,
        dataLength: rpcData?.length,
      });

      // If RPC function exists and works, use it
      if (rpcError) {
        // Check if it's a "function does not exist" error
        if (
          rpcError.code === "42883" ||
          rpcError.message?.includes("does not exist") ||
          rpcError.message?.includes("function")
        ) {
          console.warn(
            "RPC function 'get_itinerary_collaborators' not found. Please run migration 006_add_get_collaborators_function.sql. Using fallback query.",
            rpcError
          );
        } else {
          // Other errors (permission, etc.) - log but still try fallback
          console.warn(
            "Error calling RPC function 'get_itinerary_collaborators':",
            rpcError
          );
        }
      } else if (rpcData !== null && rpcData !== undefined) {
        // RPC function succeeded - check if it has user_email/user_name
        const hasUserInfo = rpcData.some(
          (item: ItineraryCollaborator) => item.user_email || item.user_name
        );
        console.log("RPC function returned data:", {
          count: rpcData.length,
          hasUserInfo,
          sample: rpcData[0],
        });

        if (hasUserInfo || rpcData.length === 0) {
          // RPC function returned data with user info, or empty array
          return (rpcData || []) as ItineraryCollaborator[];
        } else {
          // RPC function returned data but without user info - might be permission issue
          console.warn(
            "RPC function returned data but without user_email/user_name. This might be a permission issue."
          );
        }
      }

      const { data, error } = await supabase
        .from("itinerary_collaborators")
        .select("*")
        .eq("itinerary_id", itineraryId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching collaborators:", error);
        throw error;
      }

      // Transform to match ItineraryCollaborator interface
      return (data || []).map((item) => ({
        ...item,
        user_email: undefined, // Will be undefined until RPC function is available
        user_name: undefined,
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
      const { data, error } = await supabase.rpc(
        "invite_collaborator_by_email",
        {
          p_itinerary_id: input.itinerary_id,
          p_email: input.email,
          p_permission: input.permission,
          p_invited_by: user.id,
        }
      );

      if (error) {
        throw new Error(
          error.message ||
            "Không tìm thấy người dùng với email này. Người dùng cần đăng ký tài khoản trước."
        );
      }

      // Get itinerary title for email
      const { data: itinerary } = await supabase
        .from("itineraries")
        .select("title")
        .eq("id", input.itinerary_id)
        .single();

      // Get user name for email
      const { data: userData } = await supabase.auth.getUser();
      const inviterName =
        userData?.user?.user_metadata?.full_name ||
        userData?.user?.email ||
        "Một người dùng";

      // Send invitation email
      try {
        const emailResponse = await fetch("/api/send-invitation-email", {
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

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok || !emailResult.success) {
          console.error("Failed to send invitation email:", emailResult);
          // Don't fail the invitation if email fails, but log the error
          // The invitation is still created in the database
        } else {
          console.log("Invitation email sent successfully:", emailResult);
        }
      } catch (emailError) {
        // Don't fail the invitation if email fails
        console.error("Error calling email API:", emailError);
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
      // Invalidate pending invitations so the list updates immediately
      queryClient.invalidateQueries({
        queryKey: ["pending-invitations"],
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

      // Try RPC function first (if migration has been run)
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_pending_invitations_with_inviter"
      );

      if (!rpcError && rpcData) {
        // Transform RPC data to match expected format
        const typedRpcData = rpcData as PendingInvitationRPCResult[];
        return (typedRpcData || []).map((item) => ({
          id: item.id,
          itinerary_id: item.itinerary_id,
          user_id: item.user_id,
          invited_by: item.invited_by,
          permission: item.permission,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          inviter_email: item.inviter_email,
          inviter_name: item.inviter_name,
          itinerary: {
            id: item.itinerary_id,
            title: item.itinerary_title,
            description: item.itinerary_description,
            start_date: item.itinerary_start_date,
            end_date: item.itinerary_end_date,
            total_budget: item.itinerary_total_budget,
            people_count: item.itinerary_people_count,
            trip_data: item.itinerary_trip_data,
          },
        }));
      }

      // Fallback to original query if RPC function doesn't exist
      if (rpcError && rpcError.code === "42883") {
        console.warn(
          "RPC function 'get_pending_invitations_with_inviter' not found. Please run migration 007_add_get_pending_invitations_with_inviter.sql. Using fallback query."
        );
      }

      const { data, error } = await supabase
        .from("itinerary_collaborators")
        .select(
          `
          *,
          itinerary:itinerary_id (
            id,
            title,
            description,
            start_date,
            end_date,
            total_budget,
            people_count,
            trip_data
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const typedData = data as PendingInvitationFallback[];
      return (typedData || []).map((item) => ({
        ...item,
        inviter_email: undefined,
        inviter_name: undefined,
      }));
    },
    enabled: !!user,
  });
}

// Check if user owns an itinerary
export function useIsItineraryOwner(itineraryId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-itinerary-owner", itineraryId, user?.id],
    queryFn: async () => {
      if (!user || !itineraryId) return false;

      // Use RPC function to check ownership (bypasses RLS)
      const { data: isOwner, error } = await supabase.rpc(
        "user_owns_itinerary",
        {
          p_itinerary_id: itineraryId,
        }
      );

      if (error) {
        // Fallback: try direct query
        const { data: itinerary } = await supabase
          .from("itineraries")
          .select("user_id")
          .eq("id", itineraryId)
          .single();
        return itinerary?.user_id === user.id;
      }

      return isOwner === true;
    },
    enabled: !!user && !!itineraryId,
  });
}

// Check if user can edit an itinerary
export function useCanEditItinerary(itineraryId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["can-edit-itinerary", itineraryId, user?.id],
    queryFn: async () => {
      if (!user || !itineraryId) return false;

      // Check if user is owner
      const { data: itinerary, error: itineraryError } = await supabase
        .from("itineraries")
        .select("user_id")
        .eq("id", itineraryId)
        .single();

      if (itineraryError) {
        // If can't access, might be RLS blocking - try RPC function
        const { data: isOwner } = await supabase.rpc("user_owns_itinerary", {
          p_itinerary_id: itineraryId,
        });
        if (isOwner) return true;
      } else {
        if (itinerary?.user_id === user.id) return true;
      }

      // Check if user is collaborator with edit permission using RPC function
      const { data: isEditor } = await supabase.rpc("user_is_collaborator", {
        p_itinerary_id: itineraryId,
        p_permission: "edit",
      });

      return isEditor === true;
    },
    enabled: !!user && !!itineraryId,
  });
}
