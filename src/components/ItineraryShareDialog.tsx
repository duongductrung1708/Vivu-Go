"use client";

import { useState, cloneElement, isValidElement } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Link2, Mail, X, Clock } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useItineraryShares,
  useCreateShare,
  useDeleteShare,
  useItineraryCollaborators,
  useInviteCollaborator,
  useRemoveCollaborator,
} from "@/hooks/useItinerarySharing";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";

interface ItineraryShareDialogProps {
  itineraryId: string;
  children: React.ReactNode;
}

export function ItineraryShareDialog({ itineraryId, children }: ItineraryShareDialogProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "en" ? enUS : vi;
  const [open, setOpen] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"read" | "edit">("read");
  const [deleteShareDialogOpen, setDeleteShareDialogOpen] = useState(false);
  const [removeCollaboratorDialogOpen, setRemoveCollaboratorDialogOpen] = useState(false);
  const [shareToDelete, setShareToDelete] = useState<string | null>(null);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<string | null>(null);
  const [collaboratorStatus, setCollaboratorStatus] = useState<
    "pending" | "accepted" | "declined" | null
  >(null);
  const { toast } = useToast();

  const { data: shares } = useItineraryShares(itineraryId);
  const { data: collaborators } = useItineraryCollaborators(itineraryId);

  // Debug: Log collaborators data to help diagnose "Unknown" issue
  if (collaborators && collaborators.length > 0 && process.env.NODE_ENV === "development") {
    console.log("Collaborators data:", collaborators);
    collaborators.forEach((collab, index) => {
      console.log(`Collaborator ${index}:`, {
        id: collab.id,
        user_name: collab.user_name,
        user_email: collab.user_email,
        user_id: collab.user_id,
        has_user_name: !!collab.user_name,
        has_user_email: !!collab.user_email,
      });
    });
  }
  const createShare = useCreateShare();
  const deleteShare = useDeleteShare();
  const inviteCollaborator = useInviteCollaborator();
  const removeCollaborator = useRemoveCollaborator();

  const handleCreateShare = async (permission: "read" | "edit") => {
    try {
      const expiresAt = expirationDays
        ? new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      await createShare.mutateAsync({
        itinerary_id: itineraryId,
        permission,
        expires_at: expiresAt,
      });

      toast({
        title: t("shareDialog.createSuccess", "Thành công!"),
        description: t("shareDialog.createSuccessDescription", "Đã tạo link chia sẻ."),
      });
      setExpirationDays("");
    } catch {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Lỗi"),
        description: t("shareDialog.createError", "Không thể tạo link chia sẻ."),
      });
    }
  };

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: t("shareDialog.copySuccess", "Đã copy!"),
      description: t("shareDialog.copySuccessDescription", "Link đã được sao chép vào clipboard."),
    });
  };

  const handleDeleteShareClick = (shareId: string) => {
    setShareToDelete(shareId);
    setDeleteShareDialogOpen(true);
  };

  const handleDeleteShareConfirm = async () => {
    if (!shareToDelete) return;

    try {
      await deleteShare.mutateAsync({ shareId: shareToDelete, itineraryId });
      toast({
        title: t("shareDialog.deleteSuccess", "Đã xóa"),
        description: t("shareDialog.deleteSuccessDescription", "Link chia sẻ đã được xóa."),
      });
      setDeleteShareDialogOpen(false);
      setShareToDelete(null);
    } catch {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Lỗi"),
        description: t("shareDialog.deleteError", "Không thể xóa link chia sẻ."),
      });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Lỗi"),
        description: t("shareDialog.emailRequired", "Vui lòng nhập email."),
      });
      return;
    }

    try {
      await inviteCollaborator.mutateAsync({
        itinerary_id: itineraryId,
        email: inviteEmail,
        permission: invitePermission,
      });

      toast({
        title: t("shareDialog.inviteSuccess", "Đã gửi lời mời!"),
        description: t("shareDialog.inviteSuccessDescription", "Đã mời {{email}} tham gia chỉnh sửa.", {
          email: inviteEmail,
        }),
      });
      setInviteEmail("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("shareDialog.inviteError", "Không thể gửi lời mời.");
      toast({
        variant: "destructive",
        title: t("errors.generic", "Lỗi"),
        description: errorMessage,
      });
    }
  };

  const handleRemoveCollaboratorClick = (
    collaborationId: string,
    status: "pending" | "accepted" | "declined",
  ) => {
    setCollaboratorToRemove(collaborationId);
    setCollaboratorStatus(status);
    setRemoveCollaboratorDialogOpen(true);
  };

  const handleRemoveCollaboratorConfirm = async () => {
    if (!collaboratorToRemove) return;

    try {
      await removeCollaborator.mutateAsync({
        collaborationId: collaboratorToRemove,
        itineraryId,
      });
      toast({
        title: t("shareDialog.removeSuccess", "Đã xóa"),
        description:
          collaboratorStatus === "pending"
            ? t("shareDialog.cancelInviteSuccess", "Đã hủy lời mời cộng tác.")
            : t("shareDialog.removeCollaboratorSuccess", "Đã xóa người cộng tác."),
      });
      setRemoveCollaboratorDialogOpen(false);
      setCollaboratorToRemove(null);
      setCollaboratorStatus(null);
    } catch {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Lỗi"),
        description: t("shareDialog.removeError", "Không thể xóa người cộng tác."),
      });
    }
  };

  const handleTriggerSelect = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      {isValidElement(children) ? (
        cloneElement(
          children as React.ReactElement<{
            onSelect?: (e: Event) => void;
            onClick?: (e: React.MouseEvent) => void;
          }>,
          {
            onSelect: (e: Event) => {
              handleTriggerSelect(e);
              const originalOnSelect = (
                children as React.ReactElement<{
                  onSelect?: (e: Event) => void;
                }>
              ).props?.onSelect;
              if (originalOnSelect) {
                originalOnSelect(e);
              }
            },
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
              const originalOnClick = (
                children as React.ReactElement<{
                  onClick?: (e: React.MouseEvent) => void;
                }>
              ).props?.onClick;
              if (originalOnClick) {
                originalOnClick(e);
              }
            },
          },
        )
      ) : (
        <div onClick={() => setOpen(true)}>{children}</div>
      )}
      <Dialog open={open} onOpenChange={setOpen} key={i18n.language}>
        <DialogContent
          className="max-h-[80vh] max-w-2xl overflow-y-auto"
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("shareDialog.title", "Chia sẻ lịch trình")}</DialogTitle>
              <DialogDescription>
                {t("shareDialog.description", "Tạo link chia sẻ hoặc mời người khác cộng tác")}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="link" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">{t("shareDialog.shareLinks", "Link chia sẻ")}</TabsTrigger>
                <TabsTrigger value="collaborators">
                  {t("shareDialog.collaborators", "Người cộng tác")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4">
                {/* Create new share link */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label>{t("shareDialog.expirationDays", "Thời hạn link (tùy chọn)")}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t("shareDialog.daysPlaceholder", "Số ngày")}
                        value={expirationDays}
                        onChange={(e) => setExpirationDays(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => handleCreateShare("read")}
                        disabled={createShare.isPending}
                      >
                        {t("shareDialog.createReadLink", "Tạo link đọc")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCreateShare("edit")}
                        disabled={createShare.isPending}
                      >
                        {t("shareDialog.createEditLink", "Tạo link chỉnh sửa")}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* List of shares */}
                <div className="space-y-2">
                  <Label>{t("shareDialog.createdLinks", "Links đã tạo")}</Label>
                  {shares && shares.length > 0 ? (
                    <div className="space-y-2">
                      {shares.map((share) => {
                        const shareUrl = `${window.location.origin}/share/${share.share_token}`;
                        const isExpired =
                          share.expires_at && new Date(share.expires_at) < new Date();

                        return (
                          <div
                            key={share.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {share.permission === "edit"
                                    ? t("shareDialog.edit", "Chỉnh sửa")
                                    : t("shareDialog.read", "Đọc")}
                                </span>
                                {isExpired && (
                                  <span className="text-destructive text-xs">
                                    {t("shareDialog.expired", "Đã hết hạn")}
                                  </span>
                                )}
                                {!share.is_active && (
                                  <span className="text-muted-foreground text-xs">
                                    {t("shareDialog.inactive", "Đã tắt")}
                                  </span>
                                )}
                              </div>
                              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Link2 className="h-3 w-3" />
                                <span className="truncate">{shareUrl}</span>
                              </div>
                              {share.expires_at && (
                                <div className="text-muted-foreground mt-1 text-xs">
                                  {t("shareDialog.expiresAt", "Hết hạn")}:{" "}
                                  {format(new Date(share.expires_at), "dd/MM/yyyy", {
                                    locale: dateLocale,
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyLink(share.share_token)}
                                title={t("shareDialog.copyLink", "Copy link")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteShareClick(share.id)}
                                title={t("shareDialog.deleteLink", "Xóa link")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      {t("shareDialog.noLinks", "Chưa có link chia sẻ nào")}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="collaborators" className="space-y-4">
                {/* Invite collaborator */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label>{t("shareDialog.inviteCollaborator", "Mời người cộng tác")}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder={t("shareDialog.userEmailPlaceholder", "Email người dùng")}
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={invitePermission}
                        onValueChange={(value: "read" | "edit") => setInvitePermission(value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">{t("shareDialog.read", "Đọc")}</SelectItem>
                          <SelectItem value="edit">{t("shareDialog.edit", "Chỉnh sửa")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleInvite} disabled={inviteCollaborator.isPending}>
                        <Mail className="mr-2 h-4 w-4" />
                        {t("shareDialog.invite", "Mời")}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* List of collaborators */}
                <div className="space-y-2">
                  <Label>{t("shareDialog.collaborators", "Người cộng tác")}</Label>
                  {collaborators && collaborators.length > 0 ? (
                    <div className="space-y-2">
                      {collaborators.map((collab) => (
                        <div
                          key={collab.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {collab.user_name && collab.user_name !== "Unknown"
                                ? collab.user_name
                                : collab.user_email || t("shareDialog.unknown", "Unknown")}
                            </div>
                            {collab.user_email && (
                              <div className="text-muted-foreground mt-0.5 text-xs">
                                {collab.user_email}
                              </div>
                            )}
                            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium">
                                  {collab.permission === "edit"
                                    ? t("shareDialog.edit", "Chỉnh sửa")
                                    : t("shareDialog.read", "Đọc")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                                    collab.status === "accepted"
                                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                      : collab.status === "declined"
                                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                        : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                                  }`}
                                >
                                  {collab.status === "accepted"
                                    ? t("shareDialog.accepted", "Đã chấp nhận")
                                    : collab.status === "declined"
                                      ? t("shareDialog.declined", "Đã từ chối")
                                      : t("shareDialog.pending", "Đang chờ")}
                                </span>
                              </div>
                              {collab.created_at && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {collab.status === "pending"
                                      ? t("shareDialog.invitedOn", "Mời ngày")
                                      : collab.status === "accepted"
                                        ? t("shareDialog.acceptedOn", "Chấp nhận ngày")
                                        : t("shareDialog.declinedOn", "Từ chối ngày")}{" "}
                                    {format(new Date(collab.created_at), "dd/MM/yyyy", {
                                      locale: dateLocale,
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {(collab.status === "accepted" || collab.status === "pending") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveCollaboratorClick(collab.id, collab.status)
                              }
                              title={
                                collab.status === "pending"
                                  ? t("shareDialog.cancelInvite", "Hủy lời mời")
                                  : t("shareDialog.removeCollaborator", "Xóa người cộng tác")
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      {t("shareDialog.noCollaborators", "Chưa có người cộng tác nào")}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Share Confirmation Dialog */}
      <AlertDialog open={deleteShareDialogOpen} onOpenChange={setDeleteShareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("shareDialog.deleteConfirmTitle", "Xác nhận xóa link chia sẻ")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "shareDialog.deleteConfirmDescription",
                "Bạn có chắc chắn muốn xóa link chia sẻ này? Link sẽ không còn hoạt động sau khi xóa.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShareToDelete(null)}>
              {t("common.cancel", "Hủy")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShareConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete", "Xóa")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Collaborator Confirmation Dialog */}
      <AlertDialog
        open={removeCollaboratorDialogOpen}
        onOpenChange={setRemoveCollaboratorDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {collaboratorStatus === "pending"
                ? t("shareDialog.cancelInviteConfirmTitle", "Xác nhận hủy lời mời")
                : t("shareDialog.removeCollaboratorConfirmTitle", "Xác nhận xóa người cộng tác")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {collaboratorStatus === "pending"
                ? t(
                    "shareDialog.cancelInviteConfirmDescription",
                    "Bạn có chắc chắn muốn hủy lời mời cộng tác này? Người dùng sẽ không nhận được lời mời nữa.",
                  )
                : t(
                    "shareDialog.removeCollaboratorConfirmDescription",
                    "Bạn có chắc chắn muốn xóa người cộng tác này? Họ sẽ không còn quyền truy cập vào lịch trình này.",
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCollaboratorToRemove(null);
                setCollaboratorStatus(null);
              }}
            >
              {t("common.cancel", "Hủy")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCollaboratorConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {collaboratorStatus === "pending"
                ? t("shareDialog.cancelInvite", "Hủy lời mời")
                : t("common.delete", "Xóa")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
