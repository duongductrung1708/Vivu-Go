"use client";

import Auth from "@/components/Auth";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";

export default function AuthPage() {
  return <Auth />;
}
