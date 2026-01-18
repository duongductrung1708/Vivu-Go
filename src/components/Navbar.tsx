"use client";

import { MapPin, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveUsers } from "@/hooks/useActiveUsers";
import { cn } from "@/lib/utils";

interface NavbarProps {
  variant?: "default" | "fixed";
  className?: string;
  itineraryId?: string;
}

export default function Navbar({ variant = "default", className, itineraryId }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Extract itineraryId from pathname if not provided
  const currentItineraryId = itineraryId || (pathname?.match(/\/itinerary\/([^/]+)/)?.[1]);
  const activeUsers = useActiveUsers(currentItineraryId);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navClasses = cn(
    variant === "fixed" ? "fixed" : "absolute",
    "top-0 left-0 right-0 z-50 p-4",
    variant === "fixed" && "bg-background/80 backdrop-blur-sm border-b border-border shadow-sm",
    className
  );

  return (
    <nav className={navClasses}>
      <div className="container mx-auto flex items-center justify-between px-0 lg:px-8">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">Vivu Go</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="inline" />
          {user ? (
            <div className="flex items-center gap-3">
              {/* Active Users Avatars */}
              {activeUsers.length > 0 && (
                <div className="flex items-center gap-2 px-2">
                  <TooltipProvider>
                    <div className="flex -space-x-2">
                      {activeUsers.slice(0, 3).map((activeUser) => {
                        const initials = activeUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || activeUser.email.charAt(0).toUpperCase();

                        return (
                          <Tooltip key={activeUser.userId}>
                            <TooltipTrigger asChild>
                              <Avatar className="w-8 h-8 border-2 border-background cursor-pointer hover:scale-110 transition-transform">
                                <AvatarImage src={activeUser.avatarUrl} alt={activeUser.name} />
                                <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">{activeUser.name}</p>
                              <p className="text-xs text-muted-foreground">Đang chỉnh sửa</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {activeUsers.length > 3 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-semibold text-secondary-foreground">
                              +{activeUsers.length - 3}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              {activeUsers.slice(3).map((u) => (
                                <p key={u.userId} className="text-sm">{u.name}</p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              )}
              <Button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/30 hover:text-primary-foreground transition-colors" onClick={() => router.push('/profile')}>
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push("/auth")}
              className="rounded-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Đăng nhập
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
