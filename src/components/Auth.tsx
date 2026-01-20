"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MapPin, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

function AuthContent() {
  const { t, i18n } = useTranslation();

  const emailSchema = z.string().email(t("auth.invalidEmail", "Email không hợp lệ"));
  const passwordSchema = z
    .string()
    .min(6, t("auth.passwordMinLength", "Mật khẩu phải có ít nhất 6 ký tự"));
  const nameSchema = z.string().min(2, t("auth.nameMinLength", "Tên phải có ít nhất 2 ký tự"));

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
  }>({});

  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") || null;

  useEffect(() => {
    if (user) {
      const redirectTo = returnUrl || "/dashboard";
      router.push(redirectTo);
    }
  }, [user, router, returnUrl]);

  if (authLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-primary animate-pulse text-xl">{t("common.loading")}</div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.issues[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.issues[0].message;
    }

    if (!isLogin) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.issues[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: t("auth.loginFailed", "Đăng nhập thất bại"),
            description:
              error.message === "Invalid login credentials"
                ? t("auth.invalidCredentials", "Email hoặc mật khẩu không đúng")
                : error.message,
          });
        } else {
          toast({
            title: t("auth.loginSuccess", "Đăng nhập thành công!"),
            description: t("auth.welcomeBack", "Chào mừng bạn trở lại!"),
          });
          // Redirect to dashboard after successful login
          router.push("/dashboard");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            variant: "destructive",
            title: t("auth.signupFailed", "Đăng ký thất bại"),
            description: error.message.includes("already registered")
              ? t("auth.emailAlreadyRegistered", "Email này đã được đăng ký")
              : error.message,
          });
        } else {
          toast({
            title: t("auth.signupSuccess", "Đăng ký thành công!"),
            description: t("auth.canLoginNow", "Bạn có thể đăng nhập ngay bây giờ."),
          });
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="from-secondary via-background to-lavender flex min-h-screen items-center justify-center bg-linear-to-br p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card/80 border-0 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            <motion.div
              className="from-primary to-accent mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <MapPin className="h-8 w-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Đăng nhập để tiếp tục lên kế hoạch chuyến đi"
                : "Bắt đầu hành trình khám phá của bạn"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <div className="relative">
                    <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="fullName"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                className="from-primary to-accent w-full bg-linear-to-r transition-opacity hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">Đang xử lý...</span>
                ) : (
                  <>
                    {isLogin ? "Đăng nhập" : "Đăng ký"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-primary ml-1 font-medium hover:underline"
                >
                  {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function Auth() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="text-primary animate-pulse text-xl">Loading...</div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
