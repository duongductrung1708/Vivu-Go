# Chi tiết Công nghệ sử dụng trong dự án Vivu-Go

Tài liệu này mô tả chi tiết các công nghệ được sử dụng trong dự án Vivu-Go, vai trò của chúng và ví dụ code cụ thể.

---

## 1. Next.js 16

### Tác dụng

Next.js là framework React chính của dự án, cung cấp:

- **App Router**: Hệ thống routing dựa trên file system
- **Server Components & Client Components**: Tối ưu hiệu suất với server-side rendering
- **API Routes**: Xử lý backend logic (chat AI, email, weather)
- **Automatic Code Splitting**: Tự động tối ưu bundle size
- **Image Optimization**: Tối ưu hình ảnh tự động

### Tác dụng trong dự án Vivu-Go

**1. App Router cho routing đơn giản:**

- `/` - Landing page (src/app/page.tsx)
- `/trip` - Trang lập kế hoạch chuyến đi (src/app/trip/page.tsx)
- `/dashboard` - Dashboard quản lý lịch trình (src/app/dashboard/page.tsx)
- `/itinerary/[id]` - Chi tiết lịch trình (src/app/itinerary/[id]/page.tsx)
- `/share/[token]` - Chia sẻ lịch trình công khai (src/app/share/[token]/page.tsx)

**2. API Routes xử lý backend:**

- `/api/chat` - Xử lý chat với Google Gemini AI
- `/api/send-invitation-email` - Gửi email mời cộng tác
- `/api/weather` - Lấy dữ liệu thời tiết từ OpenWeatherMap

**3. Server-side rendering:**

- Landing page được render trên server để tối ưu SEO
- Metadata tự động cho mỗi trang (title, description)

**4. Code splitting tự động:**

- Mỗi route chỉ load code cần thiết
- Giảm bundle size, tăng tốc độ load trang

### Tại sao chọn Next.js?

- **Full-stack framework**: Không cần setup backend riêng cho API routes
- **SEO-friendly**: SSR giúp landing page được index tốt trên Google
- **Performance**: Tự động optimize, code splitting, image optimization
- **Developer Experience**: Hot reload, TypeScript support, excellent tooling
- **Production-ready**: Dễ deploy lên Vercel, có sẵn analytics và monitoring

### Ví dụ Code

#### App Router Structure

```typescript
// src/app/page.tsx - Landing page
import Index from "@/components/Index";

export default function Home() {
  return <Index />;
}

// src/app/trip/page.tsx - Trip planning page
("use client");

export const dynamic = "force-dynamic"; // Force dynamic rendering

export default function TripPage() {
  // Client component logic
  return <TripPlanningComponent />;
}
```

#### API Routes

```typescript
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Xử lý logic backend
  return NextResponse.json({ message: "Success" });
}
```

#### Layout với Metadata

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vivu Go - Lập kế hoạch chuyến đi hoàn hảo",
  description: "Tạo lịch trình chi tiết, tính toán ngân sách...",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

---

## 2. TypeScript

### Tác dụng

TypeScript cung cấp:

- **Type Safety**: Phát hiện lỗi tại compile time
- **IntelliSense**: Gợi ý code tốt hơn trong IDE
- **Refactoring**: An toàn khi refactor code
- **Documentation**: Types như documentation tự động

### Tác dụng trong dự án Vivu-Go

**1. Type-safe Trip Data:**

- Đảm bảo cấu trúc `Trip`, `Day`, `Place` luôn đúng
- Phát hiện lỗi khi thêm/sửa/xóa places
- Tránh lỗi runtime khi truy cập properties không tồn tại

**2. Type-safe API Calls:**

- `Itinerary` interface đảm bảo response từ Supabase đúng format
- Phát hiện lỗi khi gọi API với sai parameters
- Auto-complete khi làm việc với Supabase queries

**3. Type-safe Store (Zustand):**

- `TripStore` interface định nghĩa rõ ràng các actions và state
- Phát hiện lỗi khi gọi sai method hoặc truyền sai parameters
- IntelliSense khi sử dụng `useTripStore()` trong components

**4. Type-safe Hooks:**

- `useItineraries()` return type rõ ràng: `{ data, isLoading, error }`
- `useCreateItinerary()` mutation type-safe với `CreateItineraryInput`
- Phát hiện lỗi khi sử dụng hooks sai cách

**5. Giảm bugs trong production:**

- Compile-time errors thay vì runtime errors
- Refactor an toàn khi thay đổi structure
- Code review dễ dàng hơn với types

### Tại sao chọn TypeScript?

- **Dự án phức tạp**: Nhiều data structures (Trip, Day, Place, Itinerary) cần type safety
- **Team collaboration**: Types giúp team hiểu code dễ hơn
- **Maintainability**: Dễ maintain và refactor khi dự án lớn
- **IDE support**: IntelliSense giúp code nhanh hơn, ít lỗi hơn
- **Industry standard**: Hầu hết dự án React hiện đại đều dùng TypeScript

### Ví dụ Code

#### Type Definitions

```typescript
// src/store/useTripStore.ts
export type TimeSlot = "morning" | "noon" | "afternoon" | "evening";

export type Place = {
  id: string;
  name: string;
  timeSlot: TimeSlot;
  category:
    | "food"
    | "sightseeing"
    | "culture"
    | "coffee"
    | "shopping"
    | "other";
  estimatedCost: number;
  specificTime?: string; // Optional property
  latitude?: number;
  longitude?: number;
};

export type Day = {
  id: string;
  date: string; // ISO date
  places: Place[];
};

export type Trip = {
  name: string;
  startDate: string;
  endDate: string;
  peopleCount: number;
  totalBudget: number;
  days: Day[];
};
```

#### Type-safe Store Interface

```typescript
type TripStore = {
  trip: Trip;
  selectedDayId: string;
  selectedPlaceId?: string;
  setTrip: (trip: Trip) => void;
  addPlace: (dayId: string, place: Omit<Place, "id">) => void;
  updatePlace: (
    dayId: string,
    placeId: string,
    updates: Partial<Place>
  ) => void;
  // ... more methods
};
```

#### API Response Types

```typescript
// src/hooks/useItineraries.ts
export interface Itinerary {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_budget: number;
  people_count: number;
  is_public: boolean;
  trip_data: Trip;
  created_at: string;
  updated_at: string;
}
```

---

## 3. Tailwind CSS v4

### Tác dụng

Tailwind CSS cung cấp:

- **Utility-first CSS**: Viết style nhanh chóng với utility classes
- **Responsive Design**: Dễ dàng tạo responsive với breakpoints
- **Dark Mode**: Hỗ trợ dark mode tự động
- **Custom Design System**: Tùy biến màu sắc, spacing theo design system

### Tác dụng trong dự án Vivu-Go

**1. Design System nhất quán:**

- Màu sắc: `primary`, `secondary`, `accent` được định nghĩa trong CSS variables
- Spacing: Sử dụng scale nhất quán (`p-4`, `gap-6`, `mb-8`)
- Typography: Font sizes và weights nhất quán (`text-2xl`, `font-bold`)

**2. Responsive Design:**

- Landing page responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Dashboard responsive: Sidebar collapse trên mobile
- Trip planning page: Layout thay đổi theo screen size

**3. Component Styling nhanh:**

- Không cần viết CSS riêng, chỉ cần utility classes
- Ví dụ: `<div className="flex flex-col gap-4 p-6 bg-background rounded-lg">`
- Dễ maintain, không có CSS conflicts

**4. Dark Mode Support:**

- Sử dụng `dark:` prefix cho dark mode styles
- Tự động thay đổi theo theme của user
- Ví dụ: `bg-white dark:bg-gray-900`

**5. Performance:**

- Purge unused CSS tự động
- Bundle size nhỏ hơn so với custom CSS
- Load nhanh hơn

### Tại sao chọn Tailwind CSS?

- **Development speed**: Viết style nhanh, không cần switch giữa files
- **Consistency**: Design system nhất quán, khó có styling conflicts
- **Responsive**: Dễ tạo responsive với breakpoints
- **Maintainability**: Không có CSS files riêng, dễ maintain
- **Modern**: Industry standard, được nhiều dự án lớn sử dụng

### Ví dụ Code

#### Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Custom colors từ CSS variables
      },
    },
  },
};
```

#### Component Styling

```tsx
// Sử dụng utility classes
<div className="flex flex-col gap-4 p-6 bg-background rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-foreground">Trip Details</h2>
  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
    Save Trip
  </button>
</div>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

// Dark mode support
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* Tự động thay đổi theo theme */}
</div>
```

---

## 4. Supabase (PostgreSQL)

### Tác dụng

Supabase cung cấp:

- **PostgreSQL Database**: Database quan hệ mạnh mẽ
- **Authentication**: Hệ thống xác thực người dùng
- **Row Level Security (RLS)**: Bảo mật dữ liệu ở database level
- **Real-time Subscriptions**: Đồng bộ dữ liệu real-time
- **RESTful API**: Tự động tạo API từ database schema

### Tác dụng trong dự án Vivu-Go

**1. Authentication:**

- User đăng ký/đăng nhập qua Supabase Auth
- Session management tự động
- Protected routes: Chỉ user đã login mới vào được `/dashboard`, `/trip`
- User context: `useAuth()` hook cung cấp user info cho toàn app

**2. Database cho Itineraries:**

- Lưu trữ lịch trình: `itineraries` table với JSONB cho `trip_data`
- Quan hệ: `itineraries.user_id` → `auth.users.id`
- Indexes: Tối ưu queries với `idx_itineraries_user_id`, `idx_itineraries_created_at`

**3. Row Level Security (RLS):**

- Users chỉ xem được lịch trình của mình hoặc public itineraries
- Users chỉ edit/delete được lịch trình của mình
- Bảo mật ở database level, không cần check ở application level

**4. Sharing & Collaboration:**

- `itinerary_shares` table: Lưu share tokens
- `itinerary_collaborators` table: Quản lý collaborators
- RLS policies đảm bảo chỉ owner/collaborators mới xem được

**5. Real-time Sync:**

- Khi user A sửa itinerary, user B (collaborator) thấy thay đổi ngay
- Sử dụng Supabase Realtime subscriptions
- Không cần refresh trang

**6. Functions & Triggers:**

- `invite_collaborator()` function: Xử lý logic mời cộng tác
- `update_updated_at_column()` trigger: Tự động update `updated_at`
- `user_owns_itinerary()` function: Check ownership

### Tại sao chọn Supabase?

- **Backend as a Service**: Không cần setup server riêng, có sẵn database + auth
- **PostgreSQL**: Database mạnh mẽ, hỗ trợ JSONB cho flexible data
- **RLS**: Bảo mật tốt, đảm bảo data isolation giữa users
- **Real-time**: Hỗ trợ collaboration real-time dễ dàng
- **Free tier**: Đủ cho dự án nhỏ/medium, có thể scale lên
- **Developer Experience**: Dashboard tốt, migrations dễ quản lý

### Ví dụ Code

#### Client Setup

```typescript
// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### Authentication

```typescript
// src/contexts/AuthContext.tsx
import { supabase } from "@/integrations/supabase/client";

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };
}
```

#### Database Queries

```typescript
// src/hooks/useItineraries.ts
import { supabase } from "@/integrations/supabase/client";

export function useItineraries() {
  return useQuery({
    queryKey: ["itineraries", user?.id],
    queryFn: async () => {
      // RLS tự động filter theo user
      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Itinerary[];
    },
  });
}

// Create itinerary
const { data, error } = await supabase
  .from("itineraries")
  .insert({
    user_id: user.id,
    title: "My Trip",
    trip_data: tripData,
  })
  .select()
  .single();
```

#### Row Level Security (RLS)

```sql
-- supabase/migrations/001_create_itineraries.sql
-- Enable RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own itineraries
CREATE POLICY "Users can view their own itineraries"
  ON public.itineraries FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Policy: Users can only update their own itineraries
CREATE POLICY "Users can update their own itineraries"
  ON public.itineraries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 5. Google Gemini AI

### Tác dụng

Google Gemini AI cung cấp:

- **AI Chat Assistant**: Trợ lý AI tư vấn du lịch
- **Context-aware Responses**: Hiểu context về chuyến đi hiện tại
- **Natural Language Processing**: Xử lý ngôn ngữ tự nhiên tiếng Việt
- **Travel Recommendations**: Gợi ý địa điểm, nhà hàng, lịch trình

### Tác dụng trong dự án Vivu-Go

**1. AI Chat Assistant trong Trip Planning:**

- Component `PlaceChatAssistant` cho phép user chat với AI
- AI hiểu context về chuyến đi hiện tại (tên trip, các địa điểm đã thêm)
- Trả lời bằng tiếng Việt, thân thiện và hữu ích

**2. Context-aware Recommendations:**

- AI biết user đang ở đâu (location từ geolocation)
- AI biết user đã thêm những địa điểm nào
- AI đưa ra gợi ý phù hợp với lịch trình hiện tại

**3. Travel Advice:**

- Gợi ý địa điểm tham quan
- Gợi ý nhà hàng, quán cà phê
- Tư vấn lịch trình tối ưu
- Trả lời câu hỏi về du lịch Việt Nam

**4. Integration với Trip Data:**

- Khi user hỏi "Nên đi đâu tiếp theo?", AI biết các địa điểm đã có
- Khi user hỏi "Nhà hàng nào gần đây?", AI biết location hiện tại
- AI có thể đề xuất thêm địa điểm vào lịch trình

**5. API Route:**

- `/api/chat` xử lý requests từ client
- Build context-aware prompt với thông tin trip
- Sử dụng `gemini-2.5-flash` model (nhanh, rẻ)
- Fallback sang `gemini-pro` nếu cần

### Tại sao chọn Google Gemini AI?

- **Tiếng Việt tốt**: Gemini hiểu và trả lời tiếng Việt tốt hơn các model khác
- **Context-aware**: Có thể nhận context dài, phù hợp với trip data
- **Free tier**: Có free tier đủ cho development và testing
- **Fast**: `gemini-2.5-flash` model nhanh, phù hợp cho chat real-time
- **Easy integration**: API đơn giản, dễ tích hợp với Next.js API routes

### Ví dụ Code

#### API Route

```typescript
// src/app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, context } = body;

  // Build context-aware prompt
  let systemPrompt = `Bạn là một trợ lý AI chuyên tư vấn về du lịch và địa điểm tại Việt Nam. 
Bạn giúp người dùng tìm hiểu về các địa điểm, nhà hàng, điểm tham quan, và đưa ra lời khuyên về lịch trình du lịch.

Hãy trả lời bằng tiếng Việt, thân thiện và hữu ích.`;

  // Add trip context
  if (context) {
    systemPrompt += `\n\nThông tin về chuyến đi hiện tại của người dùng:\n`;
    if (context.tripName) {
      systemPrompt += `- Tên chuyến đi: ${context.tripName}\n`;
    }
    if (context.days && context.days.length > 0) {
      systemPrompt += `- Số ngày: ${context.days.length}\n`;
      context.days.forEach((day) => {
        if (day.places && day.places.length > 0) {
          systemPrompt += `  Ngày ${day.date}: ${day.places
            .map((p) => p.name)
            .join(", ")}\n`;
        }
      });
    }
  }

  // Get model
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Generate response
  const result = await model.generateContent(
    `${systemPrompt}\n\nCâu hỏi: ${message}`
  );
  const response = await result.response;
  const text = response.text();

  return NextResponse.json({ message: text });
}
```

#### Client Component

```typescript
// src/components/PlaceChatAssistant.tsx
const handleSend = async () => {
  // Build context from trip data
  const context = {
    tripName: trip.name,
    days: trip.days.map((day) => ({
      date: day.date,
      places: day.places.map((place) => ({
        name: place.name,
        category: place.category,
      })),
    })),
    location: userLocation || null,
  };

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userMessage.content,
      context,
    }),
  });

  const data = await response.json();
  // Display AI response
};
```

---

## 6. Mapbox GL JS

### Tác dụng

Mapbox GL JS cung cấp:

- **Interactive Maps**: Bản đồ tương tác với WebGL
- **Custom Markers**: Đánh dấu địa điểm trên bản đồ
- **Route Visualization**: Vẽ lộ trình giữa các điểm
- **Directions API**: Tính toán tuyến đường tối ưu
- **Geocoding**: Tìm kiếm địa điểm từ tên

### Tác dụng trong dự án Vivu-Go

**1. Hiển thị Bản đồ Trip:**

- Component `MapContainer` hiển thị bản đồ tương tác
- Tự động hiển thị tất cả địa điểm trong trip
- Markers cho mỗi địa điểm với popup hiển thị tên

**2. Route Visualization:**

- Tự động vẽ lộ trình giữa các địa điểm theo thứ tự
- Hỗ trợ nhiều phương tiện: driving, walking, cycling
- Hiển thị distance và duration
- Cache routes để tránh gọi API nhiều lần

**3. User Location:**

- Sử dụng geolocation API để lấy vị trí hiện tại
- Hiển thị marker cho user location
- Tự động zoom và center vào user location

**4. Nearby Places:**

- Component `NearbyPlaces` tìm địa điểm gần user hoặc selected place
- Sử dụng Mapbox Geocoding API
- Hiển thị kết quả trên bản đồ và list

**5. Interactive Features:**

- Click vào map để chọn location
- Drag markers để di chuyển địa điểm
- Zoom, pan, rotate bản đồ
- 3D mode cho bản đồ

**6. Map Themes:**

- Light mode và dark mode
- Auto mode (theo system preference)
- Lưu preference vào localStorage

**7. Integration với Trip Store:**

- Tự động update markers khi trip data thay đổi
- Sync với `useTripStore` để hiển thị đúng địa điểm
- Route được tính toán dựa trên thứ tự places trong timeline

### Tại sao chọn Mapbox GL JS?

- **Performance**: WebGL rendering, smooth và nhanh
- **Customization**: Dễ customize markers, routes, styles
- **Directions API**: Tính toán routes chính xác, hỗ trợ nhiều phương tiện
- **Geocoding**: Tìm kiếm địa điểm tốt, đặc biệt cho Việt Nam
- **Free tier**: 50,000 map loads/tháng miễn phí, đủ cho dự án nhỏ
- **Documentation**: Tài liệu tốt, examples nhiều

### Ví dụ Code

#### Map Initialization

```typescript
// src/components/MapContainer.tsx
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN!;

export function MapContainer() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [105.8342, 21.0278], // Hanoi coordinates
      zoom: 13,
    });

    mapRef.current.on("load", () => {
      setIsMapLoaded(true);
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
```

#### Adding Markers

```typescript
// Add marker for each place
useEffect(() => {
  if (!mapRef.current || !isMapLoaded) return;

  // Clear existing markers
  markersRef.current.forEach((marker) => marker.remove());
  markersRef.current = [];

  // Add markers for places
  trip.days.forEach((day) => {
    day.places.forEach((place) => {
      if (place.latitude && place.longitude) {
        const marker = new mapboxgl.Marker()
          .setLngLat([place.longitude, place.latitude])
          .setPopup(new mapboxgl.Popup().setText(place.name))
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      }
    });
  });
}, [trip, isMapLoaded]);
```

#### Route Calculation

```typescript
// Fetch route from Mapbox Directions API
const fetchRoute = async (
  coordinates: [number, number][],
  profile: "driving" | "walking" | "cycling"
) => {
  if (coordinates.length < 2) return null;

  // Format coordinates
  const coordinatesString = coordinates
    .map((coord) => `${coord[0]},${coord[1]}`)
    .join(";");

  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}?geometries=geojson&access_token=${MAPBOX_TOKEN}&overview=full&steps=true`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.code === "Ok" && data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const geometry = route.geometry;
    const distance = route.distance; // meters
    const duration = route.duration; // seconds

    // Add route to map
    if (mapRef.current?.getSource("route")) {
      (mapRef.current.getSource("route") as mapboxgl.GeoJSONSource).setData(
        geometry
      );
    } else {
      mapRef.current?.addLayer({
        id: "route",
        type: "line",
        source: {
          type: "geojson",
          data: geometry,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3887be",
          "line-width": 5,
        },
      });
    }

    return { geometry, distance, duration };
  }
};
```

---

## 7. Zustand

### Tác dụng

Zustand cung cấp:

- **Lightweight State Management**: Quản lý state đơn giản, nhẹ
- **No Boilerplate**: Ít code hơn Redux
- **TypeScript Support**: Type-safe out of the box
- **Global State**: Quản lý state toàn cục cho trip data

### Tác dụng trong dự án Vivu-Go

**1. Quản lý Trip State:**

- `useTripStore` quản lý toàn bộ trip data đang được edit
- State bao gồm: `trip`, `selectedDayId`, `selectedPlaceId`
- Tất cả components (Timeline, MapContainer, TripConfig) đều dùng chung store

**2. Trip Actions:**

- `setTrip()`: Load trip từ database vào store
- `addPlace()`: Thêm địa điểm vào ngày
- `updatePlace()`: Cập nhật thông tin địa điểm
- `removePlace()`: Xóa địa điểm
- `reorderPlaces()`: Sắp xếp lại thứ tự địa điểm (drag & drop)

**3. Computed Values:**

- `getTotalCost()`: Tính tổng chi phí của trip
- `getCostPerPerson()`: Tính chi phí trên mỗi người
- `getDayCost()`: Tính chi phí của một ngày
- Tự động update khi trip data thay đổi

**4. UI State:**

- `selectedDayId`: Ngày đang được chọn trong timeline
- `selectedPlaceId`: Địa điểm đang được chọn
- `showNearbyPlacesForPlaceId`: Hiển thị nearby places cho địa điểm nào

**5. Sync giữa Components:**

- Timeline component: Hiển thị và edit trip data
- MapContainer: Hiển thị markers và routes từ trip data
- TripConfig: Cấu hình trip (name, dates, budget, people)
- Tất cả sync real-time qua Zustand store

**6. Persist State (có thể thêm):**

- Có thể thêm persist middleware để lưu trip vào localStorage
- User không mất data khi refresh trang (chưa implement)

### Tại sao chọn Zustand?

- **Đơn giản**: Ít boilerplate, dễ học và sử dụng
- **Nhẹ**: Chỉ ~1KB, không ảnh hưởng bundle size
- **Type-safe**: TypeScript support tốt, type-safe out of the box
- **Performance**: Chỉ re-render components subscribe đến state thay đổi
- **Phù hợp**: Đủ mạnh cho client state management, không cần Redux phức tạp
- **No Provider**: Không cần wrap app với Provider, dễ setup

### Ví dụ Code

#### Store Definition

```typescript
// src/store/useTripStore.ts
import { create } from "zustand";

type TripStore = {
  trip: Trip;
  selectedDayId: string;
  selectedPlaceId?: string;

  // Actions
  setTrip: (trip: Trip) => void;
  resetTrip: () => void;
  addPlace: (dayId: string, place: Omit<Place, "id">) => void;
  updatePlace: (
    dayId: string,
    placeId: string,
    updates: Partial<Place>
  ) => void;
  removePlace: (dayId: string, placeId: string) => void;
  reorderPlaces: (dayId: string, fromIndex: number, toIndex: number) => void;

  // Computed values
  getTotalCost: () => number;
  getCostPerPerson: () => number;
};

export const useTripStore = create<TripStore>()((set, get) => ({
  trip: emptyTrip,
  selectedDayId: "",
  selectedPlaceId: undefined,

  setTrip: (trip) =>
    set({
      trip,
      selectedDayId: trip.days[0]?.id ?? "",
    }),

  addPlace: (dayId, place) =>
    set((state) => ({
      trip: {
        ...state.trip,
        days: state.trip.days.map((day) =>
          day.id === dayId
            ? {
                ...day,
                places: [
                  ...day.places,
                  {
                    ...place,
                    id: `${dayId}-p-${Date.now()}`,
                  },
                ],
              }
            : day
        ),
      },
    })),

  updatePlace: (dayId, placeId, updates) =>
    set((state) => ({
      trip: {
        ...state.trip,
        days: state.trip.days.map((day) =>
          day.id === dayId
            ? {
                ...day,
                places: day.places.map((place) =>
                  place.id === placeId ? { ...place, ...updates } : place
                ),
              }
            : day
        ),
      },
    })),

  getTotalCost: () =>
    get().trip.days.reduce(
      (tripSum, day) =>
        tripSum +
        day.places.reduce((sum, place) => sum + (place.estimatedCost || 0), 0),
      0
    ),

  getCostPerPerson: () => {
    const total = get().getTotalCost();
    const people = get().trip.peopleCount || 1;
    return Math.round(total / people);
  },
}));
```

#### Using the Store

```typescript
// In components
import { useTripStore } from "@/store/useTripStore";

function TripComponent() {
  const trip = useTripStore((state) => state.trip);
  const addPlace = useTripStore((state) => state.addPlace);
  const totalCost = useTripStore((state) => state.getTotalCost());

  const handleAddPlace = () => {
    addPlace(selectedDayId, {
      name: "New Place",
      timeSlot: "morning",
      category: "sightseeing",
      estimatedCost: 100000,
    });
  };

  return (
    <div>
      <p>Total Cost: {totalCost()}</p>
      <button onClick={handleAddPlace}>Add Place</button>
    </div>
  );
}
```

---

## 8. React Query (TanStack Query)

### Tác dụng

React Query cung cấp:

- **Server State Management**: Quản lý state từ server
- **Caching**: Tự động cache data
- **Background Refetching**: Tự động refetch khi cần
- **Optimistic Updates**: Cập nhật UI trước khi server response
- **Error Handling**: Xử lý lỗi tự động

### Tác dụng trong dự án Vivu-Go

**1. Quản lý Itineraries từ Supabase:**

- `useItineraries()`: Fetch danh sách lịch trình
- Tự động cache, không fetch lại mỗi lần component mount
- Tự động refetch khi cần (stale time: 1 phút)
- Loading và error states tự động

**2. CRUD Operations:**

- `useCreateItinerary()`: Tạo lịch trình mới
- `useUpdateItinerary()`: Cập nhật lịch trình (với optimistic locking)
- `useDeleteItinerary()`: Xóa lịch trình
- Sau mỗi mutation, tự động invalidate cache và refetch

**3. Sharing & Collaboration:**

- `usePendingInvitations()`: Fetch invitations đang chờ
- `useAcceptInvitation()`, `useRejectInvitation()`: Xử lý invitations
- `useShareItinerary()`: Tạo share link
- Tự động sync giữa các components

**4. Real-time Sync:**

- Kết hợp với Supabase Realtime
- Khi có thay đổi từ database, tự động invalidate queries
- UI tự động cập nhật, không cần refresh

**5. Packing Items:**

- `usePackingItems()`: Fetch danh sách đồ cần mang
- `useAddPackingItem()`, `useUpdatePackingItem()`, `useDeletePackingItem()`
- Tự động sync với database

**6. Performance Optimization:**

- Cache data để giảm số lần gọi Supabase API
- Chỉ refetch khi data stale (1 phút)
- Không refetch khi window focus (để tránh spam API)
- Giảm tải cho database và tiết kiệm quota

**7. Error Handling:**

- Tự động retry khi request fail
- Error states tự động
- Toast notifications khi có lỗi

**8. Dashboard Integration:**

- Dashboard component sử dụng `useItineraries()` để hiển thị list
- Khi delete itinerary, UI tự động cập nhật
- Không cần manual refetch hoặc state management

### Tại sao chọn React Query?

- **Server State**: Phù hợp cho quản lý data từ Supabase (server state)
- **Caching**: Tự động cache, giảm API calls, tăng performance
- **Auto Sync**: Tự động sync giữa components, không cần manual state management
- **Developer Experience**: Ít boilerplate, dễ sử dụng, có DevTools
- **Error Handling**: Tự động retry, error states, giảm bugs
- **Industry Standard**: Được nhiều dự án lớn sử dụng, community lớn

### Ví dụ Code

#### Query Hook

```typescript
// src/hooks/useItineraries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useItineraries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["itineraries", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Itinerary[];
    },
    enabled: !!user, // Only run when user exists
  });
}
```

#### Mutation Hook

```typescript
export function useCreateItinerary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateItineraryInput) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("itineraries")
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Itinerary;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
    },
  });
}
```

#### Using in Component

```typescript
function Dashboard() {
  const { data: itineraries, isLoading, error } = useItineraries();
  const createItinerary = useCreateItinerary();

  const handleCreate = async () => {
    await createItinerary.mutateAsync({
      title: "New Trip",
      trip_data: tripData,
    });
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {itineraries?.map((itinerary) => (
        <ItineraryCard key={itinerary.id} itinerary={itinerary} />
      ))}
    </div>
  );
}
```

---

## 9. Các Thư viện Hỗ trợ khác

### 9.1. Framer Motion

**Tác dụng**: Animation library cho React

**Tác dụng trong dự án:**

- Landing page animations: Hero section, features section có animations mượt mà
- Dashboard: Card animations khi hover, transitions khi load
- Modal/Dialog: Smooth open/close animations
- Page transitions: AnimatePresence cho page transitions

**Tại sao chọn:**

- Dễ sử dụng, API đơn giản
- Performance tốt với GPU acceleration
- Hỗ trợ complex animations
- Phù hợp cho modern UI/UX

```typescript
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Animated content
</motion.div>;
```

### 9.2. Radix UI

**Tác dụng**: Unstyled, accessible UI primitives

**Tác dụng trong dự án:**

- Dialog: Modal dialogs (save trip, delete confirmation)
- Dropdown Menu: Actions menu cho mỗi itinerary card
- Toast: Notifications khi thành công/lỗi
- Select: Dropdown selects trong forms
- Tabs: Tab navigation trong itinerary detail
- Tất cả components đều accessible (keyboard navigation, screen reader support)

**Tại sao chọn:**

- Accessible: Tuân thủ WAI-ARIA standards
- Unstyled: Dễ customize với Tailwind
- Headless: Chỉ logic, không có styles
- Production-ready: Được test kỹ, stable

```typescript
import * as Dialog from "@radix-ui/react-dialog";

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Title</Dialog.Title>
    Content
  </Dialog.Content>
</Dialog.Root>;
```

### 9.3. shadcn/ui

**Tác dụng**: Pre-built components dựa trên Radix UI và Tailwind

**Tác dụng trong dự án:**

- Tất cả UI components trong `src/components/ui/` đều từ shadcn/ui
- Button, Card, Dialog, Input, Select, Toast, v.v.
- Styled với Tailwind, dễ customize
- Consistent design system

**Tại sao chọn:**

- Copy-paste components: Không phải dependency, copy vào project
- Customizable: Dễ modify theo design của dự án
- Type-safe: TypeScript support tốt
- Popular: Nhiều dự án sử dụng, community lớn

```typescript
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

<Button variant="default" size="lg">
  Click me
</Button>;
```

### 9.4. @dnd-kit

**Tác dụng**: Drag and drop functionality

**Tác dụng trong dự án:**

- Timeline component: Drag & drop để sắp xếp lại thứ tự địa điểm
- Reorder places trong cùng một ngày
- Move places giữa các time slots (morning, noon, afternoon, evening)
- UX tốt hơn so với buttons để move up/down

**Tại sao chọn:**

- Modern: Thay thế cho react-dnd (cũ hơn)
- Lightweight: Nhẹ, performance tốt
- Accessible: Hỗ trợ keyboard navigation
- Flexible: Dễ customize behavior

```typescript
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";

<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={items}>
    {items.map((item) => (
      <SortableItem key={item.id} item={item} />
    ))}
  </SortableContext>
</DndContext>;
```

### 9.5. date-fns

**Tác dụng**: Date formatting và manipulation

**Tác dụng trong dự án:**

- Format dates: Hiển thị dates trong dashboard, timeline
- Locale support: Sử dụng `vi` locale cho tiếng Việt
- Date calculations: Tính số ngày giữa start date và end date
- Date validation: Validate date ranges

**Tại sao chọn:**

- Lightweight: Chỉ import functions cần dùng
- Tree-shakeable: Bundle size nhỏ
- Immutable: Không mutate dates
- Locale support: Hỗ trợ nhiều ngôn ngữ

```typescript
import { format, addDays, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

const formatted = format(new Date(), "dd/MM/yyyy", { locale: vi });
const nextWeek = addDays(new Date(), 7);
const daysDiff = differenceInDays(endDate, startDate);
```

### 9.6. jsPDF

**Tác dụng**: Export PDF từ trip data

**Tác dụng trong dự án:**

- Export itinerary: User có thể export lịch trình ra PDF
- Include trip details: Tên trip, dates, budget, people count
- Include places: Danh sách địa điểm theo từng ngày
- Table format: Sử dụng `jspdf-autotable` để format đẹp

**Tại sao chọn:**

- Client-side: Không cần server để generate PDF
- Flexible: Dễ customize layout
- Lightweight: Bundle size nhỏ
- Popular: Nhiều dự án sử dụng

```typescript
import jsPDF from "jspdf";
import "jspdf-autotable";

const doc = new jsPDF();
doc.text("Trip Itinerary", 10, 10);
doc.autoTable({
  head: [["Day", "Place", "Time"]],
  body: tripData,
});
doc.save("trip-itinerary.pdf");
```

---

## Tổng kết

Dự án Vivu-Go sử dụng một stack công nghệ hiện đại và mạnh mẽ:

- **Frontend Framework**: Next.js 16 với App Router
- **Language**: TypeScript cho type safety
- **Styling**: Tailwind CSS v4 với custom design system
- **Database & Auth**: Supabase (PostgreSQL) với RLS
- **AI**: Google Gemini AI cho chat assistant
- **Maps**: Mapbox GL JS cho bản đồ và routing
- **State Management**: Zustand cho client state, React Query cho server state
- **UI Components**: Radix UI + shadcn/ui
- **Utilities**: Framer Motion, date-fns, jsPDF, @dnd-kit

Tất cả các công nghệ này làm việc cùng nhau để tạo ra một ứng dụng lập kế hoạch chuyến đi hoàn chỉnh, hiện đại và user-friendly.
