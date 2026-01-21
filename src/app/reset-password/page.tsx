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

  const [isLinkReady, setIsLinkReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const tokens = useMemo(() => {
    const error = searchParams?.get("error");
    const error_description = searchParams?.get("error_description");
    const code = searchParams?.get("code");
    const token_hash = searchParams?.get("token_hash");
    const type = searchParams?.get("type");
    const access_token = searchParams?.get("access_token");
    const refresh_token = searchParams?.get("refresh_token");
    return { error, error_description, code, token_hash, type, access_token, refresh_token };
  }, [searchParams]);

  useEffect(() => {
    // IMPORTANT: Do NOT auto-create a session on page load.
    // Otherwise, clicking the reset link would "log the user in" immediately.
    if (tokens.error || tokens.error_description) {
      setSessionError(
        tokens.error_description ||
          tokens.error ||
          t("resetPassword.missingToken", "Link không hợp lệ hoặc đã hết hạn."),
      );
      return;
    }

    const hasAnyValidToken =
      !!tokens.code ||
      (!!tokens.token_hash && !!tokens.type) ||
      (!!tokens.access_token && !!tokens.refresh_token);

    if (!hasAnyValidToken) {
      setSessionError(t("resetPassword.missingToken", "Link không hợp lệ hoặc đã hết hạn."));
      return;
    }

    setIsLinkReady(true);
  }, [
    t,
    tokens.access_token,
    tokens.refresh_token,
    tokens.code,
    tokens.token_hash,
    tokens.type,
    tokens.error,
    tokens.error_description,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLinkReady) return;

    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Đã xảy ra lỗi"),
        description: t("resetPassword.passwordRequired", "Vui lòng nhập mật khẩu mới."),
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Đã xảy ra lỗi"),
        description: t("resetPassword.passwordMinLength", "Mật khẩu phải có ít nhất 6 ký tự."),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Đã xảy ra lỗi"),
        description: t("resetPassword.passwordMismatch", "Mật khẩu xác nhận không khớp."),
      });
      return;
    }

    setUpdating(true);
    try {
      // Create a temporary session ONLY when user submits the new password.
      if (tokens.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(tokens.code);
        if (error) throw error;
      } else if (tokens.token_hash && tokens.type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokens.token_hash,
          type: tokens.type as "recovery",
        });
        if (error) throw error;
      } else if (tokens.access_token && tokens.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        if (error) throw error;
      } else {
        throw new Error(t("resetPassword.missingToken", "Link không hợp lệ hoặc đã hết hạn."));
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Force re-login after password reset (your requested behavior).
      await supabase.auth.signOut();

      toast({
        title: t("resetPassword.success", "Đã cập nhật mật khẩu"),
        description: t(
          "resetPassword.successDescription",
          "Bạn có thể đăng nhập với mật khẩu mới.",
        ),
      });
      router.push("/auth");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.generic", "Đã xảy ra lỗi");
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
      <Card className="bg-card/80 w-full max-w-md border-0 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="from-primary to-accent mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("resetPassword.title", "Đặt lại mật khẩu")}
          </CardTitle>
          <CardDescription>
            {t("resetPassword.description", "Nhập mật khẩu mới để tiếp tục.")}
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
                disabled={updating || !isLinkReady}
              >
                {updating ? (
                  <span className="animate-pulse">{t("auth.processing", "Đang xử lý...")}</span>
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
