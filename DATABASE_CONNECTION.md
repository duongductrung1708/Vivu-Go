# Hướng dẫn sử dụng PostgreSQL Connection String

## Connection String là gì?

Connection string này cho phép kết nối trực tiếp đến database PostgreSQL của Supabase:

```
postgresql://postgres:[YOUR-PASSWORD]@db.sibykjrokdeepxrmtumn.supabase.co:5432/postgres
```

## Khi nào cần dùng?

### 1. **Kết nối từ Server-side (API Routes)**

Khi bạn cần truy vấn database trực tiếp từ Next.js API routes hoặc server components (không qua Supabase client SDK).

### 2. **Quản lý Database với công cụ bên ngoài**

- **pgAdmin**: Quản lý database qua GUI
- **DBeaver**: Database management tool
- **TablePlus**: Database client
- **psql**: Command line tool

### 3. **Chạy Migrations**

Khi bạn cần chạy SQL migrations hoặc scripts database.

### 4. **Backup/Restore Database**

Sao lưu hoặc khôi phục dữ liệu.

## Cách sử dụng

### Option 1: Sử dụng trong Next.js API Routes

Cài đặt package:

```bash
npm install pg
npm install --save-dev @types/pg
```

Tạo file `.env.local`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.sibykjrokdeepxrmtumn.supabase.co:5432/postgres
```

Sử dụng trong API route:

```typescript
// src/app/api/example/route.ts
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM users");
    return Response.json(result.rows);
  } finally {
    client.release();
  }
}
```

### Option 2: Sử dụng với công cụ quản lý Database

1. **pgAdmin**:

   - Tạo new server
   - Host: `db.sibykjrokdeepxrmtumn.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `[YOUR-PASSWORD]`

2. **DBeaver/TablePlus**:

   - Tạo connection mới
   - Chọn PostgreSQL
   - Nhập connection string hoặc thông tin riêng lẻ

3. **psql (Command Line)**:
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.sibykjrokdeepxrmtumn.supabase.co:5432/postgres"
   ```

## ⚠️ Lưu ý bảo mật

1. **KHÔNG commit password vào Git**

   - Luôn sử dụng `.env.local` (đã có trong `.gitignore`)
   - Không đặt password trực tiếp trong code

2. **Sử dụng Connection Pooling**

   - Supabase cung cấp connection pooling
   - Sử dụng port `6543` cho connection pooling (thay vì `5432`)

3. **Row Level Security (RLS)**
   - Supabase client SDK tự động xử lý RLS
   - Khi dùng connection string trực tiếp, bạn cần tự xử lý RLS

## Hiện tại ứng dụng của bạn

Ứng dụng hiện tại đang sử dụng **Supabase Client SDK** (qua `@/integrations/supabase/client`), nên **KHÔNG CẦN** connection string này trừ khi:

- Bạn muốn truy vấn database trực tiếp từ server-side
- Bạn cần quản lý database bằng công cụ bên ngoài
- Bạn cần chạy migrations hoặc scripts phức tạp

## Kết luận

Connection string này là **tùy chọn**, không bắt buộc cho ứng dụng Next.js hiện tại. Bạn chỉ cần:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Để sử dụng Supabase Client SDK (đã được cấu hình sẵn).
