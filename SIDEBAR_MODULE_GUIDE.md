# Hướng dẫn Sidebar Module - Hệ thống Quản lý Giáo dục

## 📋 Tổng quan

Đã hoàn thành việc tạo **Sidebar Module siêu đẹp** và **Hướng dẫn sử dụng chi tiết** cho 3 role chính: **Học viên**, **Giáo viên**, và **Quản trị viên**.

---

## 📦 Các file đã tạo

### 1. **Sidebar Module** (`src/components/shared/SidebarModule.tsx`)
Component sidebar được tái sử dụng cho tất cả 3 role:

#### Tính năng chính:
- ✨ **Thiết kế hiện đại, đẹp mắt**
  - Gradient sidebar background
  - Smooth transitions và hover effects
  - User info card với emoji role
  - Active state indicator với thanh bên trái
  
- 📱 **Responsive Design**
  - Desktop: Sidebar cố định bên trái (64px)
  - Mobile: Drawer menu với hamburger button
  - Automatic offset cho mobile content
  
- 🎨 **Tùy chỉnh hoàn toàn**
  - Props: `sections`, `logo`, `header`, `footer`
  - Support collapsible sections
  - Badge support (thông báo, chưa đọc)
  - Dark mode toggle tích hợp
  
- 🔐 **Bảo mật**
  - Xác thực user hiển thị
  - Role-based rendering
  - Logout button tích hợp

#### Props Interface:
```typescript
interface SidebarModuleProps {
  sections: SidebarSection[];      // Navigation sections
  logo?: React.ReactNode;           // Logo component
  header?: React.ReactNode;         // Header content
  footer?: React.ReactNode;         // Footer content
  onNavigate?: () => void;          // Callback khi navigate
  showDarkMode?: boolean;           // Show dark mode toggle
  showLogout?: boolean;             // Show logout button
  onLogout?: () => void;            // Logout handler
  userRole?: string;                // Role display (learn/teacher/admin)
  userName?: string;                // User's full name
}
```

---

### 2. **Hướng dẫn Sử dụng Chi tiết** (`src/pages/public/UserGuides.tsx`)

Trang hướng dẫn toàn diện với 3 tab role (Learn / Teacher / Admin):

#### ✅ Hướng dẫn cho **Học viên** (📚):
- **Bắt đầu**: Điều hướng chính, hồ sơ cá nhân
- **Học tập**: Bài học, bài tập, bài kiểm tra
- **Lớp học**: Danh sách lớp, Zoom Class
- **Tiến độ**: Dashboard, Thành tích, Lịch học
- **Cài đặt**: Tùy chỉnh giao diện, Thông báo
- **Mẹo và thủ thuật**: Hiệu quả học tập, Tân trang kiến thức

#### ✅ Hướng dẫn cho **Giáo viên** (👨‍🏫):
- **Bắt đầu**: Điều hướng chính, Vai trò giáo viên
- **Quản lý bài học**: Tạo bài, Chỉnh sửa, Xuất bản, Gán cho lớp
- **Quản lý bài kiểm tra**: Tạo bài, Quản lý kết quả
- **Quản lý lớp học**: Xem lớp, Chi tiết lớp
- **Chấm bài và phản hồi**: Cách chấm, Viết phản hồi tốt
- **Điểm danh**: Ghi nhận, Xem báo cáo
- **Lịch Zoom**: Tạo buổi, Quản lý
- **Thông báo**: Gửi và quản lý
- **Báo cáo và phân tích**: Dashboard, Theo dõi cá nhân

#### ✅ Hướng dẫn cho **Quản trị viên** (👑):
- **Giới thiệu**: Quyền hạn, Vai trò quản trị
- **Quản lý nội dung trang web**: Website CMS, Trang công khai
- **Blog và nội dung**: Quản lý bài viết, Danh mục, SEO
- **Quản lý giáo viên**: Danh sách, Chi tiết, Phê duyệt bài học
- **Quản lý khóa học**: Tạo, Giáo viên, Nội dung
- **Quản lý lớp học**: Xem, Chi tiết
- **Quản lý tài chính**: Bảng điều khiển, Đơn hàng, Xác nhận thanh toán
- **Quản lý sự kiện**: Tạo sự kiện, Quản lý đăng ký
- **Quản lý người dùng**: Danh sách, Chỉnh sửa, Vai trò
- **Cài đặt hệ thống**: Chung, Hiển thị trang, Loại bài tập
- **Báo cáo và phân tích**: Dashboard, Báo cáo chi tiết

---

## 🚀 Cách sử dụng Sidebar Module

### Ví dụ 1: Learner Sidebar
```typescript
import SidebarModule, { SidebarSection } from '@/components/shared/SidebarModule';

const LearnSidebar = () => {
  const sections: SidebarSection[] = [
    {
      label: 'Học tập',
      items: [
        { 
          name: 'Dashboard', 
          href: '/learn', 
          icon: LayoutDashboard,
          description: 'Xem tổng quan học tập'
        },
        // ... more items
      ],
      collapsible: false,
    },
    // ... more sections
  ];

  return (
    <SidebarModule
      sections={sections}
      logo={<YourLogo />}
      header={<LanguageCard />}
      onNavigate={onNavigate}
      showDarkMode={true}
      showLogout={true}
      userRole="user"
      userName={userName}
    />
  );
};
```

### Ví dụ 2: Teacher Sidebar
```typescript
const sections: SidebarSection[] = [
  {
    label: 'Tổng quan',
    items: [
      { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    ],
    collapsible: true,
    defaultOpen: true,
  },
  {
    label: 'Giảng dạy',
    items: [
      { name: 'Bài học', href: '/teacher/lessons', icon: BookOpen },
      // ... more items
    ],
    collapsible: true,
    defaultOpen: true,
  },
];

return (
  <SidebarModule
    sections={sections}
    logo={logoContent}
    footer={footerContent}
    showDarkMode={true}
    showLogout={true}
    onLogout={signOut}
    userRole="teacher"
    userName={user?.full_name}
  />
);
```

---

## 📱 Layout Integration

Sidebar Module đã được tích hợp vào:

### 1. **Learner Layout** (`src/components/learning/Sidebar.tsx`)
- ✅ 4 section (Học tập, Lịch trình, Tiến độ, Cá nhân)
- ✅ Hiển thị ngôn ngữ đang học
- ✅ Lọc item theo cài đặt CMS
- ✅ Responsive mobile/desktop

### 2. **Teacher Layout** (`src/pages/teacher/TeacherLayout.tsx`)
- ✅ 4 section collapsible (Tổng quan, Giảng dạy, Lịch trình, Khác)
- ✅ Hiển thị vai trò (Teacher/Senior/Admin)
- ✅ Footer link tới Admin Panel & Learn
- ✅ Responsive design

### 3. **Admin Layout** (`src/pages/admin/AdminLayout.tsx`)
- ✅ 6 section collapsible (3 cho moderator, 6 cho admin)
- ✅ Role-based visibility
- ✅ Footer link tới Teacher & Learn
- ✅ Fully responsive

---

## 🎯 Routes

### Hướng dẫn sử dụng
- **Trang cũ**: `/huong-dan` (Quick start guide)
- **Trang chi tiết**: `/huong-dan-chi-tiet` ✨ **MỚI**
  - Role tabs: Learn | Teacher | Admin
  - Collapsible sections cho mỗi hướng dẫn
  - Chi tiết từng bước

---

## 🎨 Styling & Customization

### CSS Classes
```css
/* Sidebar container */
.sidebar { 
  width: 16rem; /* 64px */
  height: 100vh;
}

/* Section label */
.sidebar-label {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* Active nav item */
.sidebar-nav-active {
  background: hsl(var(--sidebar-primary));
  color: hsl(var(--sidebar-primary-foreground));
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Hover state */
.sidebar-nav-hover {
  background: hsl(var(--sidebar-primary) / 0.05);
  color: hsl(var(--sidebar-foreground));
}
```

### Tailwind Config
Sidebar sử dụng custom color variables:
```typescript
sidebar: {
  DEFAULT: "hsl(var(--sidebar-background))",
  foreground: "hsl(var(--sidebar-foreground))",
  primary: "hsl(var(--sidebar-primary))",
  "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
  accent: "hsl(var(--sidebar-accent))",
  border: "hsl(var(--sidebar-border))",
}
```

---

## ✨ Tính năng nổi bật

### 1. **Beautiful UI/UX**
- Gradient background
- Smooth animations
- Clear visual hierarchy
- Intuitive navigation

### 2. **Mobile-First Design**
- Hamburger menu trên mobile
- Full-screen drawer
- Touch-friendly spacing
- Automatic content offset

### 3. **Accessibility**
- ARIA labels
- Keyboard navigation
- Color contrast compliant
- Screen reader support

### 4. **Performance**
- Lazy-loaded icons
- Efficient state management
- Minimal re-renders
- Smooth transitions

### 5. **Developer Experience**
- Clear prop interface
- Reusable for all roles
- Easy customization
- Well-documented

---

## 📊 Component Hierarchy

```
App
├── LearningLayout / TeacherLayout / AdminLayout
│   ├── SidebarModule
│   │   ├── Logo
│   │   ├── Header (optional)
│   │   ├── UserInfo Card
│   │   ├── Nav Sections
│   │   │   ├── Collapsible Sections
│   │   │   └── Nav Items with Icons
│   │   └── Footer
│   │       ├── Dark Mode Toggle
│   │       ├── Footer Links
│   │       └── Logout Button
│   └── MainContent
│       └── Outlet
```

---

## 🔧 Maintenance & Updates

### Thêm mục mới vào Sidebar:
```typescript
const sections = [
  {
    label: 'New Section',
    items: [
      { 
        name: 'New Item', 
        href: '/new-route',
        icon: NewIcon,
        description: 'Mô tả item'
      },
    ],
  },
];
```

### Thay đổi màu sắc:
Sửa CSS variables trong `globals.css` hoặc `tailwind.config.ts`

### Thêm badge/thông báo:
```typescript
items: [
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: 5  // Number badge
  },
]
```

---

## 📚 Tài liệu hướng dẫn đầy đủ

### Xem hướng dẫn chi tiết:
Truy cập `/huong-dan-chi-tiet` để xem hướng dẫn hoàn chỉnh cho:
- **Học viên**: Cách sử dụng toàn bộ tính năng học tập
- **Giáo viên**: Quản lý bài học, lớp, điểm danh
- **Quản trị viên**: Quản lý hệ thống, tài chính, người dùng

Mỗi hướng dẫn được chia thành các phần nhỏ, dễ hiểu, với các bước chi tiết để học viên/giáo viên/admin dễ dàng sử dụng.

---

## 🎓 Next Steps

1. ✅ Sidebar Module đã được tạo và tích hợp
2. ✅ Hướng dẫn sử dụng chi tiết cho 3 role
3. ⏭️ **Có thể**: Thêm video hướng dẫn
4. ⏭️ **Có thể**: Thêm interactive tutorial
5. ⏭️ **Có thể**: Thêm in-app tips/onboarding

---

## 🎉 Kết luận

Bạn hiện có:
- ✨ **Sidebar module siêu đẹp** có thể tái sử dụng cho tất cả role
- 📖 **Hướng dẫn sử dụng chi tiết** với 3 tab role riêng biệt
- 🎨 **UI/UX modern** với animations và responsive design
- 📱 **Mobile-first** với hamburger menu trên thiết bị nhỏ
- 👥 **Role-based** customization cho Học viên, Giáo viên, Quản trị viên

Tất cả đã được tích hợp vào hệ thống và sẵn sàng sử dụng!
