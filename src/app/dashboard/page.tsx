import ClientDashboard from "@/components/ClientDashboard";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";
// Prevent static generation
export const dynamicParams = true;

export default function DashboardPage() {
  return <ClientDashboard />;
}
