"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActiveUser {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Hook to track active users editing an itinerary using Supabase Realtime Presence
 */
export function useActiveUsers(itineraryId: string | undefined) {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    if (!itineraryId || !user) {
      setActiveUsers([]);
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupPresence = async () => {
      channel = supabase
        .channel(`itinerary-presence:${itineraryId}`, {
          config: {
            presence: {
              key: user.id,
            },
          },
        })
        .on("presence", { event: "sync" }, () => {
          if (!channel) return;
          const state = channel.presenceState();
          const users: ActiveUser[] = [];

          Object.values(state).forEach((presences) => {
            presences.forEach((presence: { user?: ActiveUser }) => {
              if (presence.user && presence.user.userId !== user.id) {
                users.push(presence.user);
              }
            });
          });

          setActiveUsers(users);
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          const newUsers = newPresences
            .map((p: { user?: ActiveUser }) => p.user)
            .filter((u): u is ActiveUser => u !== undefined && u.userId !== user.id);
          
          setActiveUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u.userId));
            const toAdd = newUsers.filter((u) => !existingIds.has(u.userId));
            return [...prev, ...toAdd];
          });
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          const leftUserIds = new Set(
            leftPresences.map((p: { user?: ActiveUser }) => p.user?.userId).filter(Boolean)
          );

          setActiveUsers((prev) => prev.filter((u) => !leftUserIds.has(u.userId)));
        });

      const subscribeStatus = await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED" && channel) {
          // Track current user as active
          const userData: ActiveUser = {
            userId: user.id,
            email: user.email || "",
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            avatarUrl: user.user_metadata?.avatar_url,
          };

          await channel.track({
            user: userData,
            online_at: new Date().toISOString(),
          });
        }
      });
    };

    setupPresence();

    return () => {
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
      setActiveUsers([]);
    };
  }, [itineraryId, user]);

  return activeUsers;
}
