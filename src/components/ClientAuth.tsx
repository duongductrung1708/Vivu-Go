"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/Loading";

// Dynamically import Auth component to prevent SSR
const Auth = dynamic(() => import("@/pages/Auth").then((mod) => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loading />
    </div>
  ),
});

export default function ClientAuth() {
  return <Auth />;
}
