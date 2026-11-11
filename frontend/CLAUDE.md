# Frontend – Quy tắc React

React 19 + TypeScript 7 (**strict**, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`) + Vite 8, React Router 8 (data router, `lazy`, `handle`), TanStack Query 5, Zustand 5, Axios, react-hook-form + zod 4, Ant Design 6 (`/admin`), Ant Design Mobile 5 (`/qc`), dayjs. Lint: oxlint. Kiến trúc chi tiết: [docs/ARCHITECTURE_PROPOSAL.md](../docs/ARCHITECTURE_PROPOSAL.md).

## Cấu trúc
```
src/
  app/          App, providers (AppProviders, AuthBootstrap), router (router, guards, shells, menu), config/theme
  lib/          env.ts, query-client.ts, http/ (api, interceptor, ApiError) – hạ tầng, KHÔNG import features
  features/<m>/ api/ (<m>.api.ts, <m>.keys.ts) · components/ · hooks/ · pages/ (admin|mobile) · schemas/ · <m>.types.ts · <m>.routes.ts · index.ts
  components/   design system: layout/ · data-display/ · data-entry/ · feedback/ – KHÔNG import features
  permissions/  PERMISSIONS, AccessRule, can/satisfies, usePermission, PermissionGuard, ProtectedAction, AREA_ACCESS
  hooks/ utils/ constants/ types/ styles/
  types/api.generated.ts   ← SINH TỰ ĐỘNG (npm run api:types), không sửa tay
```

## Hướng phụ thuộc (bắt buộc)
`app → features → components | permissions | hooks | lib | utils | constants | types`
- Ngoài feature chỉ import qua `features/<m>/index.ts`.
- `components/` không import `features/` hay `lib/http`. Layout nhận user/onLogout qua props (ghép ở `app/router/shells.tsx`).
- `lib/` không import `features/` hay `app/`.

## Quy ước
- **API:** URL khai báo trong `PATH` ở đầu `<m>.api.ts`, gọi qua `api` từ `@/lib/http`. Component không gọi axios. Type DTO lấy từ `@/types/api.generated`.
- **Query key** trong `<m>.keys.ts` (`[module, 'list', params]`); sau mutation `invalidateQueries({ queryKey: xKeys.all })`.
- **Lỗi:** mọi lỗi API là `ApiError` (`kind`, `status`, `code`, `fieldErrors`). Hiển thị bằng `getErrorMessage(err)`; lỗi theo trường dùng `applyFieldErrors(err, setError)`.
- **Phiên đăng nhập:** access token chỉ ở bộ nhớ (`useSessionStore`, không persist). Không bao giờ ghi token vào localStorage/sessionStorage. Đọc phiên bằng `useSession()`.
- **Phân quyền:** không viết chuỗi permission/role trong component. Dùng `PERMISSIONS.X.Y` + `usePermission`/`PermissionGuard`/`ProtectedAction`. Quyền vào trang khai báo ở `handle.access` của route.
- **Route mới:** khai báo trong `features/<m>/<m>.routes.ts` (kiểu `AppRoute`, `lazy`), thêm vào `adminRoutes`/`qcRoutes` trong `app/router/router.tsx`. Có `handle.menu` thì tự vào menu/tab.
- **Form & Bộ lọc:** react-hook-form + `zodResolver` + `FormInput`/`FormSelect`/`FormTextarea`/`FormSwitch`/`FormDatePicker`/`FormField`; bộ lọc danh sách dùng `FilterBar` + `FilterSelect`/`FilterDateRange` + `useListParams`; thông báo tiếng Việt.
- **UI kit & Thông báo:** `pages/admin` + `components/*` dùng `antd`; `pages/mobile` dùng `antd-mobile`. Toast/notify dùng `useNotify()` (desktop) hoặc `mobileToast` / `confirmMobile` (mobile); modal xác nhận desktop dùng `useConfirm()`.
- **Hằng số** trong `constants/` (timeout, phân trang, ngưỡng GPS…); đường dẫn trang trong `constants/routes.ts`.
- Không `any`, không `enum`, không `console.log`, dùng `import type` cho type.
- Kích thước: component 100–200 dòng (xem lại > 300), hook < 150, file api < 200.

## Mobile `/qc`
- Nút lớn, hành động chính `block`, có loading/lỗi rõ ràng.
- GPS: `useGeolocation` (giữ lần đo sai số nhỏ nhất). Ảnh: `usePhotoCapture` từ `@/features/media` (nén → đóng dấu → presign → PUT). Không tự dựng camera bằng `getUserMedia`.

## Lệnh
```bash
npm run dev:http     # máy tính: http://localhost:5273 (backend phải chạy ở :8088)
npm run dev          # HTTPS cho điện thoại cùng Wi-Fi
npm run api:types    # sinh lại types từ http://localhost:8088/v3/api-docs (sau khi đổi API backend)
npm run typecheck && npm run lint && npm run build
```
