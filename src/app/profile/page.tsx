"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Calendar,
  MapPin,
  Camera,
  Upload,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useItineraries } from "@/hooks/useItineraries";
import { supabase } from "@/integrations/supabase/client";

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: itineraries = [], isLoading: isLoadingItineraries } = useItineraries();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || "";
      const avatar = user.user_metadata?.avatar_url || "";
      setFullName(name);
      setAvatarUrl(avatar);
    }
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: t("errors.generic"),
        description: t("profile.invalidImageFile", "Vui lòng chọn file ảnh"),
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: t("errors.generic"),
        description: t("profile.imageSizeError", "Kích thước ảnh tối đa là 2MB"),
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage (avatars bucket)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Add timestamp to bust cache
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithTimestamp);

      // Update user metadata with new avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: urlWithTimestamp,
        },
      });

      if (updateError) throw updateError;

      toast({
        title: t("profile.avatarUpdated", "Đã cập nhật ảnh đại diện"),
        description: t(
          "profile.avatarUpdatedDescription",
          "Ảnh đại diện đã được tải lên thành công.",
        ),
      });
    } catch (error: unknown) {
      console.error("Error uploading avatar:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("profile.avatarUploadError", "Không thể tải lên ảnh đại diện");
      toast({
        variant: "destructive",
        title: t("errors.generic"),
        description: errorMessage,
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        },
      });

      if (error) throw error;

      toast({
        title: t("profile.saveSuccess"),
        description: t("profile.saveSuccessDescription"),
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("profile.saveErrorDescription");
      toast({
        variant: "destructive",
        title: t("profile.saveError"),
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: t("errors.generic"),
        description: t("profile.passwordRequired", "Vui lòng nhập mật khẩu mới."),
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: t("errors.generic"),
        description: t("profile.passwordMinLength", "Mật khẩu phải có ít nhất 6 ký tự."),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("errors.generic"),
        description: t("profile.passwordMismatch"),
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: t("profile.passwordSuccess"),
        description: t("profile.passwordSuccessDescription"),
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("profile.passwordErrorDescription");
      toast({
        variant: "destructive",
        title: t("profile.passwordError"),
        description: errorMessage,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getUserItinerariesCount = () => {
    if (!user || !itineraries) return 0;
    return itineraries.filter((it) => it.user_id === user.id).length;
  };

  const getTotalPlacesCount = () => {
    if (!itineraries) return 0;
    return itineraries.reduce((total, it) => {
      const days = it.trip_data?.days || [];
      const placesCount = days.reduce((sum: number, day: { places?: unknown[] }) => {
        return sum + (day.places?.length || 0);
      }, 0);
      return total + placesCount;
    }, 0);
  };

  if (authLoading || isLoadingItineraries) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar variant="fixed" />
      <main className="mx-auto max-w-4xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t("profile.personalProfile")}</h1>
        </div>

        {/* Profile Header Section */}
        <div className="bg-card border-border mb-6 rounded-3xl border p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* Avatar Section */}
            <div className="group relative">
              <Avatar className="border-background h-32 w-32 border-4 shadow-lg">
                <AvatarImage src={avatarUrl || undefined} alt={fullName || "Avatar"} />
                <AvatarFallback className="from-primary to-accent bg-linear-to-br text-3xl text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="bg-primary hover:bg-primary/90 absolute right-0 bottom-0 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-colors disabled:opacity-50"
                aria-label={t("profile.uploadAvatar")}
              >
                {uploadingAvatar ? (
                  <Loader2 className="text-primary-foreground h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="text-primary-foreground h-5 w-5" />
                )}
              </button>
            </div>

            {/* User Info Section */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="mb-2 text-3xl font-bold">
                {fullName || t("profile.noName", "Chưa có tên")}
              </h2>
              <p className="text-muted-foreground mb-4 flex items-center justify-center gap-2 md:justify-start">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              <p className="text-muted-foreground mb-6 text-sm">
                {t("profile.joinedFrom", "Tham gia từ")}:{" "}
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString(t("common.locale", "vi-VN"), {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : t("profile.noInfo", "Chưa có thông tin")}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-4 md:justify-start">
                <div className="bg-secondary/50 flex items-center gap-2 rounded-lg px-4 py-2">
                  <MapPin className="text-primary h-5 w-5" />
                  <div>
                    <div className="text-primary text-xl font-bold">
                      {getUserItinerariesCount()}
                    </div>
                    <div className="text-muted-foreground text-xs">{t("itinerary.title")}</div>
                  </div>
                </div>
                <div className="bg-secondary/50 flex items-center gap-2 rounded-lg px-4 py-2">
                  <Calendar className="text-primary h-5 w-5" />
                  <div>
                    <div className="text-primary text-xl font-bold">{getTotalPlacesCount()}</div>
                    <div className="text-muted-foreground text-xs">
                      {t("profile.destinations", "Điểm đến")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-card border-border rounded-3xl border p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <User className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t("profile.personalInfo")}</h3>
                <p className="text-muted-foreground text-sm">{t("profile.updateInfo")}</p>
              </div>
            </div>

            <Separator className="mb-6" />

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("profile.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-muted-foreground text-xs">{t("profile.emailUnchangeable")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("profile.fullName")}
                </Label>
                <Input
                  id="fullName"
                  placeholder={t("profile.fullNamePlaceholder", "Nhập họ và tên của bạn")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {t("profile.avatar")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="avatarUrl"
                    placeholder={t("profile.avatarPlaceholder")}
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">{t("profile.avatarHint")}</p>
              </div>

              <Button
                className="from-primary to-accent w-full bg-linear-to-r hover:opacity-90"
                onClick={handleSaveProfile}
                disabled={saving}
                aria-label={saving ? t("profile.saving") : t("profile.saveChanges")}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                    <span className="hidden sm:inline">{t("profile.saving")}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t("profile.saveChanges")}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-card border-border rounded-3xl border p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Lock className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t("profile.security")}</h3>
                <p className="text-muted-foreground text-sm">{t("profile.securityDescription")}</p>
              </div>
            </div>

            <Separator className="mb-6" />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder={t("profile.newPasswordPlaceholder", "Nhập mật khẩu mới")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("profile.confirmPasswordPlaceholder", "Nhập lại mật khẩu mới")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                aria-label={
                  changingPassword ? t("profile.changingPassword") : t("profile.changePassword")
                }
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                    <span className="hidden sm:inline">{t("profile.changingPassword")}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t("profile.changePassword")}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
