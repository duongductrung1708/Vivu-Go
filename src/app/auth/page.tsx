import ClientAuth from "@/components/ClientAuth";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";
// Prevent static generation
export const dynamicParams = true;

export default function AuthPage() {
  return <ClientAuth />;
}
