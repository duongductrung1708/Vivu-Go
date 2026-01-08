"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/Loading";

// Dynamically import Dashboard component to prevent SSR
const Dashboard = dynamic(() => import("@/pages/Dashboard").then((mod) => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loading />
    </div>
  ),
});

export default function ClientDashboard() {
  return <Dashboard />;
}
