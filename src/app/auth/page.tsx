import { Suspense } from "react";
import ClientAuth from "@/components/ClientAuth";
import Loading from "@/components/Loading";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const runtime = "nodejs";
// Disable static generation completely
export const fetchCache = "force-no-store";

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading />
      </div>
    }>
      <ClientAuth />
    </Suspense>
  );
}
