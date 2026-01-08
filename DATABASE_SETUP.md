# Hướng dẫn thiết lập Database cho Itineraries

## Bước 1: Tạo bảng trong Supabase

1. Đăng nhập vào Supabase Dashboard
2. Vào **SQL Editor**
3. Chạy file SQL migration: `supabase/migrations/001_create_itineraries.sql`

Hoặc copy và paste nội dung sau vào SQL Editor:

```sql
-- Create itineraries table
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  total_budget DECIMAL(12, 2) DEFAULT 0,
  people_count INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  trip_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON public.itineraries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own itineraries"
  ON public.itineraries FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own itineraries"
  ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
  ON public.itineraries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries"
  ON public.itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Bước 2: Kiểm tra

Sau khi chạy SQL, kiểm tra:
- Bảng `itineraries` đã được tạo trong **Table Editor**
- Row Level Security đã được bật
- Policies đã được tạo

## Cấu trúc dữ liệu

### Itinerary Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → auth.users)
- `title`: TEXT (Tên lịch trình)
- `description`: TEXT (Mô tả)
- `start_date`: DATE (Ngày bắt đầu)
- `end_date`: DATE (Ngày kết thúc)
- `total_budget`: DECIMAL (Tổng ngân sách)
- `people_count`: INTEGER (Số người)
- `is_public`: BOOLEAN (Công khai)
- `trip_data`: JSONB (Dữ liệu chi tiết: days, places, etc.)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## Bảo mật

- Row Level Security (RLS) đã được bật
- Users chỉ có thể xem/sửa/xóa lịch trình của chính họ
- Lịch trình công khai (`is_public = true`) có thể được xem bởi mọi người

## Sử dụng

Sau khi setup xong, bạn có thể:
1. Truy cập `/dashboard` để quản lý lịch trình
2. Tạo lịch trình mới
3. Xem danh sách lịch trình đã tạo
4. Chỉnh sửa hoặc xóa lịch trình
