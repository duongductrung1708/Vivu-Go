"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShareByToken } from "@/hooks/useItinerarySharing";
import { useAuth } from "@/contexts/AuthContext";
import type { Itinerary } from "@/hooks/useItineraries";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Users,
  DollarSign,
  ArrowLeft,
  Lock,
  Edit,
  MapPin,
  Clock,
  Globe,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Navbar from "@/components/Navbar";
// import { useToast } from "@/hooks/use-toast";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";

export default function SharedItineraryPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token;
  const { user, loading: authLoading } = useAuth();
  const { data: shareData, isLoading, error } = useShareByToken(token || "");
  // const updateStatus = useUpdateCollaborationStatus();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user && token) {
      const returnUrl = `/share/${token}`;
      router.push(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, authLoading, token, router]);

  if (!token || isLoading || authLoading) {
    return <Loading />;
  }

  // Don't render content if user is not authenticated (will redirect)
  if (!user) {
    return <Loading />;
  }

  if (error || !shareData) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold">Không tìm thấy lịch trình</h2>
          <Button onClick={() => router.push("/dashboard")}>Quay lại Dashboard</Button>
        </div>
      </div>
    );
  }

  const itinerary = shareData.itineraries as Itinerary | null;

  if (!itinerary) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Không tìm thấy lịch trình</CardTitle>
            <CardDescription>
              Lịch trình được chia sẻ không còn tồn tại hoặc đã bị xóa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")}>Về trang chủ</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const canEdit = shareData.permission === "edit";

  return (
    <div className="bg-background min-h-screen">
      <Navbar variant="fixed" />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} aria-label="Về trang chủ">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Về trang chủ</span>
          </Button>
        </div>

        <Card className="from-card to-card/50 overflow-hidden border-2 bg-linear-to-br shadow-lg">
          <div className="from-primary/5 to-accent/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent" />

          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <CardTitle className="text-3xl font-bold">{itinerary.title}</CardTitle>
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                      canEdit ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {canEdit ? (
                      <>
                        <Edit className="h-4 w-4" />
                        <span>Có thể chỉnh sửa</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Chỉ đọc</span>
                      </>
                    )}
                  </div>
                </div>
                {itinerary.description && (
                  <CardDescription className="text-base leading-relaxed">
                    {itinerary.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6">
            {/* Stats badges */}
            {(() => {
              const tripData = itinerary.trip_data;
              const daysCount = tripData?.days?.length || 0;
              const placesCount =
                tripData?.days?.reduce((sum, day) => sum + (day.places?.length || 0), 0) || 0;

              return (
                (daysCount > 0 || placesCount > 0) && (
                  <div className="flex flex-wrap gap-3">
                    {daysCount > 0 && (
                      <div className="bg-primary/10 text-primary flex items-center gap-2 rounded-lg px-4 py-2">
                        <Clock className="h-5 w-5" />
                        <span className="font-semibold">{daysCount} ngày</span>
                      </div>
                    )}
                    {placesCount > 0 && (
                      <div className="bg-accent/10 text-accent flex items-center gap-2 rounded-lg px-4 py-2">
                        <MapPin className="h-5 w-5" />
                        <span className="font-semibold">{placesCount} điểm đến</span>
                      </div>
                    )}
                    {itinerary.is_public && (
                      <div className="bg-secondary flex items-center gap-2 rounded-lg px-4 py-2">
                        <Globe className="h-5 w-5" />
                        <span className="font-semibold">Công khai</span>
                      </div>
                    )}
                  </div>
                )
              );
            })()}

            {/* Info grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {itinerary.start_date && (
                <div className="bg-muted/50 flex items-start gap-3 rounded-lg border p-4">
                  <div className="bg-primary/10 text-primary shrink-0 rounded-lg p-2">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                      Ngày bắt đầu
                    </div>
                    <div className="text-lg font-semibold">
                      {format(new Date(itinerary.start_date), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </div>
                    {itinerary.end_date && (
                      <div className="text-muted-foreground mt-1 text-sm">
                        →{" "}
                        {format(new Date(itinerary.end_date), "dd/MM/yyyy", {
                          locale: vi,
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {itinerary.people_count > 0 && (
                <div className="bg-muted/50 flex items-start gap-3 rounded-lg border p-4">
                  <div className="bg-accent/10 text-accent shrink-0 rounded-lg p-2">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                      Số người
                    </div>
                    <div className="text-lg font-semibold">{itinerary.people_count} người</div>
                  </div>
                </div>
              )}
              {itinerary.total_budget > 0 && (
                <div className="bg-muted/50 flex items-start gap-3 rounded-lg border p-4">
                  <div className="shrink-0 rounded-lg bg-green-500/10 p-2 text-green-600 dark:text-green-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                      Ngân sách
                    </div>
                    <div className="text-lg font-semibold">
                      {itinerary.total_budget.toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Button
                onClick={() => router.push(`/itinerary/${itinerary.id}`)}
                className="from-primary to-accent h-12 w-full bg-linear-to-r text-base font-semibold transition-opacity hover:opacity-90"
                size="lg"
              >
                {canEdit ? "Mở để chỉnh sửa" : "Xem chi tiết"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
