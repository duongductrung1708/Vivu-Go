"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Save, Loader2, Calendar, MapPin, Camera, Upload } from "lucide-react";
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
                title: "Lỗi",
                description: "Vui lòng chọn file ảnh",
            });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Kích thước ảnh tối đa là 2MB",
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
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

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
                title: "Đã cập nhật ảnh đại diện",
                description: "Ảnh đại diện đã được tải lên thành công.",
            });
        } catch (error: unknown) {
            console.error("Error uploading avatar:", error);
            const errorMessage = error instanceof Error ? error.message : "Không thể tải lên ảnh đại diện";
            toast({
                variant: "destructive",
                title: "Lỗi",
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
                title: "Đã lưu",
                description: "Cập nhật thông tin hồ sơ thành công.",
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể lưu thông tin hồ sơ.";
            toast({
                variant: "destructive",
                title: "Lỗi",
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
                title: "Lỗi",
                description: "Vui lòng nhập mật khẩu mới.",
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Mật khẩu phải có ít nhất 6 ký tự.",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Mật khẩu xác nhận không khớp.",
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
                title: "Đã đổi mật khẩu",
                description: "Mật khẩu đã được cập nhật thành công.",
            });

            setNewPassword("");
            setConfirmPassword("");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể đổi mật khẩu.";
            toast({
                variant: "destructive",
                title: "Lỗi",
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
        <div className="min-h-screen bg-background">
            <Navbar variant="fixed" />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard")}
                        className="rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
                </div>

                {/* Profile Header Section */}
                <div className="rounded-3xl bg-card border border-border shadow-sm p-8 mb-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar Section */}
                        <div className="relative group">
                            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                                <AvatarImage src={avatarUrl || undefined} alt={fullName || "Avatar"} />
                                <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-3xl">
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
                                className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                                aria-label="Tải ảnh đại diện"
                            >
                                {uploadingAvatar ? (
                                    <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                                ) : (
                                    <Camera className="w-5 h-5 text-primary-foreground" />
                                )}
                            </button>
                        </div>

                        {/* User Info Section */}
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-bold mb-2">{fullName || "Chưa có tên"}</h2>
                            <p className="text-muted-foreground mb-4 flex items-center justify-center md:justify-start gap-2">
                                <Mail className="w-4 h-4" />
                                {user.email}
                            </p>
                            <p className="text-sm text-muted-foreground mb-6">
                                Tham gia từ: {user.created_at
                                    ? new Date(user.created_at).toLocaleDateString("vi-VN", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    : "Chưa có thông tin"}
                            </p>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    <div>
                                        <div className="text-xl font-bold text-primary">{getUserItinerariesCount()}</div>
                                        <div className="text-xs text-muted-foreground">Lịch trình</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <div>
                                        <div className="text-xl font-bold text-primary">{getTotalPlacesCount()}</div>
                                        <div className="text-xs text-muted-foreground">Điểm đến</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="rounded-3xl bg-card border border-border shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">Thông tin cá nhân</h3>
                                <p className="text-sm text-muted-foreground">Cập nhật thông tin hồ sơ của bạn</p>
                            </div>
                        </div>

                        <Separator className="mb-6" />

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={user.email || ""}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Họ và tên
                                </Label>
                                <Input
                                    id="fullName"
                                    placeholder="Nhập họ và tên của bạn"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="avatarUrl" className="flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Ảnh đại diện
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="avatarUrl"
                                        placeholder="URL ảnh hoặc bấm nút Upload"
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
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Nhập URL ảnh hoặc bấm nút Upload để tải ảnh lên (tối đa 2MB)
                                </p>
                            </div>

                            <Button
                                className="w-full bg-linear-to-r from-primary to-accent hover:opacity-90"
                                onClick={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Lưu thay đổi
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="rounded-3xl bg-card border border-border shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">Bảo mật</h3>
                                <p className="text-sm text-muted-foreground">Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
                            </div>
                        </div>

                        <Separator className="mb-6" />

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu mới"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu mới"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleChangePassword}
                                disabled={changingPassword || !newPassword || !confirmPassword}
                            >
                                {changingPassword ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang đổi mật khẩu...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Đổi mật khẩu
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
