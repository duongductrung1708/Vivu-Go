"use client";

import { Suspense } from "react";
import Auth from "@/components/Auth";
import Loading from "@/components/Loading";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading />
      </div>
    }>
      <Auth />
    </Suspense>
  );
}
