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
  Clock,
  Globe,
} from "lucide-react";
import { ItineraryShareDialog } from "@/components/ItineraryShareDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  useItineraries,
  useDeleteItinerary,
  type Itinerary,
} from "@/hooks/useItineraries";
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
  const { data: pendingInvitations, isLoading: isLoadingInvitations } =
    usePendingInvitations();
  const updateCollaborationStatus = useUpdateCollaborationStatus();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<string | null>(
    null
  );

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

  const handleAcceptInvitation = async (
    collaborationId: string,
    itineraryId: string
  ) => {
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

  const handleDeclineInvitation = async (
    collaborationId: string,
    itineraryId: string
  ) => {
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
    <div className="min-h-screen bg-linear-to-br from-background via-secondary/20 to-lavender/20">
      <Navbar variant="fixed" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Lịch trình của bạn</h2>
            <p className="text-muted-foreground mt-1">
              Quản lý và lên kế hoạch cho những chuyến đi tuyệt vời
            </p>
          </div>

          <Button
            onClick={handleCreateNew}
            className="bg-linear-to-r from-primary to-accent hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo lịch trình mới
          </Button>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <div className="mb-8 p-4 bg-muted/50 border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">
              Lời mời cộng tác đang chờ
            </h3>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => {
                const invitationWithInviter =
                  invitation as typeof invitation & {
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
                    0
                  ) || 0;
                const startDate = itinerary?.start_date
                  ? new Date(itinerary.start_date)
                  : null;
                const inviteDate = invitation.created_at
                  ? new Date(invitation.created_at)
                  : null;

                return (
                  <Card key={invitation.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h4 className="font-semibold text-lg mb-1">
                              {itinerary?.title || "Lịch trình"}
                            </h4>
                            {itinerary?.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {itinerary.description}
                              </p>
                            )}
                            {/* Inviter info */}
                            {invitationWithInviter.inviter_name ||
                            invitationWithInviter.inviter_email ? (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <span className="font-medium">
                                  Được mời bởi:{" "}
                                </span>
                                <span>
                                  {invitationWithInviter.inviter_name &&
                                  invitationWithInviter.inviter_name !==
                                    "Unknown"
                                    ? invitationWithInviter.inviter_name
                                    : invitationWithInviter.inviter_email ||
                                      "Người dùng"}
                                </span>
                                {invitationWithInviter.inviter_email &&
                                  invitationWithInviter.inviter_name &&
                                  invitationWithInviter.inviter_name !==
                                    "Unknown" && (
                                    <span className="text-xs ml-1">
                                      ({invitationWithInviter.inviter_email})
                                    </span>
                                  )}
                              </div>
                            ) : null}
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap gap-3">
                            {daysCount > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">
                                  {daysCount} ngày
                                </span>
                              </div>
                            )}
                            {placesCount > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 text-accent">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">
                                  {placesCount} điểm
                                </span>
                              </div>
                            )}
                            {(itinerary?.people_count ?? 0) > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                                <Users className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">
                                  {itinerary?.people_count} người
                                </span>
                              </div>
                            )}
                            {(itinerary?.total_budget ?? 0) > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                                <DollarSign className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">
                                  {itinerary?.total_budget?.toLocaleString(
                                    "vi-VN"
                                  )}{" "}
                                  đ
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {startDate && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  {format(startDate, "dd/MM/yyyy", {
                                    locale: vi,
                                  })}
                                </span>
                              </div>
                            )}
                            {inviteDate && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  Mời ngày{" "}
                                  {format(inviteDate, "dd/MM/yyyy", {
                                    locale: vi,
                                  })}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                                {invitation.permission === "edit"
                                  ? "Chỉnh sửa"
                                  : "Đọc"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAcceptInvitation(
                                invitation.id,
                                invitation.itinerary_id
                              )
                            }
                            disabled={updateCollaborationStatus.isPending}
                            className="w-full"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Chấp nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDeclineInvitation(
                                invitation.id,
                                invitation.itinerary_id
                              )
                            }
                            disabled={updateCollaborationStatus.isPending}
                            className="w-full"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Từ chối
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
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Chưa có lịch trình nào
            </h3>
            <p className="text-muted-foreground mb-6">
              Bắt đầu tạo lịch trình đầu tiên của bạn ngay!
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo lịch trình mới
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {itineraries?.map((itinerary, index) => {
                const tripData = itinerary.trip_data;
                const daysCount = tripData?.days?.length || 0;
                const placesCount =
                  tripData?.days?.reduce(
                    (sum, day) => sum + (day.places?.length || 0),
                    0
                  ) || 0;
                const startDate = itinerary.start_date
                  ? new Date(itinerary.start_date)
                  : null;

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
              Bạn có chắc chắn muốn xóa lịch trình này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItineraryToDelete(null)}>
              Hủy
            </AlertDialogCancel>
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
        className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-border hover:border-primary/50 bg-linear-to-br from-card to-card/50 overflow-hidden relative"
        onClick={() => router.push(`/itinerary/${itinerary.id}`)}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                  {itinerary.title}
                </CardTitle>
                {itinerary.is_public && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                    <Globe className="w-3 h-3" />
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
                  className="h-8 w-8 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/itinerary/${itinerary.id}`);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <ItineraryShareDialog itineraryId={itinerary.id}>
                      <DropdownMenuItem>
                        <Share2 className="w-4 h-4 mr-2" />
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
                      <Trash2 className="w-4 h-4 mr-2" />
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{daysCount} ngày</span>
              </div>
            )}
            {placesCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{placesCount} điểm</span>
              </div>
            )}
            {itinerary.people_count > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {itinerary.people_count} người
                </span>
              </div>
            )}
          </div>

          {/* Info Row */}
          <div className="flex flex-wrap gap-4 text-sm">
            {startDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground/70">
                    Ngày bắt đầu
                  </div>
                  <div className="font-medium text-foreground">
                    {format(startDate, "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </div>
                </div>
              </div>
            )}
            {itinerary.total_budget > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground/70">
                    Ngân sách
                  </div>
                  <div className="font-semibold text-foreground">
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
