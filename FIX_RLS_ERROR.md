# Hướng dẫn sửa lỗi RLS Infinite Recursion

## Lỗi gặp phải

```
Error: Failed to run sql query: ERROR: 42710: policy "Users can insert their own itineraries" for table "itineraries" already exists
```

## Nguyên nhân

Policy đã tồn tại từ migration trước đó, nhưng migration fix không xóa hết các policies cũ.

## Cách sửa

### Cách 1: Chạy SQL để xóa tất cả policies trước

Chạy đoạn SQL này TRƯỚC khi chạy migration 004:

```sql
-- Xóa TẤT CẢ policies của itineraries
DROP POLICY IF EXISTS "Users can view their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Collaborators can view itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Collaborators can update itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can insert their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can delete their own itineraries" ON public.itineraries;

-- Xóa TẤT CẢ policies của itinerary_collaborators
DROP POLICY IF EXISTS "Users can view collaborations for their itineraries" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Users can invite collaborators to their itineraries" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Users can update their own collaboration status" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Itinerary owners can update collaborators" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Itinerary owners can remove collaborators" ON public.itinerary_collaborators;

-- Xóa TẤT CẢ policies của itinerary_shares
DROP POLICY IF EXISTS "Users can view shares for their itineraries" ON public.itinerary_shares;
DROP POLICY IF EXISTS "Anyone can view active shares by token" ON public.itinerary_shares;
DROP POLICY IF EXISTS "Users can create shares for their itineraries" ON public.itinerary_shares;
DROP POLICY IF EXISTS "Users can update shares for their itineraries" ON public.itinerary_shares;
DROP POLICY IF EXISTS "Users can delete shares for their itineraries" ON public.itinerary_shares;
```

Sau đó chạy file `004_fix_rls_infinite_recursion.sql`

### Cách 2: Xóa tất cả policies bằng cách tắt RLS tạm thời

```sql
-- Tắt RLS tạm thời
ALTER TABLE public.itineraries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_shares DISABLE ROW LEVEL SECURITY;

-- Xóa tất cả policies (sẽ tự động xóa khi disable RLS)
-- Hoặc xóa thủ công:
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('itineraries', 'itinerary_collaborators', 'itinerary_shares')) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Bật lại RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_shares ENABLE ROW LEVEL SECURITY;
```

Sau đó chạy file `004_fix_rls_infinite_recursion.sql`

### Cách 3: Xem và xóa policies thủ công

1. Vào Supabase Dashboard → Database → Policies
2. Xem tất cả policies của các bảng:
   - `itineraries`
   - `itinerary_collaborators`
   - `itinerary_shares`
3. Xóa từng policy một
4. Sau đó chạy file `004_fix_rls_infinite_recursion.sql`

## Sau khi sửa

Sau khi chạy migration thành công, bạn sẽ có:
- Helper functions để tránh infinite recursion
- Policies mới không gây vòng lặp
- Hệ thống hoạt động bình thường
