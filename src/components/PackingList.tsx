"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Check,
  X,
  Package,
  User,
  Clock,
} from "lucide-react";
import { usePackingItems, useCreatePackingItem, useUpdatePackingItem, useDeletePackingItem } from "@/hooks/usePackingItems";
import { useCanEditItinerary } from "@/hooks/useItinerarySharing";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface PackingListProps {
  itineraryId: string;
}

const COMMON_CATEGORIES = [
  "Giấy tờ",
  "Quần áo",
  "Điện tử",
  "Vệ sinh cá nhân",
  "Thuốc",
  "Khác",
];

export function PackingList({ itineraryId }: PackingListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: canEdit = false } = useCanEditItinerary(itineraryId);
  const { data: items = [], isLoading } = usePackingItems(itineraryId);
  const createItem = useCreatePackingItem();
  const updateItem = useUpdatePackingItem();
  const deleteItem = useDeletePackingItem();

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  // Fetch user emails for checked_by
  useEffect(() => {
    const fetchUserEmails = async () => {
      const checkedByUserIds = Array.from(
        new Set(
          items
            .filter((item) => item.checked_by)
            .map((item) => item.checked_by!)
        )
      );

      if (checkedByUserIds.length === 0) return;

      // Try to get user info from auth.users
      // Note: This requires the users to be accessible, which might need RLS policies
      // For now, we'll use a simple approach and show user ID or "Người dùng"
      const emails: Record<string, string> = {};
      
      // If current user is in the list, show "Bạn"
      checkedByUserIds.forEach((userId) => {
        if (userId === user?.id) {
          emails[userId] = "Bạn";
        } else {
          // For other users, we could fetch from a profiles table if it exists
          // For now, show a generic label
          emails[userId] = "Người dùng";
        }
      });
      
      setUserEmails(emails);
    };

    if (user) {
      fetchUserEmails();
    }
  }, [items, user]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel(`packing-items-${itineraryId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "packing_items",
          filter: `itinerary_id=eq.${itineraryId}`,
        },
        () => {
          // Invalidate query to refetch
          queryClient.invalidateQueries({
            queryKey: ["packing-items", itineraryId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itineraryId, queryClient]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập tên món đồ.",
      });
      return;
    }

    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Không có quyền",
        description: "Bạn chỉ có quyền xem, không thể thêm món đồ.",
      });
      return;
    }

    try {
      await createItem.mutateAsync({
        itinerary_id: itineraryId,
        item_name: newItemName.trim(),
        category: newItemCategory || undefined,
      });
      setNewItemName("");
      setNewItemCategory("");
      toast({
        title: "Đã thêm",
        description: "Món đồ đã được thêm vào danh sách.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể thêm món đồ.",
      });
    }
  };

  const handleToggleCheck = async (item: any) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Không có quyền",
        description: "Bạn chỉ có quyền xem, không thể đánh dấu.",
      });
      return;
    }

    try {
      await updateItem.mutateAsync({
        id: item.id,
        itineraryId,
        updates: {
          is_checked: !item.is_checked,
        },
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái.",
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Không có quyền",
        description: "Bạn chỉ có quyền xem, không thể xóa.",
      });
      return;
    }

    try {
      await deleteItem.mutateAsync({ id, itineraryId });
      toast({
        title: "Đã xóa",
        description: "Món đồ đã được xóa khỏi danh sách.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể xóa món đồ.",
      });
    }
  };

  const handleStartEdit = (item: any) => {
    if (!canEdit) return;
    setEditingId(item.id);
    setEditName(item.item_name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Tên món đồ không được để trống.",
      });
      return;
    }

    try {
      await updateItem.mutateAsync({
        id,
        itineraryId,
        updates: {
          item_name: editName.trim(),
        },
      });
      setEditingId(null);
      setEditName("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật tên.",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Khác";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const checkedCount = items.filter((item) => item.is_checked).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Danh sách chuẩn bị
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Danh sách chuẩn bị
        </CardTitle>
        {totalCount > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                {checkedCount} / {totalCount} món đã chuẩn bị
              </span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new item */}
        {canEdit && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <div className="flex gap-2">
              <Input
                placeholder="Nhập món đồ cần mang (VD: CCCD, thẻ sinh viên FPT...)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddItem();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleAddItem}
                disabled={createItem.isPending || !newItemName.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Chọn danh mục (tùy chọn)</option>
              {COMMON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {canEdit
                ? "Chưa có món đồ nào. Thêm món đồ đầu tiên!"
                : "Chưa có món đồ nào trong danh sách."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="space-y-2">
                {category !== "Khác" && (
                  <h4 className="text-sm font-medium text-muted-foreground px-1">
                    {category}
                  </h4>
                )}
                <AnimatePresence>
                  {categoryItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        item.is_checked
                          ? "bg-muted/50 border-muted"
                          : "bg-card border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={item.is_checked}
                        onCheckedChange={() => handleToggleCheck(item)}
                        disabled={!canEdit}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveEdit(item.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              className="flex-1 h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveEdit(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className={`${
                              item.is_checked
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                            onDoubleClick={() => handleStartEdit(item)}
                          >
                            <p className="text-sm font-medium">{item.item_name}</p>
                            {item.is_checked && item.checked_by && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>
                                  {item.checked_by === user?.id ? "Bạn" : userEmails[item.checked_by] || "Người dùng"}
                                </span>
                                {item.checked_at && (
                                  <>
                                    <Clock className="h-3 w-3 ml-2" />
                                    <span>
                                      {format(
                                        new Date(item.checked_at),
                                        "dd/MM HH:mm",
                                        { locale: vi }
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {canEdit && editingId !== item.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
