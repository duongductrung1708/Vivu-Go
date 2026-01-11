"use client";

import { useState, cloneElement, isValidElement } from "react";
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
import { vi } from "date-fns/locale";

interface ItineraryShareDialogProps {
  itineraryId: string;
  children: React.ReactNode;
}

export function ItineraryShareDialog({
  itineraryId,
  children,
}: ItineraryShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"read" | "edit">(
    "read"
  );
  const [deleteShareDialogOpen, setDeleteShareDialogOpen] = useState(false);
  const [removeCollaboratorDialogOpen, setRemoveCollaboratorDialogOpen] =
    useState(false);
  const [shareToDelete, setShareToDelete] = useState<string | null>(null);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<
    string | null
  >(null);
  const [collaboratorStatus, setCollaboratorStatus] = useState<
    "pending" | "accepted" | "declined" | null
  >(null);
  const { toast } = useToast();

  const { data: shares } = useItineraryShares(itineraryId);
  const { data: collaborators } = useItineraryCollaborators(itineraryId);

  // Debug: Log collaborators data to help diagnose "Unknown" issue
  if (
    collaborators &&
    collaborators.length > 0 &&
    process.env.NODE_ENV === "development"
  ) {
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
        ? new Date(
            Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000
          ).toISOString()
        : undefined;

      await createShare.mutateAsync({
        itinerary_id: itineraryId,
        permission,
        expires_at: expiresAt,
      });

      toast({
        title: "Thành công!",
        description: "Đã tạo link chia sẻ.",
      });
      setExpirationDays("");
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo link chia sẻ.",
      });
    }
  };

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Đã copy!",
      description: "Link đã được sao chép vào clipboard.",
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
        title: "Đã xóa",
        description: "Link chia sẻ đã được xóa.",
      });
      setDeleteShareDialogOpen(false);
      setShareToDelete(null);
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa link chia sẻ.",
      });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập email.",
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
        title: "Đã gửi lời mời!",
        description: `Đã mời ${inviteEmail} tham gia chỉnh sửa.`,
      });
      setInviteEmail("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể gửi lời mời.";
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: errorMessage,
      });
    }
  };

  const handleRemoveCollaboratorClick = (
    collaborationId: string,
    status: "pending" | "accepted" | "declined"
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
        title: "Đã xóa",
        description:
          collaboratorStatus === "pending"
            ? "Đã hủy lời mời cộng tác."
            : "Đã xóa người cộng tác.",
      });
      setRemoveCollaboratorDialogOpen(false);
      setCollaboratorToRemove(null);
      setCollaboratorStatus(null);
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa người cộng tác.",
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
          }
        )
      ) : (
        <div onClick={() => setOpen(true)}>{children}</div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
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
              <DialogTitle>Chia sẻ lịch trình</DialogTitle>
              <DialogDescription>
                Tạo link chia sẻ hoặc mời người khác cộng tác
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="link" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">Link chia sẻ</TabsTrigger>
                <TabsTrigger value="collaborators">Người cộng tác</TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4">
                {/* Create new share link */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Thời hạn link (tùy chọn)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Số ngày"
                        value={expirationDays}
                        onChange={(e) => setExpirationDays(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => handleCreateShare("read")}
                        disabled={createShare.isPending}
                      >
                        Tạo link đọc
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCreateShare("edit")}
                        disabled={createShare.isPending}
                      >
                        Tạo link chỉnh sửa
                      </Button>
                    </div>
                  </div>
                </div>

                {/* List of shares */}
                <div className="space-y-2">
                  <Label>Links đã tạo</Label>
                  {shares && shares.length > 0 ? (
                    <div className="space-y-2">
                      {shares.map((share) => {
                        const shareUrl = `${window.location.origin}/share/${share.share_token}`;
                        const isExpired =
                          share.expires_at &&
                          new Date(share.expires_at) < new Date();

                        return (
                          <div
                            key={share.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {share.permission === "edit"
                                    ? "Chỉnh sửa"
                                    : "Đọc"}
                                </span>
                                {isExpired && (
                                  <span className="text-xs text-destructive">
                                    Đã hết hạn
                                  </span>
                                )}
                                {!share.is_active && (
                                  <span className="text-xs text-muted-foreground">
                                    Đã tắt
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Link2 className="w-3 h-3" />
                                <span className="truncate">{shareUrl}</span>
                              </div>
                              {share.expires_at && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Hết hạn:{" "}
                                  {format(
                                    new Date(share.expires_at),
                                    "dd/MM/yyyy",
                                    {
                                      locale: vi,
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleCopyLink(share.share_token)
                                }
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteShareClick(share.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Chưa có link chia sẻ nào
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="collaborators" className="space-y-4">
                {/* Invite collaborator */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Mời người cộng tác</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Email người dùng"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={invitePermission}
                        onValueChange={(value: "read" | "edit") =>
                          setInvitePermission(value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Đọc</SelectItem>
                          <SelectItem value="edit">Chỉnh sửa</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleInvite}
                        disabled={inviteCollaborator.isPending}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Mời
                      </Button>
                    </div>
                  </div>
                </div>

                {/* List of collaborators */}
                <div className="space-y-2">
                  <Label>Người cộng tác</Label>
                  {collaborators && collaborators.length > 0 ? (
                    <div className="space-y-2">
                      {collaborators.map((collab) => (
                        <div
                          key={collab.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {collab.user_name &&
                              collab.user_name !== "Unknown"
                                ? collab.user_name
                                : collab.user_email || "Unknown"}
                            </div>
                            {collab.user_email && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {collab.user_email}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                                  {collab.permission === "edit"
                                    ? "Chỉnh sửa"
                                    : "Đọc"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    collab.status === "accepted"
                                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                      : collab.status === "declined"
                                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                                  }`}
                                >
                                  {collab.status === "accepted"
                                    ? "Đã chấp nhận"
                                    : collab.status === "declined"
                                    ? "Đã từ chối"
                                    : "Đang chờ"}
                                </span>
                              </div>
                              {collab.created_at && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {collab.status === "pending"
                                      ? "Mời ngày"
                                      : collab.status === "accepted"
                                      ? "Chấp nhận ngày"
                                      : "Từ chối ngày"}{" "}
                                    {format(
                                      new Date(collab.created_at),
                                      "dd/MM/yyyy",
                                      {
                                        locale: vi,
                                      }
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {(collab.status === "accepted" ||
                            collab.status === "pending") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveCollaboratorClick(
                                  collab.id,
                                  collab.status
                                )
                              }
                              title={
                                collab.status === "pending"
                                  ? "Hủy lời mời"
                                  : "Xóa người cộng tác"
                              }
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Chưa có người cộng tác nào
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Share Confirmation Dialog */}
      <AlertDialog
        open={deleteShareDialogOpen}
        onOpenChange={setDeleteShareDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa link chia sẻ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa link chia sẻ này? Link sẽ không còn hoạt
              động sau khi xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShareToDelete(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShareConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
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
                ? "Xác nhận hủy lời mời"
                : "Xác nhận xóa người cộng tác"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {collaboratorStatus === "pending"
                ? "Bạn có chắc chắn muốn hủy lời mời cộng tác này? Người dùng sẽ không nhận được lời mời nữa."
                : "Bạn có chắc chắn muốn xóa người cộng tác này? Họ sẽ không còn quyền truy cập vào lịch trình này."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCollaboratorToRemove(null);
                setCollaboratorStatus(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCollaboratorConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {collaboratorStatus === "pending" ? "Hủy lời mời" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
