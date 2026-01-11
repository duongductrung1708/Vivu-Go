"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapContainer } from "@/components/MapContainer";
import { Timeline } from "@/components/Timeline";
import { TripConfig } from "@/components/TripConfig";
import { useTripStore } from "@/store/useTripStore";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { Settings, Save, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateItinerary } from "@/hooks/useItineraries";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";

export default function TripPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showConfig, setShowConfig] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { getTotalCost, getCostPerPerson, trip, resetTrip } = useTripStore();
  const createItinerary = useCreateItinerary();

  const totalCost = isMounted ? getTotalCost() : 0;
  const costPerPerson = isMounted ? getCostPerPerson() : 0;

  // Reset trip store when creating a new itinerary
  useEffect(() => {
    resetTrip();
    setSaveTitle("");
    setSaveDescription("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize save title with trip name
  useEffect(() => {
    if (trip.name && trip.name !== "New Trip" && !saveTitle) {
      setSaveTitle(trip.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.name]);

  const handleSave = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để lưu lịch trình.",
      });
      router.push("/auth");
      return;
    }

    if (!saveTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập tên lịch trình.",
      });
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

    try {
      await createItinerary.mutateAsync({
        title: saveTitle,
        description: saveDescription || undefined,
        start_date: trip.startDate || undefined,
        end_date: trip.endDate || undefined,
        total_budget: trip.totalBudget || 0,
        people_count: trip.peopleCount || 1,
        trip_data: trip,
      });

      toast({
        title: "Thành công!",
        description: "Đã lưu lịch trình vào database.",
      });

      setShowSaveDialog(false);
      setSaveTitle("");
      setSaveDescription("");
      
      // Redirect to dashboard after saving
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu lịch trình. Vui lòng thử lại.",
      });
    }
  };

  if (!isMounted || authLoading) {
    return <Loading />;
  }

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
                <div className="shrink-0 rounded-3xl bg-card p-3 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Tổng quan ngân sách
                      </p>
                      <h2 className="text-base font-semibold text-card-foreground">
                        {trip.days.length} {trip.days.length === 1 ? "ngày" : "ngày"}
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
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    className="w-full bg-linear-to-r from-primary to-accent hover:opacity-90"
                    disabled={trip.days.length === 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Lưu lịch trình
                  </Button>
                </div>

                {showConfig && (
                  <div className="shrink-0 overflow-y-auto">
                    <TripConfig />
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  <Timeline />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          /* Desktop: Use regular sidebar */
          <section
            className={`flex h-full flex-col gap-2 overflow-hidden transition-all duration-300 ${
              isSidebarCollapsed
                ? "w-0 opacity-0 pointer-events-none"
                : "w-[420px] opacity-100"
            }`}
          >
          <div className="shrink-0 rounded-3xl bg-card p-3 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tổng quan ngân sách
                </p>
                <h2 className="text-base font-semibold text-card-foreground">
                  {trip.days.length} {trip.days.length === 1 ? "ngày" : "ngày"}
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
            <Button
              onClick={() => setShowSaveDialog(true)}
              className="w-full bg-linear-to-r from-primary to-accent hover:opacity-90"
              disabled={trip.days.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu lịch trình
            </Button>
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
        )}

        <section className="h-full w-full shrink-0 md:w-auto md:flex-1">
          <MapContainer sidebarCollapsed={isSidebarCollapsed} />
        </section>
      </main>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lưu lịch trình</DialogTitle>
            <DialogDescription>
              Lưu lịch trình của bạn vào database để quản lý và chia sẻ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="save-title">Tên lịch trình *</Label>
              <Input
                id="save-title"
                placeholder="VD: 3 ngày khám phá Hà Nội"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="save-description">Mô tả</Label>
              <Textarea
                id="save-description"
                placeholder="Mô tả ngắn về chuyến đi..."
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                disabled={!saveTitle.trim() || createItinerary.isPending}
                className="flex-1 bg-linear-to-r from-primary to-accent hover:opacity-90"
              >
                {createItinerary.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

