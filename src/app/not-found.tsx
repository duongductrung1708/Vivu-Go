import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-foreground text-5xl font-bold">404</h1>
        <p className="text-muted-foreground text-lg">Trang bạn tìm không tồn tại.</p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-md transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
