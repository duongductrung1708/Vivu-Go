// Kỷ niệm chuyến đi: upload ảnh theo từng ngày (Supabase storage)
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Camera,
  Share2,
  UploadCloud,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useItinerary } from "@/hooks/useItineraries";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

type DayPhoto = {
  url: string;
  name: string;
};

function MemoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itineraryId = searchParams?.get("itineraryId") || "";
  const { user, loading: authLoading } = useAuth();
  const { data: itinerary, isLoading: itineraryLoading } = useItinerary(itineraryId);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [dragging, setDragging] = useState<{ dayId: string; index: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTargetDay, setUploadTargetDay] = useState<string | null>(null);
  const [photosByDay, setPhotosByDay] = useState<Record<string, DayPhoto[]>>({});
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!itineraryId || !itinerary?.trip_data?.days) return;
      setLoadingPhotos(true);
      const next: Record<string, DayPhoto[]> = {};
      for (const day of itinerary.trip_data.days) {
        const folder = `${itineraryId}/${day.id}`;
        const { data, error } = await supabase.storage.from("memory-photos").list(folder, {
          limit: 100,
        });
        if (error) {
          continue;
        }
        next[day.id] = (data || []).map((file) => {
          const { data: publicUrl } = supabase.storage
            .from("memory-photos")
            .getPublicUrl(`${folder}/${file.name}`);
          return {
            url: publicUrl.publicUrl,
            name: file.name,
          };
        });
      }
      setPhotosByDay(next);
      setLoadingPhotos(false);
    };
    loadPhotos();
  }, [itineraryId, itinerary?.trip_data?.days]);

  const days = useMemo(() => itinerary?.trip_data?.days ?? [], [itinerary?.trip_data?.days]);
  const totalPhotos = useMemo(
    () => Object.values(photosByDay).reduce((sum, arr) => sum + arr.length, 0),
    [photosByDay],
  );

  const handleExportAlbumPDF = async () => {
    if (!itinerary) return;

    // Flatten all photos with day labels
    const allPhotos: { dayLabel: string; url: string; name: string }[] = [];
    days.forEach((day, idx) => {
      const dayPhotos = photosByDay[day.id] || [];
      const dayLabel = `Ngày ${idx + 1} — ${day.date}`;
      dayPhotos.forEach((photo) => {
        allPhotos.push({
          dayLabel,
          url: photo.url,
          name: photo.name,
        });
      });
    });

    if (allPhotos.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("@/font/Quicksand-Regular-normal.js");
      await import("@/font/Quicksand-Bold-normal.js");

      const doc = new jsPDF("p", "mm", "a4");

      const loadImageAsDataUrl = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      for (let i = 0; i < allPhotos.length; i += 1) {
        const photo = allPhotos[i];
        if (i > 0) {
          doc.addPage();
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header
        doc.setFont("Quicksand-Bold", "normal");
        doc.setFontSize(14);
        doc.text(itinerary.title, 10, 15);

        doc.setFont("Quicksand-Regular", "normal");
        doc.setFontSize(11);
        doc.text(photo.dayLabel, 10, 25);

        // Image
        const dataUrl = await loadImageAsDataUrl(photo.url);
        const margin = 10;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - 50;

        // Simple aspect fit: assume landscape-ish photo
        const imgWidth = maxWidth;
        const imgHeight = maxHeight;

        // Infer image format from extension
        const lowerUrl = photo.url.toLowerCase();
        const formatType =
          lowerUrl.endsWith(".png") || lowerUrl.includes("image/png") ? "PNG" : "JPEG";

        doc.addImage(dataUrl, formatType, margin, 30, imgWidth, imgHeight, undefined, "FAST");
      }

      const safeTitle = itinerary.title.replace(/[^a-zA-Z0-9]/g, "_") || "album_ky_niem";
      doc.save(`${safeTitle}_memories.pdf`);
    } catch (error) {
      console.error("Export memories to PDF failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDragStart = (dayId: string, index: number) => {
    setDragging({ dayId, index });
  };

  const handleDrop = (dayId: string, index: number) => {
    if (!dragging || dragging.dayId !== dayId) return;

    const fromIndex = dragging.index;
    const toIndex = index;

    setPhotosByDay((prev) => {
      const dayPhotos = [...(prev[dayId] || [])];
      const [moved] = dayPhotos.splice(fromIndex, 1);
      dayPhotos.splice(toIndex, 0, moved);
      return {
        ...prev,
        [dayId]: dayPhotos,
      };
    });

    setDragging({ dayId, index: toIndex });
  };

  const handleUpload = async (dayId: string, file: File) => {
    if (!itineraryId) return;
    setIsUploading(true);
    setUploadTargetDay(dayId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${itineraryId}/${dayId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("memory-photos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;

      const { data: publicUrl } = supabase.storage.from("memory-photos").getPublicUrl(path);
      setPhotosByDay((prev) => ({
        ...prev,
        [dayId]: [...(prev[dayId] || []), { url: publicUrl.publicUrl, name: file.name }],
      }));
    } catch (error) {
      console.error("Upload photo failed:", error);
    } finally {
      setIsUploading(false);
      setUploadTargetDay(null);
    }
  };

  if (authLoading || itineraryLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-primary animate-pulse text-xl">Đang tải kỷ niệm...</div>
      </div>
    );
  }

  if (!itineraryId) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Thiếu itineraryId</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Vui lòng truy cập từ menu lịch trình.</p>
            <Button onClick={() => router.push("/dashboard")}>Quay lại Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold">Không tìm thấy lịch trình</h2>
          <Button onClick={() => router.push("/dashboard")}>Quay lại Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="from-background via-secondary/20 to-lavender/20 min-h-screen bg-linear-to-br">
      <Navbar variant="fixed" />
      <main className="mx-auto max-w-6xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        <div className="border-border top-45 z-40 border-b">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/itinerary/${itineraryId}`)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <h1 className="max-w-[220px] truncate text-base leading-snug font-semibold sm:max-w-none sm:text-xl sm:font-bold">
                    Kỷ niệm chuyến đi
                  </h1>
                  <p className="text-muted-foreground text-xs sm:truncate sm:text-sm">
                    {itinerary.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportAlbumPDF}
                  disabled={totalPhotos === 0 || isExporting}
                  aria-label="Xuất album PDF"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {isExporting ? "Đang xuất PDF..." : "Xuất album PDF"}
                  </span>
                </Button>
                <Button variant="outline" size="sm" aria-label="Chia sẻ">
                  <Share2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Chia sẻ</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Card className="mb-8 overflow-hidden">
          <div className="from-primary via-accent to-primary bg-linear-to-r p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-bold">{itinerary.title}</h2>
                {itinerary.description && (
                  <p className="mb-4 opacity-90">{itinerary.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {itinerary.start_date && itinerary.end_date
                        ? `${format(new Date(itinerary.start_date), "dd/MM/yyyy", { locale: vi })} - ${format(new Date(itinerary.end_date), "dd/MM/yyyy", { locale: vi })}`
                        : "Chưa có ngày"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{days.length} ngày</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span>{totalPhotos} ảnh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {days.length === 0 ? (
          <Card className="p-12 text-center">
            <Camera className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-semibold">Chưa có ngày nào trong lịch trình</h3>
            <p className="text-muted-foreground mb-6">
              Hãy quay lại lịch trình và thêm ngày trước khi tải ảnh.
            </p>
            <Button onClick={() => router.push(`/itinerary/${itineraryId}`)}>
              Quay lại lịch trình
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {days.map((day, idx) => {
              const dayPhotos = photosByDay[day.id] || [];
              return (
                <div key={day.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-4 py-1 text-lg">
                      Ngày {idx + 1} — {day.date}
                    </Badge>
                    <div className="bg-border h-px flex-1" />
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUpload(day.id, file);
                          }
                        }}
                      />
                      <div className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-2 py-2 text-sm transition-colors sm:px-3">
                        {isUploading && uploadTargetDay === day.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Đang tải lên...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4" />
                            <span className="hidden sm:inline">Tải ảnh</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {loadingPhotos && dayPhotos.length === 0 ? (
                    <Card className="text-muted-foreground p-6 text-center">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      <p>Đang tải ảnh...</p>
                    </Card>
                  ) : dayPhotos.length === 0 ? (
                    <Card className="text-muted-foreground p-6 text-center">
                      <Camera className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>Chưa có ảnh cho ngày này</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {dayPhotos.map((photo, index) => (
                        <Card
                          key={photo.url}
                          className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
                          onClick={() => setSelectedPhoto(photo.url)}
                          draggable
                          onDragStart={() => handleDragStart(day.id, index)}
                          onDragOver={(event) => {
                            event.preventDefault();
                          }}
                          onDrop={() => handleDrop(day.id, index)}
                          onDragEnd={() => setDragging(null)}
                        >
                          <div className="border-border/60 relative aspect-square overflow-hidden rounded-lg border">
                            <Image
                              src={photo.url}
                              alt={photo.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedPhoto(null)}
          >
            ✕
          </Button>
          <div
            className="relative max-h-[80vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedPhoto}
              alt="Full size"
              fill
              className="rounded-lg object-contain shadow-2xl"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="text-primary animate-pulse text-xl">Đang tải kỷ niệm...</div>
        </div>
      }
    >
      <MemoriesContent />
    </Suspense>
  );
}
