"use client";

import { MapPin, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavbarProps {
  variant?: "default" | "fixed";
  className?: string;
}

export default function Navbar({ variant = "default", className }: NavbarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();

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
      <div className="container mx-auto flex items-center justify-between">
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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="rounded-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
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
