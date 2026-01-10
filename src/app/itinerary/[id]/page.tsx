"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, Save, FileDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { MapContainer } from "@/components/MapContainer";
import { Timeline } from "@/components/Timeline";
import { TripConfig } from "@/components/TripConfig";
import { Button } from "@/components/ui/button";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useAuth } from "@/contexts/AuthContext";
import { useItinerary, useUpdateItinerary } from "@/hooks/useItineraries";
import { useTripStore } from "@/store/useTripStore";
import { useToast } from "@/hooks/use-toast";
import { exportItineraryToPDF } from "@/utils/pdfExport";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";

export default function ItineraryDetailPage() {
  const params = useParams<{ id: string }>();
  const itineraryId = params?.id || "";
  const isMounted = useIsMounted();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { data: itinerary, isLoading } = useItinerary(itineraryId);
  const updateItinerary = useUpdateItinerary();
  const { trip, setTrip, getTotalCost, getCostPerPerson } = useTripStore();
  const [showConfig, setShowConfig] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const totalCost = isMounted ? getTotalCost() : 0;
  const costPerPerson = isMounted ? getCostPerPerson() : 0;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  // Hydrate trip data from the saved itinerary (no localStorage)
  useEffect(() => {
    if (itinerary?.trip_data) {
      setTrip({
        ...itinerary.trip_data,
        name: itinerary.title || itinerary.trip_data.name,
        startDate: itinerary.start_date || itinerary.trip_data.startDate,
        endDate: itinerary.end_date || itinerary.trip_data.endDate,
        peopleCount:
          itinerary.people_count ?? itinerary.trip_data.peopleCount,
        totalBudget:
          itinerary.total_budget ?? itinerary.trip_data.totalBudget,
      });
    }
  }, [itinerary, setTrip]);

  const handleSave = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để lưu thay đổi.",
      });
      router.push("/auth");
      return;
    }

    if (trip.days.length === 0) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một ngày vào lịch trình.",
      });
      return;
    }

    if (!itineraryId) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không tìm thấy ID lịch trình.",
      });
      return;
    }

    try {
      await updateItinerary.mutateAsync({
        id: itineraryId,
        updates: {
          title: trip.name,
          start_date: trip.startDate,
          end_date: trip.endDate,
          people_count: trip.peopleCount,
          total_budget: trip.totalBudget,
          trip_data: trip,
        },
      });

      toast({
        title: "Đã lưu",
        description: "Cập nhật lịch trình thành công.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error.message || "Không thể lưu lịch trình. Vui lòng thử lại.",
      });
    }
  };

  if (!itineraryId || !isMounted || authLoading || isLoading) {
    return <Loading />;
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Không tìm thấy lịch trình</p>
          <Button onClick={() => router.push("/dashboard")}>
            Quay lại Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleExportPdf = async () => {
    try {
      await exportItineraryToPDF(itinerary);
      toast({
        title: "Đã xuất PDF",
        description: "File PDF lịch trình đã được tải xuống.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi khi xuất PDF",
        description: error?.message || "Vui lòng thử lại sau.",
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <Navbar variant="fixed" />
      <main className="flex h-full w-full flex-col gap-2 p-2 pt-24 md:flex-row md:gap-3 md:p-3 md:pt-24 relative">
        {/* Toggle Sidebar Button */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`fixed z-50 rounded-full bg-card border border-border p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 ${
            isSidebarCollapsed
              ? "left-4 top-20"
              : "left-[calc(420px+0.5rem)] top-20 md:left-[calc(420px+0.5rem)]"
          }`}
          aria-label={isSidebarCollapsed ? "Mở sidebar" : "Thu sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 text-foreground" />
          ) : (
            <PanelLeftClose className="h-5 w-5 text-foreground" />
          )}
        </button>

        <section
          className={`flex h-full flex-col gap-2 overflow-hidden transition-all duration-300 ${
            isSidebarCollapsed
              ? "w-0 md:w-0 opacity-0 pointer-events-none"
              : "w-full md:w-[420px] opacity-100"
          }`}
        >
          <div className="shrink-0 rounded-3xl bg-card p-3 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lịch trình đã lưu
                </p>
                <h2 className="text-base font-semibold text-card-foreground">
                  {trip.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Tổng cộng
                  </p>
                  <p className="text-sm font-semibold text-card-foreground">
                    {totalCost.toLocaleString("vi-VN")} đ
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {costPerPerson.toLocaleString("vi-VN")} đ / người
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Chỉnh sửa cấu hình chuyến đi"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/dashboard")}
              >
                Trở lại
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-linear-to-r from-primary to-accent hover:opacity-90"
                disabled={trip.days.length === 0 || updateItinerary.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateItinerary.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleExportPdf}>
                <FileDown className="w-4 h-4 mr-2" />
                Xuất PDF
              </Button>
            </div>
          </div>

          {showConfig && (
            <div className="shrink-0 overflow-y-auto">
              <TripConfig />
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <Timeline />
          </div>
        </section>

        <section className="h-full w-full shrink-0 md:w-auto md:flex-1">
          <MapContainer sidebarCollapsed={isSidebarCollapsed} />
        </section>
      </main>
    </div>
  );
}
