import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
