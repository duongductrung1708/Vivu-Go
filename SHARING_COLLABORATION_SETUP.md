# Hướng dẫn thiết lập Sharing và Collaboration

## Tính năng

1. **Share Link**: Tạo link chia sẻ với quyền đọc hoặc chỉnh sửa
2. **Thời hạn link**: Có thể đặt thời hạn cho link chia sẻ
3. **Mời cộng tác**: Mời người dùng khác tham gia chỉnh sửa qua email
4. **Realtime Collaboration**: Đồng bộ thay đổi realtime (cần setup Supabase Realtime)

## Bước 1: Chạy SQL Migrations

Chạy các file migration sau trong Supabase SQL Editor:

1. `supabase/migrations/002_create_sharing_and_collaboration.sql`
2. `supabase/migrations/003_add_invite_collaborator_function.sql`

## Bước 2: Bật Realtime (Tùy chọn)

Để hỗ trợ realtime collaboration:

1. Vào Supabase Dashboard → Database → Replication
2. Bật Realtime cho các tables:
   - `itineraries`
   - `itinerary_shares`
   - `itinerary_collaborators`

Hoặc chạy SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.itineraries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itinerary_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itinerary_collaborators;
```

## Cấu trúc Database

### itinerary_shares
- `id`: UUID
- `itinerary_id`: UUID (FK → itineraries)
- `created_by`: UUID (FK → auth.users)
- `share_token`: TEXT (Unique token cho link)
- `permission`: TEXT ('read' hoặc 'edit')
- `expires_at`: TIMESTAMP (Thời hạn link)
- `is_active`: BOOLEAN

### itinerary_collaborators
- `id`: UUID
- `itinerary_id`: UUID (FK → itineraries)
- `user_id`: UUID (FK → auth.users)
- `invited_by`: UUID (FK → auth.users)
- `permission`: TEXT ('read' hoặc 'edit')
- `status`: TEXT ('pending', 'accepted', 'declined')

## Cách sử dụng

### Tạo Share Link

1. Vào Dashboard → Click vào menu "..." của một itinerary
2. Chọn "Chia sẻ"
3. Chọn tab "Link chia sẻ"
4. Nhập số ngày hết hạn (tùy chọn)
5. Click "Tạo link đọc" hoặc "Tạo link chỉnh sửa"
6. Copy link và chia sẻ

### Mời Cộng tác

1. Vào Dashboard → Click vào menu "..." của một itinerary
2. Chọn "Chia sẻ"
3. Chọn tab "Người cộng tác"
4. Nhập email người dùng
5. Chọn quyền (Đọc hoặc Chỉnh sửa)
6. Click "Mời"

### Xem Shared Itinerary

Truy cập: `/share/[token]`

Link sẽ tự động:
- Kiểm tra token hợp lệ
- Kiểm tra thời hạn
- Hiển thị quyền (đọc/chỉnh sửa)
- Cho phép đăng nhập để chỉnh sửa (nếu có quyền)

## Bảo mật

- Row Level Security (RLS) đã được bật
- Users chỉ có thể tạo share links cho itinerary của mình
- Share links có thể có thời hạn
- Collaborators chỉ có thể chỉnh sửa nếu có quyền 'edit'
- Share links có thể bị vô hiệu hóa (is_active = false)

## Realtime Collaboration

Để bật realtime collaboration, cần:

1. Bật Realtime cho tables (xem Bước 2)
2. Sử dụng Supabase Realtime subscriptions trong components
3. Listen to changes và update UI tự động

Ví dụ:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Subscribe to itinerary changes
const channel = supabase
  .channel(`itinerary:${itineraryId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'itineraries',
    filter: `id=eq.${itineraryId}`
  }, (payload) => {
    // Handle realtime update
    console.log('Itinerary updated:', payload.new);
  })
  .subscribe();
```

## Lưu ý

- Người dùng cần đăng ký tài khoản trước khi được mời cộng tác
- Share links không yêu cầu đăng nhập để xem (nếu public)
- Để chỉnh sửa qua share link, người dùng cần đăng nhập
- Collaborators sẽ nhận thông báo khi được mời (cần implement notification system)
