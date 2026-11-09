# Frontend – Quy tắc React

React 19 + TypeScript (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`) + Vite 8, React Router 8 (data router, `lazy`), TanStack Query 5, Zustand 5, Axios, react-hook-form + zod 4, Ant Design 6 (`/admin`), Ant Design Mobile 5 (`/qc`). Lint: oxlint.

## Cấu trúc
```
src/
  api/          http.ts (axios + JWT + tự refresh), <module>.ts, types.ts
  app/          router.tsx, RequireAuth, RootRedirect
  features/
    auth/       đăng nhập, authStore (zustand persist)
    admin/      dashboard máy tính – CHỈ dùng antd
    qc/         giao diện điện thoại – CHỈ dùng antd-mobile
  shared/       hooks (useGeolocation, usePhotoCapture), utils, component dùng chung
```
Import bằng alias `@/...`.

## Quy ước
- **Không trộn UI kit:** `features/admin` dùng `antd`, `features/qc` dùng `antd-mobile`. Trang mới thêm route `lazy` trong `app/router.tsx`.
- **Gọi API:** hàm trong `src/api/<module>.ts` dùng `http`; component dùng `useQuery`/`useMutation`, không gọi axios trực tiếp. Query key dạng `['<module>', ...params]`.
- Type API khai báo ở `src/api/types.ts` hoặc file module, khớp DTO backend. Dùng `import type` cho type.
- Form: react-hook-form + `zodResolver`, thông báo lỗi tiếng Việt. Lỗi từ server hiển thị bằng `errorMessage(err)`; lỗi theo trường lấy từ `ProblemDetail.errors`.
- State server ở TanStack Query; Zustand chỉ cho state phiên (auth) và UI dùng chung.
- Không dùng `enum` TypeScript (dùng union string). Không `any`.
- Text hiển thị tiếng Việt có dấu.

## Mobile `/qc`
- Thiết kế cho điện thoại một tay: nút `size="large"`, nút hành động chính để `block`, nội dung không bị thanh tab che (dùng `SafeArea`).
- GPS: dùng `useGeolocation` (theo dõi, giữ lần đo sai số nhỏ nhất, ngưỡng mặc định 50m). Gửi cả `accuracy` lên server.
- Ảnh: `<input type="file" accept="image/*" capture="environment">` + `usePhotoCapture` (nén → đóng dấu → presign → PUT). Không tự dựng camera bằng `getUserMedia`.
- Mọi thao tác mạng có trạng thái loading và thông báo lỗi rõ ràng.

## Kiểm tra
```bash
npm run typecheck && npm run lint && npm run build
npm run dev:http   # máy tính, http://localhost:5273
npm run dev        # HTTPS cho điện thoại
```
