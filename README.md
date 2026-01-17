# 🗺️ Vivu-Go

**Vivu-Go** là công cụ lập kế hoạch chuyến đi thông minh, giúp bạn tự thiết lập lịch trình, tối ưu đường đi và quản lý chi phí linh hoạt cho mọi nhóm bạn.

![Vivu-Go](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Tính năng

### 🎯 Lập kế hoạch linh hoạt

- Không giới hạn số ngày hay số người
- Tự do thêm, bớt và kéo thả địa điểm
- Quản lý lịch trình theo từng ngày với các khung giờ (Sáng, Trưa, Chiều, Tối)

### 🗺️ Bản đồ thông minh

- Tích hợp Mapbox GL để hiển thị bản đồ tương tác
- Tự động vẽ lộ trình ngắn nhất giữa các điểm tham quan
- Hỗ trợ nhiều phương tiện: đi bộ, xe đạp, ô tô
- Tìm kiếm và thêm địa điểm từ các nguồn dữ liệu mở

### 🤖 Trợ lý AI thông minh

- Tích hợp Google Gemini AI để tư vấn về địa điểm du lịch
- Chat trực tiếp với AI để nhận gợi ý về nhà hàng, điểm tham quan
- AI hiểu context về chuyến đi hiện tại của bạn
- Tư vấn lịch trình và địa điểm phù hợp

### 💰 Quản lý ngân sách

- Tự động tính toán chi phí tổng và chi phí trên mỗi thành viên
- Theo dõi chi phí theo từng ngày và từng địa điểm
- Cấu hình số người tham gia và ngân sách dự kiến

### 🎨 Giao diện hiện đại

- Landing page với animations mượt mà
- Design system nhất quán với Tailwind CSS v4
- Responsive design cho mọi thiết bị
- Dark mode support (sẵn sàng)

## 🚀 Bắt đầu

### Yêu cầu

- Node.js 18+
- npm, yarn, pnpm hoặc bun

### Cài đặt

1. **Clone repository**

```bash
git clone <repository-url>
cd Vivu-Go
```

2. **Cài đặt dependencies**

```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

3. **Cấu hình biến môi trường**

Tạo file `.env.local` trong thư mục gốc:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_MAPBOX_STYLE=mapbox://styles/mapbox/streets-v12
GEMINI_API_KEY=your_gemini_api_key_here
```

**Để lấy Mapbox token:**

1. Đăng ký tài khoản tại [Mapbox](https://www.mapbox.com/)
2. Tạo access token từ [Mapbox Account](https://account.mapbox.com/access-tokens/)
3. Copy token vào file `.env.local`

**Để lấy Gemini API key:**

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng tài khoản Google
3. Tạo API key mới
4. Copy API key vào file `.env.local` với tên `GEMINI_API_KEY`

> **Lưu ý:** Tính năng chat AI sẽ không hoạt động nếu không có `GEMINI_API_KEY`. Ứng dụng vẫn hoạt động bình thường nhưng chat AI sẽ hiển thị lỗi.

> **Lưu ý:** Tính năng thời tiết sử dụng [Open-Meteo API](https://open-meteo.com/) - miễn phí và không cần API key. Widget thời tiết sẽ tự động hoạt động mà không cần cấu hình thêm.

4. **Chạy development server**

```bash
npm run dev
# hoặc
yarn dev
# hoặc
pnpm dev
# hoặc
bun dev
```

5. **Mở trình duyệt**

Truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📁 Cấu trúc dự án

```
Vivu-Go/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   ├── trip/
│   │   │   └── page.tsx       # Trip planning page
│   │   └── globals.css        # Global styles & CSS variables
│   ├── components/
│   │   ├── landing/           # Landing page components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── DemoSection.tsx
│   │   │   ├── PainPointsSection.tsx
│   │   │   └── FooterSection.tsx
│   │   ├── ui/                # Reusable UI components (shadcn/ui)
│   │   ├── Timeline.tsx       # Trip timeline component
│   │   ├── PlaceCard.tsx      # Place card component
│   │   ├── MapContainer.tsx   # Mapbox integration
│   │   └── TripConfig.tsx    # Trip configuration
│   ├── store/
│   │   └── useTripStore.ts    # Zustand state management
│   ├── hooks/
│   │   ├── use-is-mounted.ts  # Client-side mount hook
│   │   └── ...
│   └── lib/
│       └── utils.ts           # Utility functions
├── public/                     # Static assets
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.mjs         # PostCSS configuration
└── package.json
```

## 🛠️ Công nghệ sử dụng

### Core

- **[Next.js 15](https://nextjs.org/)** - React framework với App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[React](https://react.dev/)** - UI library

### Styling & UI

- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled UI primitives
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable components

### State Management

- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management

### Maps & Routing

- **[Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)** - Interactive maps
- **[Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)** - Route optimization

### AI & Chat

- **[Google Gemini AI](https://ai.google.dev/)** - AI chat assistant for travel recommendations

### Utilities

- **[date-fns](https://date-fns.org/)** - Date formatting
- **[@dnd-kit](https://dndkit.com/)** - Drag and drop functionality
- **[lucide-react](https://lucide.dev/)** - Icon library

## 📝 Scripts

```bash
# Development
npm run dev          # Chạy development server

# Production
npm run build        # Build ứng dụng cho production
npm run start        # Chạy production server

# Code Quality
npm run lint         # Chạy ESLint
```

## 🎨 Design System

Dự án sử dụng design system với CSS variables được định nghĩa trong `src/app/globals.css`:

- **Primary**: Mint Green (`--primary`)
- **Secondary**: Soft Blue (`--secondary`)
- **Accent**: Coral/Orange (`--accent`)
- **Muted**: Soft Gray (`--muted`)

Tất cả màu sắc hỗ trợ dark mode và được sử dụng nhất quán trong toàn bộ ứng dụng.

## 🚢 Deploy

### Vercel (Khuyến nghị)

Cách dễ nhất để deploy ứng dụng Next.js:

1. Push code lên GitHub
2. Import project vào [Vercel](https://vercel.com/new)
3. Thêm environment variables:
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_MAPBOX_STYLE`
   - `GEMINI_API_KEY` (tùy chọn, cho tính năng chat AI)
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/vivu-go)

### Các platform khác

Ứng dụng có thể được deploy trên bất kỳ platform nào hỗ trợ Next.js:

- [Netlify](https://www.netlify.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 👥 Tác giả

Được phát triển với ❤️ bởi team Vivu-Go

## 🙏 Lời cảm ơn

- [Next.js](https://nextjs.org/) team
- [Tailwind CSS](https://tailwindcss.com/) team
- [Mapbox](https://www.mapbox.com/) cho mapping services
- [shadcn](https://twitter.com/shadcn) cho UI components

---

**Made with ❤️ in Vietnam**
