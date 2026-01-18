"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, Save, FileDown, PanelLeftClose, PanelLeftOpen, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { MapContainer } from "@/components/MapContainer";
import { Timeline } from "@/components/Timeline";
import { PackingList } from "@/components/PackingList";
import { TripConfig } from "@/components/TripConfig";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useItinerary, useUpdateItinerary } from "@/hooks/useItineraries";
import { useCanEditItinerary } from "@/hooks/useItinerarySharing";
import { useItineraryRealtime } from "@/hooks/useItineraryRealtime";
import { useTripStore } from "@/store/useTripStore";
import { useToast } from "@/hooks/use-toast";
import { exportItineraryToPDF } from "@/utils/pdfExport";
import { exportItineraryToGoogleCalendar } from "@/utils/googleCalendarExport";

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
  const { data: canEdit = false, isLoading: isLoadingPermission } = useCanEditItinerary(itineraryId);
  const updateItinerary = useUpdateItinerary();
  const { trip, setTrip, getTotalCost, getCostPerPerson } = useTripStore();
  const [showConfig, setShowConfig] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");
  const [showInfoCard, setShowInfoCard] = useState(true);
  const isMobile = useIsMobile();

  // Subscribe to realtime changes and sync with store
  const { isApplyingRemoteChange, markLocalUpdate } = useItineraryRealtime(itineraryId, setTrip);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTripRef = useRef<string>("");

  const totalCost = isMounted ? getTotalCost() : 0;
  const costPerPerson = isMounted ? getCostPerPerson() : 0;

  // Auto-save function with debounce
  const autoSave = useCallback(async () => {
    if (!user || !itineraryId || !canEdit || isApplyingRemoteChange) {
      return;
    }

    // Serialize trip to compare
    const tripString = JSON.stringify(trip);
    if (tripString === lastSavedTripRef.current) {
      return; // No changes
    }

    try {
      // For auto-save, skip version check to avoid conflicts during collaboration
      // Realtime will handle syncing changes from others
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
        // Don't use version check for auto-save - let database handle it
        // Version check is only for manual save to inform user of conflicts
        expectedVersion: undefined,
      });

      lastSavedTripRef.current = tripString;
      // Mark this as our local update to avoid syncing it back
      markLocalUpdate(trip);
    } catch (error: unknown) {
      // Silently fail for auto-save (user can manually save if needed)
      // Only log if it's not a version conflict (which is expected during collaboration)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Lịch trình đã được cập nhật")) {
        // Version conflict - this is expected during collaboration, realtime will sync
        // Don't log as error, just skip this auto-save
        return;
      } else {
        console.error("Auto-save failed:", error);
      }
    }
  }, [trip, itineraryId, user, canEdit, updateItinerary, isApplyingRemoteChange, markLocalUpdate]);

  // Auto-save when trip changes (debounced)
  useEffect(() => {
    if (!user || !itineraryId || !canEdit || isApplyingRemoteChange) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1 second debounce)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [trip, user, itineraryId, canEdit, autoSave, isApplyingRemoteChange]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  // Hydrate trip data from the saved itinerary (no localStorage)
  useEffect(() => {
    if (itinerary?.trip_data && !isApplyingRemoteChange) {
      const newTrip = {
        ...itinerary.trip_data,
        name: itinerary.title || itinerary.trip_data.name,
        startDate: itinerary.start_date || itinerary.trip_data.startDate,
        endDate: itinerary.end_date || itinerary.trip_data.endDate,
        peopleCount:
          itinerary.people_count ?? itinerary.trip_data.peopleCount,
        totalBudget:
          itinerary.total_budget ?? itinerary.trip_data.totalBudget,
      };
      setTrip(newTrip);
      // Update last saved reference
      lastSavedTripRef.current = JSON.stringify(newTrip);
    }
  }, [itinerary, setTrip, isApplyingRemoteChange]);

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
        expectedVersion: itinerary?.version, // Optimistic locking
      });

      toast({
        title: "Đã lưu",
        description: "Cập nhật lịch trình thành công.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Không thể lưu lịch trình. Vui lòng thử lại.";
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: errorMessage,
      });
    }
  };

  if (!itineraryId || !isMounted || authLoading || isLoading || isLoadingPermission) {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Vui lòng thử lại sau.";
      toast({
        variant: "destructive",
        title: "Lỗi khi xuất PDF",
        description: errorMessage,
      });
    }
  };

  const handleExportGoogleCalendar = () => {
    try {
      exportItineraryToGoogleCalendar(itinerary);
      toast({
        title: "Đã xuất Google Calendar",
        description: "File lịch trình đã được tải xuống. Mở file để thêm vào Google Calendar.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Vui lòng thử lại sau.";
      toast({
        variant: "destructive",
        title: "Lỗi khi xuất Google Calendar",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <Navbar variant="fixed" itineraryId={itineraryId} />
      <main className="flex h-full w-full flex-col gap-2 p-2 pt-24 md:flex-row md:gap-3 md:p-3 md:pt-24 relative">
        {/* Toggle Sidebar Button */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`fixed z-50 rounded-full bg-card border border-border p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 ${isSidebarCollapsed
            ? "left-4 top-20"
            : isMobile
              ? "left-4 top-20"
              : "left-[calc(420px+0.5rem)] top-20"
            }`}
          aria-label={isSidebarCollapsed ? "Mở sidebar" : "Thu sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 text-foreground" />
          ) : (
            <PanelLeftClose className="h-5 w-5 text-foreground" />
          )}
        </button>

        {/* Mobile: Use Sheet (Drawer) */}
        {isMobile ? (
          <Sheet open={!isSidebarCollapsed} onOpenChange={(open) => setIsSidebarCollapsed(!open)}>
            <SheetContent side="left" className="w-[85vw] sm:w-[420px] p-0 overflow-hidden">
              <SheetTitle className="sr-only">Sidebar điều hướng</SheetTitle>
              <div className="flex h-full flex-col gap-2 overflow-hidden p-2">
                {showInfoCard && (
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
                        <button
                          type="button"
                          onClick={() => setShowInfoCard(false)}
                          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Ẩn thông tin lịch trình"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
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
                        disabled={!canEdit || trip.days.length === 0 || updateItinerary.isPending}
                        title={!canEdit ? "Bạn chỉ có quyền xem, không thể chỉnh sửa" : ""}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateItinerary.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={handleExportPdf}>
                        <FileDown className="w-4 h-4 mr-2" />
                        Xuất PDF
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={handleExportGoogleCalendar}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Google Calendar
                      </Button>
                    </div>
                  </div>
                  </div>
                )}
                {!showInfoCard && (
                  <button
                    type="button"
                    onClick={() => setShowInfoCard(true)}
                    className="shrink-0 rounded-3xl bg-card p-2 shadow-sm border border-border text-center hover:bg-muted transition-colors"
                    title="Hiện thông tin lịch trình"
                  >
                    <ChevronDown className="h-4 w-4 mx-auto text-muted-foreground" />
                  </button>
                )}

                {showConfig && (
                  <div className="shrink-0 overflow-y-auto">
                    <TripConfig />
                  </div>
                )}

                <div className="flex-1 overflow-hidden flex flex-col">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 mb-2">
                      <TabsTrigger value="timeline">Lịch trình</TabsTrigger>
                      <TabsTrigger value="packing">Danh sách chuẩn bị</TabsTrigger>
                    </TabsList>
                    <TabsContent value="timeline" className="flex-1 overflow-hidden mt-0">
                      <div className="h-full overflow-y-auto">
                        <Timeline />
                      </div>
                    </TabsContent>
                    <TabsContent value="packing" className="flex-1 overflow-hidden mt-0">
                      <div className="h-full overflow-y-auto">
                        <PackingList itineraryId={itineraryId} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          /* Desktop: Use regular sidebar */
          <section
            className={`flex h-full flex-col gap-2 overflow-hidden transition-all duration-300 ${isSidebarCollapsed
              ? "w-0 opacity-0 pointer-events-none"
              : "w-[420px] opacity-100"
              }`}
          >
            {showInfoCard ? (
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
                    <button
                      type="button"
                      onClick={() => setShowInfoCard(false)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Ẩn thông tin lịch trình"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
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
                    disabled={!canEdit || trip.days.length === 0 || updateItinerary.isPending}
                    title={!canEdit ? "Bạn chỉ có quyền xem, không thể chỉnh sửa" : ""}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateItinerary.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleExportPdf}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Xuất PDF
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleExportGoogleCalendar}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Google Calendar
                  </Button>
                </div>
              </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowInfoCard(true)}
                className="shrink-0 rounded-3xl bg-card p-2 shadow-sm border border-border text-center hover:bg-muted transition-colors w-full"
                title="Hiện thông tin lịch trình"
              >
                <ChevronDown className="h-4 w-4 mx-auto text-muted-foreground" />
              </button>
            )}

            {showConfig && (
              <div className="shrink-0 overflow-y-auto">
                <TripConfig />
              </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="timeline">Lịch trình</TabsTrigger>
                  <TabsTrigger value="packing">Danh sách chuẩn bị</TabsTrigger>
                </TabsList>
                <TabsContent value="timeline" className="flex-1 overflow-hidden mt-0">
                  <div className="h-full overflow-y-auto">
                    <Timeline />
                  </div>
                </TabsContent>
                <TabsContent value="packing" className="flex-1 overflow-hidden mt-0">
                  <div className="h-full overflow-y-auto">
                    <PackingList itineraryId={itineraryId} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </section>
        )}

        <section className="h-full w-full shrink-0 md:w-auto md:flex-1">
          <MapContainer sidebarCollapsed={isSidebarCollapsed} />
        </section>
      </main>
    </div>
  );
}
