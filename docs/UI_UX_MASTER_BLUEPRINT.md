# BẢN THIẾT KẾ & KẾ HOẠCH TÁI TẠO GIAO DIỆN CHUẨN (UI/UX MASTER BLUEPRINT)

Tài liệu này đóng gói toàn bộ triết lý thiết kế, hệ thống Design Tokens, kiến trúc Layout, bộ Component lõi và Prompt mẫu của hệ thống để chuyển giao cho bất kỳ đội ngũ lập trình hoặc AI Agent nào (Claude, Cursor, Codex, DeepMind...) tái hiện giao diện chuẩn xác 100%.

---

## 1. Triết lý Thiết kế (Design Philosophy: Apple Glass & Minimalist)

Giao diện được xây dựng trên phong cách **Apple Human Interface Guidelines** kết hợp **Glassmorphism hiện đại** và bảng màu thương hiệu ấm áp:

- **Nền & Bề mặt (Surfaces):** 
  - Nền canvas xám sáng dịu mắt (`#f8fafc`).
  - Các thẻ nội dung (Card) màu trắng tuyết tuyệt đối (`#ffffff`).
  - Thanh Header và Modal sử dụng hiệu ứng kính mờ đặc trưng Apple (`backdrop-filter: blur(24px) saturate(180%)`).
- **Viền & Đổ bóng (Borders & Shadows):** 
  - Tuyệt đối không dùng viền đen đậm.
  - Toàn bộ viền là các đường nét siêu mảnh tinh tế `rgba(15, 23, 42, 0.08)`.
  - Đổ bóng đa tầng mềm mại (Soft ambient shadows).
- **Phân cấp bo góc (Corner Radii):**
  - Nút bấm, tag nhỏ, ô nhập liệu: `8px` (`--radius-sm`)
  - Thẻ card, dropdown menu: `12px` (`--radius-md`)
  - Container chính, Drawer: `18px` (`--radius-lg`)
  - Modal hộp thoại: `24px` (`--radius-xl`)
  - Nút viên thuốc (Pill), Badge: `9999px` (`--radius-full`)
- **Typography:**
  - Font giao diện: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif`.
  - Font mã chứng từ / SKU / số tiền: Font monospace chuẩn `ui-monospace, "SF Mono", Menlo, Consolas, monospace` để các chữ số và ký tự mã gióng hàng thẳng tắp.
- **Micro-motion:** Chuyển động nhẹ nhàng (`transition: 0.15s - 0.25s cubic-bezier(0.4, 0, 0.2, 1)`), phản hồi tức thì khi hover/active.

---

## 2. Bản đồ Kiến trúc Layout (Layout Architecture)

### 2.1. Sidebar Trái
- **Chiều rộng:** `290px` khi mở rộng, `80px` khi thu gọn.
- **Khối trên:** Logo nhận diện thương hiệu.
- **Khối giữa:** Danh mục phân hệ nhóm theo Accordion/Menu Ant Design tinh chỉnh phẳng.
- **Khối dưới cùng:** Thẻ hồ sơ tài khoản người dùng (`SidebarProfile`) với avatar bo tròn, tên và vai trò quản trị.

### 2.2. Topbar Kính mờ (Header)
- Cố định trên đỉnh (`position: sticky; top: 0; z-index: 100`).
- Nút Hamburger kính mờ hình vuông bo tròn.
- Nút chọn ngữ cảnh/cửa hàng (`ShopSwitcher`) dạng viên kính mờ (`glass-pill`): viền mờ, chữ đậm, mũi tên xoay khi mở dropdown.
- Chuông thông báo và nút Trợ giúp.

### 2.3. PageContainer
- Bọc toàn bộ nội dung trong một khối Card lớn có padding `24px`, nền trắng bo góc `18px` (`--radius-lg`).

---

## 3. Hệ thống Design Tokens Chuẩn (`frontend/src/styles/tokens.css`)

```css
:root {
  /* Brand Primary Palette (Màu cam thương hiệu & Gradient ấm) */
  --brand-primary: #ea580c;
  --brand-primary-hover: #c2410c;
  --brand-primary-light: #ffedd5;
  --brand-coral: #e11d48;
  --brand-amber: #f59e0b;
  --brand-amber-light: #fef3c7;
  --brand-amber-text: #b45309;

  /* Nút CTA chính: Ánh sáng Apple từ trên xuống */
  --brand-cta: linear-gradient(180deg, #fb8a2e 0%, #f26b12 100%);
  --brand-cta-hover: linear-gradient(180deg, #fd963f 0%, #f5751c 100%);
  --brand-cta-active: linear-gradient(180deg, #ea6a14 0%, #dc5a0a 100%);
  --brand-cta-shadow: 0 1px 0 rgba(255, 255, 255, 0.35) inset, 0 6px 16px -4px rgba(242, 107, 18, 0.45);

  /* Trạng thái hệ thống (Status Indicators) */
  --status-up: #10b981;
  --status-up-bg: #d1fae5;
  --status-up-text: #047857;
  --status-down: #ef4444;
  --status-down-bg: #fee2e2;

  /* Bảng màu trung tính Apple (Apple Neutral Canvas) */
  --apple-bg-canvas: #f8fafc;
  --apple-surface: rgba(255, 255, 255, 0.92);
  --apple-surface-card: #ffffff;
  --apple-surface-hover: #f1f5f9;
  --apple-border: rgba(15, 23, 42, 0.08);
  --apple-border-strong: rgba(15, 23, 42, 0.14);
  --apple-border-focus: #ea580c;
  --apple-input-border: rgba(15, 23, 42, 0.22);
  --apple-placeholder: #7c8798;

  /* Màu chữ phân cấp (Typography Hierarchy) */
  --apple-text-primary: #0f172a;
  --apple-text-secondary: #475569;
  --apple-text-tertiary: #94a3b8;
  --apple-text-on-accent: #ffffff;

  /* Hiệu ứng Kính & Bóng mờ */
  --apple-glass-bg: rgba(255, 255, 255, 0.78);
  --apple-glass-blur: blur(24px) saturate(180%);
  --apple-mask-bg: rgba(15, 23, 42, 0.42);
  --apple-mask-blur: blur(10px) saturate(120%);
  --apple-shadow-modal: 0 32px 80px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.04);
  --apple-shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.06);
  --apple-shadow-md: 0 10px 30px -4px rgba(15, 23, 42, 0.08);

  /* Phân cấp bo góc */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Kiểu chữ */
  --font-family-apple: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  --font-family-code: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;

  /* Cụm nút hành động bảng (Action Buttons) */
  --action-view: #2563eb;
  --action-view-bg: #eff6ff;
  --action-edit: #ea580c;
  --action-edit-bg: #fff7ed;
  --action-on: #059669;
  --action-on-bg: #ecfdf5;
  --action-danger: #dc2626;
  --action-danger-bg: #fef2f2;
}
```

---

## 4. Bộ Component UI Cốt lõi (`frontend/src/components/ui/`)

### 4.1. Nút bấm chính & phụ (`AppButtons.tsx`)
- **PrimaryButton:** Nền `var(--brand-cta)`, chữ trắng font-weight 600, đổ bóng chìm `var(--brand-cta-shadow)`, không viền, bo góc `var(--radius-sm)` (8px).
- **SecondaryButton:** Nền `rgba(118, 118, 128, 0.12)` (xám Apple trong mờ), không viền, bo góc `var(--radius-sm)` (8px). Hover: `rgba(118, 118, 128, 0.2)`.
- **CreateButton:** Biến thể chuyên biệt cho "Thêm mới" / "Tạo mới".
- **FilterButton:** Nút "Bộ lọc" tích hợp Badge đếm số bộ lọc kích hoạt.

### 4.2. Thanh tìm kiếm & lọc (`FilterBar.tsx`)
- Ô tìm kiếm dài (Input bo tròn `var(--radius-sm)`, viền `var(--apple-input-border)`).
- Nút "Bộ lọc" (`FilterButton`) có badge đếm số lượng bộ lọc đang kích hoạt.
- Hàng lọc nâng cao mở rộng phía dưới dạng lưới `gridTemplateColumns: repeat(auto-fill, minmax(180px, 1fr))`.

### 4.3. Bảng dữ liệu chuẩn (`DataTable.tsx`)
- Bọc Ant Design Table, loại bỏ các đường viền thô.
- Header bảng: Nền xám nhạt `#fafafc`, chữ xám font-weight: 600, cỡ chữ 13px.
- Dòng dữ liệu: chiều cao tối thiểu 52px, hover chuyển màu `var(--apple-surface-hover)`.
- Phân trang gọn: góc phải dưới, hiển thị rõ tổng số dòng và dropdown chọn số dòng/trang.
- Tự động fallback responsive sang dạng thẻ trên mobile (`mobileRender`).

### 4.4. Cụm nút thao tác bảng (`ActionGroup.tsx`)
- Đặt ở cột cuối bảng (Thao tác), kích thước chuẩn **32px x 32px**, bo góc **6px**.
- **Xem chi tiết:** Icon con mắt, nền xanh dương nhạt (`--action-view-bg`), icon xanh (`--action-view`).
- **Chỉnh sửa:** Icon cây bút, nền cam nhạt (`--action-edit-bg`), icon cam (`--action-edit`).
- **Khóa / Mở:** Icon công tắc Toggle (xanh khi hoạt động, đỏ khi tạm ngưng).
- **Xoá:** Icon thùng rác, nền đỏ nhạt (`--action-danger-bg`), icon đỏ (`--action-danger`).

### 4.5. Khung Modal hộp thoại (`AppModal.tsx`)
- **Backdrop:** Nền tối mờ `rgba(15, 23, 42, 0.42)` kèm `backdrop-filter: blur(10px)`.
- **Khung hộp thoại:** Bo góc lớn 24px (`--radius-xl`), viền 1px solid `rgba(255, 255, 255, 0.2)` phản chiếu nhẹ, đổ bóng sâu `var(--apple-shadow-modal)`.
- **Chân modal:** Nút Hủy (`SecondaryButton` xám) bên trái, nút Lưu / Xác nhận (`PrimaryButton` cam gradient) bên phải.

### 4.6. Ngăn kéo chi tiết trượt (`DetailDrawer.tsx`)
- Trượt êm ái từ cạnh phải màn hình (`width: 640px` hoặc `800px`).
- Hiển thị thông tin đối tượng theo dạng thẻ thông số hai cột (`label` - `value`).
- Khu vực kiểm toán: Ai tạo, lúc mấy giờ, ai sửa cuối cùng.

### 4.7. Huy hiệu trạng thái (`StatusBadge.tsx`)
- Huy hiệu hình viên thuốc bo góc toàn phần `9999px` (`--radius-full`).
- Dấu chấm tròn báo trạng thái (dot indicator) và màu sắc tương phản cao.

### 4.8. Chữ mã monospace (`CodeText.tsx`)
- Hiển thị các mã SKU, mã phiếu kiểm tra, số tài khoản, mã nhân viên bằng font monospace chuẩn Apple (`SF Mono`).
- Hỗ trợ tooltip và bấm sao chép nhanh 1 chạm.

---

## 5. Kế hoạch Triển khai Chi tiết

1. **Bước 1 — Setup nền tảng:** React 19 + TypeScript + Vite + Ant Design 5.
2. **Bước 2 — Cấu hình Design Tokens:** File `src/styles/tokens.css`, import vào `src/styles/global.css`, font hệ thống Apple và font Code.
3. **Bước 3 — Tạo bộ UI Component dùng chung:** `src/components/ui/` bao gồm đầy đủ 9 component lõi.
4. **Bước 4 — Dựng App Shell:** Sidebar trái tối giản, Topbar kính mờ, PageContainer nền card trắng bo 18px.
5. **Bước 5 — Dựng Master Screen:** Quản lý danh mục với FilterBar, DataTable, DetailDrawer, AppModal, ActionGroup.
6. **Bước 6 — Pre-flight Quality Check:** Kiểm tra không hardcode màu sắc, 0 lỗi TypeScript, 0 lỗi Lint, build nhanh < 1s.
