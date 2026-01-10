# Email Setup Guide

Để gửi email khi mời collaborator, bạn cần cấu hình một email service.

## Option 1: Sử dụng Resend (Khuyến nghị)

1. Đăng ký tài khoản tại [Resend](https://resend.com) (miễn phí 3,000 emails/tháng)
2. Tạo API key từ dashboard
3. Thêm vào file `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Lưu ý**: Bạn cần verify domain hoặc sử dụng email đã được Resend verify.

## Option 2: Sử dụng Nodemailer với SMTP

1. Cài đặt nodemailer:

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

2. Thêm vào `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

3. Cập nhật `src/app/api/send-invitation-email/route.ts` để sử dụng Nodemailer.

## Option 3: Sử dụng Supabase Edge Functions

Bạn có thể tạo một Supabase Edge Function để gửi email. Xem thêm tại [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions).

## Biến môi trường cần thiết

Thêm các biến sau vào `.env.local`:

```env
# Supabase (đã có sẵn)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
# Hoặc Vercel sẽ tự động set VERCEL_URL

# Email Service (chọn một)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Hoặc SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

## Cách lấy SUPABASE_SERVICE_ROLE_KEY

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** (biểu tượng bánh răng) ở sidebar bên trái
4. Chọn **API** trong menu Settings
5. Tìm phần **Project API keys**
6. Copy **`service_role`** key (không phải `anon` key)
   - ⚠️ **LƯU Ý QUAN TRỌNG**: Service role key có quyền bypass RLS và có toàn quyền truy cập database
   - **KHÔNG BAO GIỜ** commit key này vào Git hoặc expose nó ở client-side
   - Chỉ sử dụng trong server-side code (API routes, server components)
   - Nếu key bị lộ, hãy regenerate ngay lập tức

**Vị trí trong Dashboard:**

```
Project → Settings (⚙️) → API → Project API keys → service_role (secret)
```

## Testing

Sau khi cấu hình, thử mời một collaborator bằng email. Email sẽ được gửi tự động khi:

- Collaboration record được tạo thành công
- Email service được cấu hình đúng

Nếu email không được gửi, kiểm tra:

1. Console logs trong API route
2. Email service logs (Resend dashboard, etc.)
3. Biến môi trường đã được set đúng chưa
