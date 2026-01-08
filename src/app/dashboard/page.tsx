"use client";

import Dashboard from "@/components/Dashboard";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <Dashboard />;
}
