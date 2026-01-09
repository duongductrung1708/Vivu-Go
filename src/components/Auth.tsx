"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Email không hợp lệ");
const passwordSchema = z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự");
const nameSchema = z.string().min(2, "Tên phải có ít nhất 2 ký tự");

function AuthContent() {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Đang tải...</div>
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
            title: "Đăng nhập thất bại",
            description:
              error.message === "Invalid login credentials"
                ? "Email hoặc mật khẩu không đúng"
                : error.message,
          });
        } else {
          toast({
            title: "Đăng nhập thành công!",
            description: "Chào mừng bạn trở lại!",
          });
          // Redirect to dashboard after successful login
          router.push("/dashboard");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            variant: "destructive",
            title: "Đăng ký thất bại",
            description: error.message.includes("already registered")
              ? "Email này đã được đăng ký"
              : error.message,
          });
        } else {
          toast({
            title: "Đăng ký thành công!",
            description: "Bạn có thể đăng nhập ngay bây giờ.",
          });
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-secondary via-background to-lavender flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <motion.div
              className="mx-auto mb-4 w-16 h-16 bg-linear-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <MapPin className="w-8 h-8 text-white" />
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
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-linear-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">Đang xử lý...</span>
                ) : (
                  <>
                    {isLogin ? "Đăng nhập" : "Đăng ký"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="ml-1 text-primary font-medium hover:underline"
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
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Đang tải...</div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
