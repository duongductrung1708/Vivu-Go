"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";

export default function TripPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
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
        title: t("trip.loginRequired"),
        description: t("trip.loginRequiredDescription"),
      });
      router.push("/auth");
      return;
    }

    if (!saveTitle.trim()) {
      toast({
        variant: "destructive",
        title: t("trip.nameRequired"),
        description: t("trip.nameRequiredDescription"),
      });
      return;
    }

    if (trip.days.length === 0) {
      toast({
        variant: "destructive",
        title: t("trip.daysRequired"),
        description: t("trip.daysRequiredDescription"),
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
        title: t("trip.saveSuccess"),
        description: t("trip.saveSuccessDescription"),
      });

      setShowSaveDialog(false);
      setSaveTitle("");
      setSaveDescription("");

      // Redirect to dashboard after saving
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("trip.saveError"),
        description: error instanceof Error ? error.message : t("trip.saveErrorDescription"),
      });
    }
  };

  if (!isMounted || authLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-background text-foreground flex h-screen overflow-hidden font-sans">
      <Navbar variant="fixed" />
      <main className="relative flex h-full w-full flex-col gap-2 p-2 pt-24 md:flex-row md:gap-3 md:p-3 md:pt-24">
        {/* Toggle Sidebar Button */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`bg-card border-border fixed z-50 rounded-full border p-2 shadow-lg transition-all hover:scale-110 hover:shadow-xl ${
            isSidebarCollapsed
              ? "top-20 left-4"
              : isMobile
                ? "top-20 left-4"
                : "top-20 left-[calc(420px+0.5rem)]"
          }`}
          aria-label={isSidebarCollapsed ? t("itinerary.openSidebar") : t("itinerary.closeSidebar")}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="text-foreground h-5 w-5" />
          ) : (
            <PanelLeftClose className="text-foreground h-5 w-5" />
          )}
        </button>

        {/* Mobile: Use Sheet (Drawer) */}
        {isMobile ? (
          <Sheet open={!isSidebarCollapsed} onOpenChange={(open) => setIsSidebarCollapsed(!open)}>
            <SheetContent side="left" className="w-[85vw] overflow-hidden p-0 sm:w-[420px]">
              <SheetTitle className="sr-only">{t("itinerary.sidebarTitle")}</SheetTitle>
              <div className="flex h-full flex-col gap-2 overflow-hidden p-2">
                <div className="bg-card border-border shrink-0 rounded-3xl border p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {t("trip.budgetOverview", "Tổng quan ngân sách")}
                      </p>
                      <h2 className="text-card-foreground text-base font-semibold">
                        {trip.days.length} {t("itinerary.days")}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
                          {t("itinerary.total")}
                        </p>
                        <p className="text-card-foreground text-sm font-semibold">
                          {totalCost.toLocaleString(i18n.language === "en" ? "en-US" : "vi-VN")}{" "}
                          {i18n.language === "en" ? "VND" : "đ"}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {costPerPerson.toLocaleString(i18n.language === "en" ? "en-US" : "vi-VN")}{" "}
                          {t("itinerary.perPerson")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConfig(!showConfig)}
                        className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1.5 transition-colors"
                        title={t("itinerary.editConfig")}
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    className="from-primary to-accent w-full bg-linear-to-r hover:opacity-90"
                    disabled={trip.days.length === 0}
                    aria-label={t("trip.save")}
                  >
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t("trip.save")}</span>
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
              isSidebarCollapsed ? "pointer-events-none w-0 opacity-0" : "w-[420px] opacity-100"
            }`}
          >
            <div className="bg-card border-border shrink-0 rounded-3xl border p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("trip.budgetOverview", "Tổng quan ngân sách")}
                  </p>
                  <h2 className="text-card-foreground text-base font-semibold">
                    {trip.days.length} {t("itinerary.days")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
                      {t("itinerary.total")}
                    </p>
                    <p className="text-card-foreground text-sm font-semibold">
                      {totalCost.toLocaleString(i18n.language === "en" ? "en-US" : "vi-VN")}{" "}
                      {i18n.language === "en" ? "VND" : "đ"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {costPerPerson.toLocaleString(i18n.language === "en" ? "en-US" : "vi-VN")}{" "}
                      {t("itinerary.perPerson")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1.5 transition-colors"
                    title={t("itinerary.editConfig")}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Button
                onClick={() => setShowSaveDialog(true)}
                className="from-primary to-accent w-full bg-linear-to-r hover:opacity-90"
                disabled={trip.days.length === 0}
                aria-label={t("trip.save")}
              >
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("trip.save")}</span>
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
            <DialogTitle>{t("trip.saveDialog.title")}</DialogTitle>
            <DialogDescription>{t("trip.saveDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="save-title">{t("trip.saveDialog.name")} *</Label>
              <Input
                id="save-title"
                placeholder={t("trip.saveDialog.namePlaceholder")}
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="save-description">{t("trip.saveDialog.description")}</Label>
              <Textarea
                id="save-description"
                placeholder={t("trip.saveDialog.descriptionPlaceholder")}
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">
                {t("trip.saveDialog.cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!saveTitle.trim() || createItinerary.isPending}
                className="from-primary to-accent flex-1 bg-linear-to-r hover:opacity-90"
              >
                {createItinerary.isPending
                  ? t("trip.saveDialog.saving")
                  : t("trip.saveDialog.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
