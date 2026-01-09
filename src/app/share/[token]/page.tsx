"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShareByToken } from "@/hooks/useItinerarySharing";
import { useAuth } from "@/contexts/AuthContext";
import type { Itinerary } from "@/hooks/useItineraries";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Không tìm thấy lịch trình
          </h2>
          <Button onClick={() => router.push("/dashboard")}>
            Quay lại Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const itinerary = shareData.itineraries as Itinerary | null;

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background">
      <Navbar variant="fixed" />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
        </div>

        <Card className="overflow-hidden border-2 shadow-lg bg-linear-to-br from-card to-card/50">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl font-bold">
                    {itinerary.title}
                  </CardTitle>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      canEdit
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {canEdit ? (
                      <>
                        <Edit className="w-4 h-4" />
                        <span>Có thể chỉnh sửa</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
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
                tripData?.days?.reduce(
                  (sum, day) => sum + (day.places?.length || 0),
                  0
                ) || 0;

              return (
                (daysCount > 0 || placesCount > 0) && (
                  <div className="flex flex-wrap gap-3">
                    {daysCount > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold">{daysCount} ngày</span>
                      </div>
                    )}
                    {placesCount > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent">
                        <MapPin className="w-5 h-5" />
                        <span className="font-semibold">
                          {placesCount} điểm đến
                        </span>
                      </div>
                    )}
                    {itinerary.is_public && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary">
                        <Globe className="w-5 h-5" />
                        <span className="font-semibold">Công khai</span>
                      </div>
                    )}
                  </div>
                )
              );
            })()}

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {itinerary.start_date && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Ngày bắt đầu
                    </div>
                    <div className="font-semibold text-lg">
                      {format(new Date(itinerary.start_date), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </div>
                    {itinerary.end_date && (
                      <div className="text-sm text-muted-foreground mt-1">
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
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Số người
                    </div>
                    <div className="font-semibold text-lg">
                      {itinerary.people_count} người
                    </div>
                  </div>
                </div>
              )}
              {itinerary.total_budget > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Ngân sách
                    </div>
                    <div className="font-semibold text-lg">
                      {itinerary.total_budget.toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => router.push(`/itinerary/${itinerary.id}`)}
                className="w-full h-12 text-base font-semibold bg-linear-to-r from-primary to-accent hover:opacity-90 transition-opacity"
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
