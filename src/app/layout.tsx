import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Vivu Go - Lập kế hoạch chuyến đi hoàn hảo",
  description:
    "Tạo lịch trình chi tiết, tính toán ngân sách và khám phá các điểm đến tuyệt vời với Vivu Go",
  // Để đổi icon/logo sau này:
  // 1. Thay thế file icon.png trong thư mục src/app/ bằng icon mới (giữ nguyên tên icon.png)
  // 2. Thay thế file vivu_logo.png trong thư mục public/ bằng logo mới (giữ nguyên tên vivu_logo.png)
  // 3. (Tùy chọn) Thay thế apple-touch-icon.png trong public/ cho iOS devices
  // 4. Khởi động lại dev server và xóa cache trình duyệt (Ctrl+F5) để thấy thay đổi
  icons: {
    icon: "/vivu_logo.png",
    shortcut: "/vivu_logo.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vivu Go",
  },
  other: {
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://sibykjrokdeepxrmtumn.supabase.co" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
