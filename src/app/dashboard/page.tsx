import dynamicImport from "next/dynamic";
import Loading from "@/components/Loading";

// Dynamically import Dashboard component to prevent SSR
const Dashboard = dynamicImport(() => import("@/pages/Dashboard").then((mod) => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loading />
    </div>
  ),
});

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";
// Prevent static generation
export const dynamicParams = true;

export default function DashboardPage() {
  return <Dashboard />;
}
