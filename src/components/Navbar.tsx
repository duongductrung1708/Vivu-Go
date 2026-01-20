"use client";

import { MapPin, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
  const { t } = useTranslation();

  // Extract itineraryId from pathname if not provided
  const currentItineraryId = itineraryId || pathname?.match(/\/itinerary\/([^/]+)/)?.[1];
  const activeUsers = useActiveUsers(currentItineraryId);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navClasses = cn(
    variant === "fixed" ? "fixed" : "absolute",
    "top-0 left-0 right-0 z-50 p-4",
    variant === "fixed" && "bg-background/80 backdrop-blur-sm border-b border-border shadow-sm",
    className,
  );

  return (
    <nav className={navClasses}>
      <div className="container mx-auto flex items-center justify-between px-0 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="from-primary to-accent flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">Vivu Go</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="inline" />
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center gap-3">
              {/* Active Users Avatars */}
              {activeUsers.length > 0 && (
                <div className="flex items-center gap-2 px-2">
                  <TooltipProvider>
                    <div className="flex -space-x-2">
                      {activeUsers.slice(0, 3).map((activeUser) => {
                        const initials =
                          activeUser.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || activeUser.email.charAt(0).toUpperCase();

                        return (
                          <Tooltip key={activeUser.userId}>
                            <TooltipTrigger asChild>
                              <Avatar className="border-background h-8 w-8 cursor-pointer border-2 transition-transform hover:scale-110">
                                <AvatarImage src={activeUser.avatarUrl} alt={activeUser.name} />
                                <AvatarFallback className="from-primary to-accent bg-linear-to-br text-xs text-white">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">{activeUser.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {t("common.editing", "Đang chỉnh sửa")}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {activeUsers.length > 3 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="border-background bg-secondary text-secondary-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold">
                              +{activeUsers.length - 3}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              {activeUsers.slice(3).map((u) => (
                                <p key={u.userId} className="text-sm">
                                  {u.name}
                                </p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              )}
              <Button
                className="bg-primary/10 text-primary hover:bg-primary/30 hover:text-primary-foreground flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors"
                onClick={() => router.push("/profile")}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push("/auth")}
              className="rounded-full"
              aria-label={t("navbar.login")}
            >
              <LogIn className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("navbar.login")}</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
