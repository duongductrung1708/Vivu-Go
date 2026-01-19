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
        [photosByDay]
    );

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
                [dayId]: [
                    ...(prev[dayId] || []),
                    { url: publicUrl.publicUrl, name: file.name },
                ],
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-primary text-xl">Đang tải kỷ niệm...</div>
            </div>
        );
    }

    if (!itineraryId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-4">Không tìm thấy lịch trình</h2>
                    <Button onClick={() => router.push("/dashboard")}>Quay lại Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-background via-secondary/20 to-lavender/20">
            <Navbar variant="fixed" />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <div className="top-45 z-40 border-b border-border">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => router.push(`/itinerary/${itineraryId}`)}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div>
                                    <h1 className="text-xl font-bold">Kỷ niệm chuyến đi</h1>
                                    <p className="text-sm text-muted-foreground">{itinerary.title}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <ThemeToggle />
                                <Button variant="outline" size="sm">
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Chia sẻ
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <Card className="mb-8 overflow-hidden">
                    <div className="bg-linear-to-r from-primary via-accent to-primary p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{itinerary.title}</h2>
                                {itinerary.description && (
                                    <p className="opacity-90 mb-4">{itinerary.description}</p>
                                )}
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {itinerary.start_date && itinerary.end_date
                                                ? `${format(new Date(itinerary.start_date), "dd/MM/yyyy", { locale: vi })} - ${format(new Date(itinerary.end_date), "dd/MM/yyyy", { locale: vi })}`
                                                : "Chưa có ngày"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{days.length} ngày</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Camera className="w-4 h-4" />
                                        <span>{totalPhotos} ảnh</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {days.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Chưa có ngày nào trong lịch trình</h3>
                        <p className="text-muted-foreground mb-6">
                            Hãy quay lại lịch trình và thêm ngày trước khi tải ảnh.
                        </p>
                        <Button onClick={() => router.push(`/itinerary/${itineraryId}`)}>Quay lại lịch trình</Button>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {days.map((day, idx) => {
                            const dayPhotos = photosByDay[day.id] || [];
                            return (
                                <div key={day.id} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary" className="text-lg px-4 py-1">
                                            Ngày {idx + 1} — {day.date}
                                        </Badge>
                                        <div className="flex-1 h-px bg-border" />
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
                                            <div className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">
                                                {isUploading && uploadTargetDay === day.id ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Đang tải lên...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-4 h-4" />
                                                        <span>Tải ảnh</span>
                                                    </>
                                                )}
                                            </div>
                                        </label>
                                    </div>

                                    {loadingPhotos && dayPhotos.length === 0 ? (
                                        <Card className="p-6 text-center text-muted-foreground">
                                            <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                                            <p>Đang tải ảnh...</p>
                                        </Card>
                                    ) : dayPhotos.length === 0 ? (
                                        <Card className="p-6 text-center text-muted-foreground">
                                            <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p>Chưa có ảnh cho ngày này</p>
                                        </Card>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {dayPhotos.map((photo) => (
                                                <Card
                                                    key={photo.url}
                                                    className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
                                                    onClick={() => setSelectedPhoto(photo.url)}
                                                >
                                                    <div className="aspect-square relative overflow-hidden rounded-lg border border-border/60">
                                                        <Image
                                                            src={photo.url}
                                                            alt={photo.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
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
                        className="relative max-w-4xl w-full max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={selectedPhoto}
                            alt="Full size"
                            fill
                            className="object-contain rounded-lg shadow-2xl"
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
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-pulse text-primary text-xl">Đang tải kỷ niệm...</div>
                </div>
            }
        >
            <MemoriesContent />
        </Suspense>
    );
}

