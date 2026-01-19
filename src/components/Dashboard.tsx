"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  MoreVertical,
  Trash2,
  Edit,
  Share2,
  Camera,
  Clock,
  Globe,
} from "lucide-react";
import { ItineraryShareDialog } from "@/components/ItineraryShareDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useItineraries, useDeleteItinerary, type Itinerary } from "@/hooks/useItineraries";
import {
  usePendingInvitations,
  useUpdateCollaborationStatus,
  useIsItineraryOwner,
} from "@/hooks/useItinerarySharing";
import Loading from "@/components/Loading";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { data: itineraries, isLoading } = useItineraries();
  const deleteItinerary = useDeleteItinerary();
  const { data: pendingInvitations, isLoading: isLoadingInvitations } = usePendingInvitations();
  const updateCollaborationStatus = useUpdateCollaborationStatus();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  const handleCreateNew = () => {
    router.push("/trip");
  };

  const handleDeleteClick = (id: string) => {
    setItineraryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itineraryToDelete) return;

    try {
      await deleteItinerary.mutateAsync(itineraryToDelete);
      toast({
        title: "Đã xóa",
        description: "Lịch trình đã được xóa thành công.",
      });
      setDeleteDialogOpen(false);
      setItineraryToDelete(null);
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa lịch trình. Vui lòng thử lại.",
      });
    }
  };

  const handleAcceptInvitation = async (collaborationId: string, itineraryId: string) => {
    try {
      await updateCollaborationStatus.mutateAsync({
        collaborationId,
        status: "accepted",
        itineraryId,
      });
      toast({
        title: "Đã chấp nhận",
        description: "Bạn đã chấp nhận lời mời cộng tác.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể chấp nhận lời mời. Vui lòng thử lại.",
      });
    }
  };

  const handleDeclineInvitation = async (collaborationId: string, itineraryId: string) => {
    try {
      await updateCollaborationStatus.mutateAsync({
        collaborationId,
        status: "declined",
        itineraryId,
      });
      toast({
        title: "Đã từ chối",
        description: "Bạn đã từ chối lời mời cộng tác.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể từ chối lời mời. Vui lòng thử lại.",
      });
    }
  };

  if (authLoading || isLoading || isLoadingInvitations) {
    return <Loading />;
  }

  return (
    <div className="from-background via-secondary/20 to-lavender/20 min-h-screen bg-linear-to-br">
      <Navbar variant="fixed" />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Lịch trình của bạn</h2>
            <p className="text-muted-foreground mt-1">
              Quản lý và lên kế hoạch cho những chuyến đi tuyệt vời
            </p>
          </div>

          <Button
            onClick={handleCreateNew}
            className="from-primary to-accent bg-linear-to-r hover:opacity-90"
            aria-label="Tạo lịch trình mới"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Tạo lịch trình mới</span>
          </Button>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <div className="bg-muted/50 border-border mb-8 rounded-lg border p-4">
            <h3 className="mb-3 text-lg font-semibold">Lời mời cộng tác đang chờ</h3>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => {
                const invitationWithInviter = invitation as typeof invitation & {
                  inviter_name?: string;
                  inviter_email?: string;
                };
                const itinerary = invitation.itinerary as {
                  id?: string;
                  title?: string;
                  description?: string;
                  start_date?: string;
                  end_date?: string;
                  total_budget?: number;
                  people_count?: number;
                  trip_data?: {
                    days?: Array<{ places?: Array<unknown> }>;
                  };
                } | null;
                const tripData = itinerary?.trip_data;
                const daysCount = tripData?.days?.length || 0;
                const placesCount =
                  tripData?.days?.reduce(
                    (sum: number, day: { places?: Array<unknown> }) =>
                      sum + (day.places?.length || 0),
                    0,
                  ) || 0;
                const startDate = itinerary?.start_date ? new Date(itinerary.start_date) : null;
                const inviteDate = invitation.created_at ? new Date(invitation.created_at) : null;

                return (
                  <Card key={invitation.id} className="border-border border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h4 className="mb-1 text-lg font-semibold">
                              {itinerary?.title || "Lịch trình"}
                            </h4>
                            {itinerary?.description && (
                              <p className="text-muted-foreground line-clamp-2 text-sm">
                                {itinerary.description}
                              </p>
                            )}
                            {/* Inviter info */}
                            {invitationWithInviter.inviter_name ||
                            invitationWithInviter.inviter_email ? (
                              <div className="text-muted-foreground mt-2 text-sm">
                                <span className="font-medium">Được mời bởi: </span>
                                <span>
                                  {invitationWithInviter.inviter_name &&
                                  invitationWithInviter.inviter_name !== "Unknown"
                                    ? invitationWithInviter.inviter_name
                                    : invitationWithInviter.inviter_email || "Người dùng"}
                                </span>
                                {invitationWithInviter.inviter_email &&
                                  invitationWithInviter.inviter_name &&
                                  invitationWithInviter.inviter_name !== "Unknown" && (
                                    <span className="ml-1 text-xs">
                                      ({invitationWithInviter.inviter_email})
                                    </span>
                                  )}
                              </div>
                            ) : null}
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap gap-3">
                            {daysCount > 0 && (
                              <div className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-md px-2.5 py-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">{daysCount} ngày</span>
                              </div>
                            )}
                            {placesCount > 0 && (
                              <div className="bg-accent/10 text-accent flex items-center gap-1.5 rounded-md px-2.5 py-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">{placesCount} điểm</span>
                              </div>
                            )}
                            {(itinerary?.people_count ?? 0) > 0 && (
                              <div className="bg-secondary text-secondary-foreground flex items-center gap-1.5 rounded-md px-2.5 py-1">
                                <Users className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">
                                  {itinerary?.people_count} người
                                </span>
                              </div>
                            )}
                            {(itinerary?.total_budget ?? 0) > 0 && (
                              <div className="flex items-center gap-1.5 rounded-md bg-green-500/10 px-2.5 py-1 text-green-600 dark:text-green-400">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">
                                  {itinerary?.total_budget?.toLocaleString("vi-VN")} đ
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                            {startDate && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {format(startDate, "dd/MM/yyyy", {
                                    locale: vi,
                                  })}
                                </span>
                              </div>
                            )}
                            {inviteDate && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  Mời ngày{" "}
                                  {format(inviteDate, "dd/MM/yyyy", {
                                    locale: vi,
                                  })}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium">
                                {invitation.permission === "edit" ? "Chỉnh sửa" : "Đọc"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAcceptInvitation(invitation.id, invitation.itinerary_id)
                            }
                            disabled={updateCollaborationStatus.isPending}
                            className="w-full"
                            aria-label="Chấp nhận lời mời"
                          >
                            <Check className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Chấp nhận</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDeclineInvitation(invitation.id, invitation.itinerary_id)
                            }
                            disabled={updateCollaborationStatus.isPending}
                            className="w-full"
                            aria-label="Từ chối lời mời"
                          >
                            <X className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Từ chối</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Itineraries Grid */}
        {itineraries?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center"
          >
            <div className="bg-secondary mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full">
              <MapPin className="text-primary h-12 w-12" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Chưa có lịch trình nào</h3>
            <p className="text-muted-foreground mb-6">
              Bắt đầu tạo lịch trình đầu tiên của bạn ngay!
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tạo lịch trình mới</span>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {itineraries?.map((itinerary, index) => {
                const tripData = itinerary.trip_data;
                const daysCount = tripData?.days?.length || 0;
                const placesCount =
                  tripData?.days?.reduce((sum, day) => sum + (day.places?.length || 0), 0) || 0;
                const startDate = itinerary.start_date ? new Date(itinerary.start_date) : null;

                return (
                  <ItineraryCard
                    key={itinerary.id}
                    itinerary={itinerary}
                    index={index}
                    daysCount={daysCount}
                    placesCount={placesCount}
                    startDate={startDate}
                    onDelete={handleDeleteClick}
                    router={router}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lịch trình này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItineraryToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Separate component to use hooks inside map
function ItineraryCard({
  itinerary,
  index,
  daysCount,
  placesCount,
  startDate,
  onDelete,
  router,
}: {
  itinerary: Itinerary;
  index: number;
  daysCount: number;
  placesCount: number;
  startDate: Date | null;
  onDelete: (id: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const { data: isOwner = false } = useIsItineraryOwner(itinerary.id);

  return (
    <motion.div
      key={itinerary.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className="group border-border hover:border-primary/50 from-card to-card/50 relative cursor-pointer overflow-hidden border-2 bg-linear-to-br transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
        onClick={() => router.push(`/itinerary/${itinerary.id}`)}
      >
        {/* Gradient overlay on hover */}
        <div className="from-primary/5 to-accent/5 absolute inset-0 bg-linear-to-br via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <CardTitle className="group-hover:text-primary line-clamp-1 text-xl font-bold transition-colors">
                  {itinerary.title}
                </CardTitle>
                {itinerary.is_public && (
                  <div className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                    <Globe className="h-3 w-3" />
                    <span>Công khai</span>
                  </div>
                )}
              </div>
              {itinerary.description && (
                <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                  {itinerary.description}
                </CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-60 transition-opacity hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/itinerary/${itinerary.id}`);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/memory?itineraryId=${itinerary.id}`);
                  }}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Kỷ niệm (ảnh từng ngày)
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <ItineraryShareDialog itineraryId={itinerary.id}>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        Chia sẻ
                      </DropdownMenuItem>
                    </ItineraryShareDialog>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(itinerary.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4">
          {/* Stats Row */}
          <div className="flex flex-wrap gap-3">
            {daysCount > 0 && (
              <div className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{daysCount} ngày</span>
              </div>
            )}
            {placesCount > 0 && (
              <div className="bg-accent/10 text-accent flex items-center gap-1.5 rounded-lg px-3 py-1.5">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{placesCount} điểm</span>
              </div>
            )}
            {itinerary.people_count > 0 && (
              <div className="bg-secondary text-secondary-foreground flex items-center gap-1.5 rounded-lg px-3 py-1.5">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">{itinerary.people_count} người</span>
              </div>
            )}
          </div>

          {/* Info Row */}
          <div className="flex flex-wrap gap-4 text-sm">
            {startDate && (
              <div className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <div>
                  <div className="text-muted-foreground/70 text-xs">Ngày bắt đầu</div>
                  <div className="text-foreground font-medium">
                    {format(startDate, "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </div>
                </div>
              </div>
            )}
            {itinerary.total_budget > 0 && (
              <div className="text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 shrink-0" />
                <div>
                  <div className="text-muted-foreground/70 text-xs">Ngân sách</div>
                  <div className="text-foreground font-semibold">
                    {itinerary.total_budget.toLocaleString("vi-VN")} đ
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
