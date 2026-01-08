import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          Trang bạn tìm không tồn tại.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-primary-foreground text-sm font-semibold shadow-md hover:bg-primary/90 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
