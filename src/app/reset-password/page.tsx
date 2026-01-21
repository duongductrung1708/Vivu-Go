"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

function ResetPasswordContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }, []);

  const [isLinkReady, setIsLinkReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  const tokens = useMemo(() => {
    const fromQuery = {
      error: searchParams?.get("error"),
      error_description: searchParams?.get("error_description"),
      code: searchParams?.get("code"),
      token_hash: searchParams?.get("token_hash"),
      type: searchParams?.get("type"),
      access_token: searchParams?.get("access_token"),
      refresh_token: searchParams?.get("refresh_token"),
    };

    // Supabase often puts recovery tokens in URL hash: #access_token=...&refresh_token=...
    const fromHash: Record<string, string> = {};
    if (typeof window !== "undefined" && window.location.hash) {
      const raw = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      for (const part of raw.split("&")) {
        const [k, v] = part.split("=");
        if (k && typeof v === "string") {
          fromHash[decodeURIComponent(k)] = decodeURIComponent(v);
        }
      }
    }

    const merged = { ...fromHash, ...fromQuery };
    const normalized = {
      error: merged.error ?? null,
      error_description: merged.error_description ?? null,
      code: merged.code ?? null,
      token_hash: merged.token_hash ?? null,
      type: merged.type ?? null,
      access_token: merged.access_token ?? null,
      refresh_token: merged.refresh_token ?? null,
    };

    // Remove tokens from the address bar to prevent accidental reuse/leaks.
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, "/reset-password");
    }

    return normalized;
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
    supabase,
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

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast({
        variant: "destructive",
        title: t("errors.generic", "Đã xảy ra lỗi"),
        description: t("auth.invalidEmail", "Email không hợp lệ"),
      });
      return;
    }
    setResending(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      toast({
        title: t("auth.resetEmailSent", "Đã gửi email"),
        description: t(
          "auth.resetEmailSentDescription",
          "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu.",
        ),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic", "Đã xảy ra lỗi");
      toast({
        variant: "destructive",
        title: t("auth.resetEmailFailed", "Không thể gửi email"),
        description: message,
      });
    } finally {
      setResending(false);
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
            <div className="space-y-4">
              <p className="text-destructive text-center text-sm">{sessionError}</p>
              <form onSubmit={handleResend} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="resendEmail">{t("auth.email", "Email")}</Label>
                  <Input
                    id="resendEmail"
                    type="email"
                    placeholder={t("auth.emailPlaceholder", "email@example.com")}
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <Button
                  type="submit"
                  className="from-primary to-accent w-full bg-linear-to-r transition-opacity hover:opacity-90"
                  disabled={resending}
                >
                  {resending ? (
                    <span className="animate-pulse">
                      {t("auth.processing", "Đang xử lý...")}
                    </span>
                  ) : (
                    t("auth.sendResetLink", "Gửi link đặt lại mật khẩu")
                  )}
                </Button>
              </form>
            </div>
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
                    type={showNewPassword ? "text" : "password"}
                    placeholder={t("auth.passwordPlaceholder", "••••••••")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
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
                <Label htmlFor="confirmPassword">
                  {t("resetPassword.confirmPassword", "Xác nhận mật khẩu mới")}
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth.passwordPlaceholder", "••••••••")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
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
