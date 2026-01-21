"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function ResetPasswordContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isSessionReady, setIsSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const tokens = useMemo(() => {
    const access_token = searchParams?.get("access_token");
    const refresh_token = searchParams?.get("refresh_token");
    return { access_token, refresh_token };
  }, [searchParams]);

  useEffect(() => {
    const setupSession = async () => {
      if (!tokens.access_token || !tokens.refresh_token) {
        setSessionError(
          t("resetPassword.missingToken", "Link không hợp lệ hoặc đã hết hạn."),
        );
        return;
      }
      try {
        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        if (error) throw error;
        setIsSessionReady(true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : t("errors.generic", "Đã xảy ra lỗi");
        setSessionError(message);
      }
    };

    setupSession();
  }, [t, tokens.access_token, tokens.refresh_token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSessionReady) return;

    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Đã xảy ra lỗi"),
        description: t(
          "resetPassword.passwordRequired",
          "Vui lòng nhập mật khẩu mới.",
        ),
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Đã xảy ra lỗi"),
        description: t(
          "resetPassword.passwordMinLength",
          "Mật khẩu phải có ít nhất 6 ký tự.",
        ),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Đã xảy ra lỗi"),
        description: t(
          "resetPassword.passwordMismatch",
          "Mật khẩu xác nhận không khớp.",
        ),
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: t("resetPassword.success", "Đã cập nhật mật khẩu"),
        description: t(
          "resetPassword.successDescription",
          "Bạn có thể đăng nhập với mật khẩu mới.",
        ),
      });
      router.push("/auth");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("errors.generic", "Đã xảy ra lỗi");
      toast({
        variant: "destructive",
        title: t("resetPassword.error", "Không thể đặt lại mật khẩu"),
        description: message,
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="from-secondary via-background to-lavender flex min-h-screen items-center justify-center bg-linear-to-br p-4">
      <Card className="w-full max-w-md bg-card/80 border-0 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="from-primary to-accent mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("resetPassword.title", "Đặt lại mật khẩu")}
          </CardTitle>
          <CardDescription>
            {t(
              "resetPassword.description",
              "Nhập mật khẩu mới để tiếp tục.",
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sessionError ? (
            <p className="text-destructive text-center text-sm">{sessionError}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  {t("resetPassword.newPassword", "Mật khẩu mới")}
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder", "••••••••")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("resetPassword.confirmPassword", "Xác nhận mật khẩu mới")}
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder", "••••••••")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="from-primary to-accent w-full bg-linear-to-r transition-opacity hover:opacity-90"
                disabled={updating || !isSessionReady}
              >
                {updating ? (
                  <span className="animate-pulse">
                    {t("auth.processing", "Đang xử lý...")}
                  </span>
                ) : (
                  <>
                    {t("resetPassword.cta", "Cập nhật mật khẩu")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="text-primary animate-pulse text-xl">Loading...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
