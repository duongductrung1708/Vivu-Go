"use client";

import { useState, cloneElement, isValidElement } from "react";
import { Copy, Link2, Mail, X } from "lucide-react";
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
  const { toast } = useToast();

  const { data: shares } = useItineraryShares(itineraryId);
  const { data: collaborators } = useItineraryCollaborators(itineraryId);
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

  const handleDeleteShare = async (shareId: string) => {
    try {
      await deleteShare.mutateAsync({ shareId, itineraryId });
      toast({
        title: "Đã xóa",
        description: "Link chia sẻ đã được xóa.",
      });
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

  const handleRemoveCollaborator = async (collaborationId: string) => {
    try {
      await removeCollaborator.mutateAsync({ collaborationId, itineraryId });
      toast({
        title: "Đã xóa",
        description: "Đã xóa người cộng tác.",
      });
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
      {isValidElement(children)
        ? cloneElement(children as React.ReactElement<{ onSelect?: (e: Event) => void; onClick?: (e: React.MouseEvent) => void }>, {
            onSelect: (e: Event) => {
              handleTriggerSelect(e);
              const originalOnSelect = (children as React.ReactElement<{ onSelect?: (e: Event) => void }>).props?.onSelect;
              if (originalOnSelect) {
                originalOnSelect(e);
              }
            },
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
              const originalOnClick = (children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props?.onClick;
              if (originalOnClick) {
                originalOnClick(e);
              }
            },
          })
        : (
          <div onClick={() => setOpen(true)}>
            {children}
          </div>
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
                            onClick={() => handleCopyLink(share.share_token)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteShare(share.id)}
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
                          {collab.user_name || collab.user_email || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Quyền:{" "}
                          {collab.permission === "edit" ? "Chỉnh sửa" : "Đọc"} •{" "}
                          Trạng thái:{" "}
                          {collab.status === "accepted"
                            ? "Đã chấp nhận"
                            : collab.status === "declined"
                            ? "Đã từ chối"
                            : "Đang chờ"}
                        </div>
                      </div>
                      {collab.status === "accepted" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCollaborator(collab.id)}
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
    </>
  );
}
