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
            if (Array.isArray(presences)) {
              presences.forEach((presence: Record<string, unknown>) => {
                const userData = presence.user as ActiveUser | undefined;
                if (userData && userData.userId !== user.id) {
                  users.push(userData);
                }
              });
            }
          });

          setActiveUsers(users);
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          const newUsers: ActiveUser[] = [];
          
          Object.values(newPresences || {}).forEach((presences) => {
            if (Array.isArray(presences)) {
              presences.forEach((presence: Record<string, unknown>) => {
                const userData = presence.user as ActiveUser | undefined;
                if (userData && userData.userId !== user.id) {
                  newUsers.push(userData);
                }
              });
            }
          });
          
          setActiveUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u.userId));
            const toAdd = newUsers.filter((u) => !existingIds.has(u.userId));
            return [...prev, ...toAdd];
          });
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          const leftUserIds = new Set<string>();
          
          Object.values(leftPresences || {}).forEach((presences) => {
            if (Array.isArray(presences)) {
              presences.forEach((presence: Record<string, unknown>) => {
                const userData = presence.user as ActiveUser | undefined;
                if (userData?.userId) {
                  leftUserIds.add(userData.userId);
                }
              });
            }
          });

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
