# Kế hoạch chuẩn hoá kiến trúc frontend (permission, API, component dùng chung)

Lập 17/11/2026 từ khảo sát code. Mục tiêu: **mỗi việc chỉ có một cách làm**, component dùng chung rõ ràng, linter chặn cách làm sai.
Đọc `frontend/CLAUDE.md` + `docs/ARCHITECTURE_PROPOSAL.md` trước. Không đổi giao diện/hành vi (chỉ chuyển code); không thêm thư viện mới.
Làm sau P0 của `PLAN_UI_UX.md`. Kiểm tra mỗi bước: `npm run typecheck && npm run lint && npm run build` + mở thử các trang bị ảnh hưởng.

## Hiện trạng lệch chuẩn (đo 17/11/2026)
| Vấn đề | Chi tiết |
|---|---|
| 2 đường import cho cùng hook | `useNotify`: 24 chỗ `@/components/feedback/useNotify` + 14 chỗ `@/hooks/useNotify` (file này chỉ re-export). `useConfirm`: 6 + 6. |
| File API không có `PATH` | `features/audit/api/audit.api.ts`, `notifications/api/notification.api.ts`, `reports/api/report.api.ts`, `inspections/api/risk-profile.api.ts` viết URL rải rác. |
| Thiếu query key | chỉ 6/13 feature có `*.keys.ts`; còn lại viết `queryKey` tay trong hook. |
| Kiểm tra vai trò bằng chuỗi | `inspections/pages/mobile/InspectionHomePage.tsx`: `user?.roles?.includes('STORE_MANAGER')`, `'SYSTEM_ADMIN'` → vi phạm quy tắc 2 (CLAUDE.md). |
| Nút thô | `<button className="action-btn …">` trong `criteria/components/GroupTable.tsx`, `inspections/components/FindingTable.tsx`, `PlanTable.tsx`, form tổ chức/vai trò – thay vì `TableActions`/`Button`. |
| Kiểu viết tay | `inspections/inspection.types.ts` (21 export) không lấy từ `types/api.generated.ts`. |
| Thông báo mobile tách riêng | `components/feedback/mobileFeedback.ts` (Toast/Dialog antd-mobile) khác API với `useNotify`/`useConfirm`. |

---

## 1. Cấu trúc thư mục chuẩn
```
src/
  app/            providers, router (router.tsx, guards, shells, menu), config/theme – ghép mọi thứ, không chứa nghiệp vụ
  lib/http/       api.ts (axios instance), api.interceptor.ts, api-error.ts (ApiError, getErrorMessage, applyFieldErrors), api.types.ts
  permissions/    permissions.ts (PERMISSIONS), roles.ts (ROLES), areas.ts (AREA_ACCESS), permission.service.ts (can/satisfies),
                  usePermission.ts, PermissionGuard.tsx, ProtectedAction.tsx, index.ts  ← chỉ import qua '@/permissions'
  components/     design system KHÔNG biết nghiệp vụ (không import features, không import lib/http)
    actions/      AppButton? (chỉ khi cần – xem §4), TableActions, ExportMenu
    data-display/ DataTable, TableCard, StatusBadge, KpiCard, DescriptionList, EmptyState, …
    data-entry/   Form* (react-hook-form), AdvancedFilter, SearchInput, Filter*
    feedback/     useNotify, useConfirm, ErrorState, LoadingState, RouteErrorBoundary, mobile (mobileToast, confirmMobile)
    layout/       PageContainer, AdminLayout, MobileLayout, AppHeader, Sidebar, …
    charts/ excel/
  features/<m>/
    api/<m>.api.ts      PATH + hàm gọi API (chỉ api từ '@/lib/http')
    api/<m>.keys.ts     query key factory
    hooks/use<M>*.ts    TanStack Query (useQuery/useMutation), invalidate theo keys
    components/ pages/(admin|mobile)/ schemas/ constants/
    <m>.types.ts        alias từ api.generated (không viết tay DTO)
    <m>.routes.ts       AppRoute + handle.access/menu
    index.ts            public API của feature (ngoài feature chỉ import qua đây)
  hooks/ utils/ constants/ types/ styles/
```
Quy tắc phụ thuộc (đã có trong `frontend/CLAUDE.md`): `app → features → components | permissions | hooks | lib | utils | constants | types`.

## 2. Permission (`src/permissions/`)
1. **Một nguồn**: `PERMISSIONS` (`module:action`, khớp `PermissionCodes` backend) và `ROLES` (khớp `RoleCodes`) – không viết chuỗi ở chỗ khác.
2. **Đồng bộ với backend**: thêm script kiểm tra (Vitest hoặc script node trong `tools/`) so `PERMISSIONS` với danh sách quyền từ
   `GET /api/v1/permissions` (hoặc `api.generated.ts`) – báo thiếu/thừa. Chạy trong CI cùng `npm run lint`.
3. **Cách dùng duy nhất**:
   - Ẩn/hiện nút: `<ProtectedAction access={PERMISSIONS.X.Y}>`.
   - Ẩn/hiện khối/trang con: `<PermissionGuard access=…>`.
   - Logic trong component: `const { can, allows } = usePermission()`.
   - Quyền vào trang: `handle.access` trong `<m>.routes.ts` (guard tự kiểm).
   - **Không** kiểm vai trò bằng `roles.includes('…')`. Nếu cần "giao diện theo vai trò" (vd `/qc` CHT vs Chuyên viên) → dựa trên **quyền**
     (`FINDING.RESPOND` ⇒ giao diện CHT, `INSPECTION.PERFORM` ⇒ giao diện Chuyên viên) hoặc helper `useRoleView()` trong `permissions/` dùng `ROLES`.
     Nhãn vai trò hiển thị: map `ROLES → label` một chỗ (`permissions/roles.ts`).
4. Sửa: `InspectionHomePage.tsx` (2 chỗ chuỗi vai trò).

## 3. Lớp API (`lib/http` + `features/<m>/api`)
1. **Mẫu file `<m>.api.ts`**:
   ```ts
   const PATH = {
     list: '/reports/monthly-summary',
     item: (id: Id) => `/findings/${id}`,
   } as const
   export const reportApi = {
     monthlySummary: (params: MonthlyParams) => api.get<MonthlySummary>(PATH.list, { params }).then(data),
   }
   ```
   - Chỉ dùng `api` + `data` từ `@/lib/http`; kiểu request/response lấy từ `@/types/api.generated` (qua `<m>.types.ts`).
   - Tải file (Excel/PDF): một helper chung `downloadFile(path, params, fallbackName)` trong `lib/http` (đọc `Content-Disposition`),
     thay các bản tự viết ở `excel`, `reports`, in phiếu.
2. **Query key**: mỗi feature có `<m>.keys.ts` dạng `xKeys.all / lists() / list(params) / detail(id)`; hook chỉ dùng keys này;
   mutation `invalidateQueries({ queryKey: xKeys.all })` (hoặc phạm vi hẹp hơn).
3. **Hook**: `features/<m>/hooks/` – một file theo thực thể (`usePlans.ts`, `useInspections.ts`, `useFindings.ts`), < 150 dòng.
   Tách `inspections/hooks/useInspectionData.ts` (236 dòng) theo cách này.
4. **Lỗi**: component không tự bắt `err.message`; luôn `notify.error(getErrorMessage(err))` hoặc `applyFieldErrors(err, setError)`.
   Tìm và sửa mẫu `(err as { message?: string })?.message` (vd `criteria/pages/TemplateListPage.tsx`).
5. Sửa: thêm `PATH` + `*.keys.ts` cho `audit`, `notifications`, `reports`, `inspections/risk-profile`; rà 13 file API theo mẫu.

## 4. Component dùng chung – dùng cái gì cho việc gì
| Việc | Dùng | Không dùng |
|---|---|---|
| Nút thường / nút chính | `Button` của antd (`type="primary"` cho hành động chính – style kính đã ở `global.css`) | `<button>` HTML, style inline màu |
| Nút thao tác trong bảng (Xem/Sửa/Xoá/thêm) | `TableActions` (+ prop `extra` cho nút riêng, cùng class `action-btn-*`) | `<button className="action-btn …">` tự viết |
| Nhóm Excel | `ExcelActions` (Nhập / File mẫu / Xuất) | nút Excel tự viết |
| Thông báo toast (desktop) | `const notify = useNotify()` → `notify.success/error/info` | `message.*`, `notification.*`, `App.useApp()` trực tiếp |
| Hỏi xác nhận (desktop) | `const confirm = useConfirm()` → `await confirm({ title, content, danger })` | `Modal.confirm` trực tiếp |
| Toast / xác nhận (mobile `/qc`) | `mobileToast.*`, `confirmMobile()` từ `@/components/feedback` | `Toast.show`, `Dialog.confirm` trực tiếp |
| Tag trạng thái | `StatusBadge` + bảng meta trong `features/<m>/constants/status.ts` | `Tag color=…` rải rác, bảng `STATUS_TAG` chép lại |
| Trang danh sách | `PageContainer` + `AdvancedFilter` + `DataTable` (phân trang server) / `TableCard` (bảng thường) | `Card` bọc chung bộ lọc + bảng |
| Form | react-hook-form + `zodResolver` + `Form*` (`FormInput`, `FormSelect`, `FormNumber`, `FormDatePicker`, …) | `Form.Item` antd tự quản lý state (trừ form rất nhỏ đã có) |
| Rỗng / tải / lỗi | `EmptyState`, `LoadingState`, `ErrorState` | ảnh/chữ tự viết |
| Modal chi tiết | `DetailModal` + `DescriptionList` | Modal tự dựng bảng mô tả |
| Biểu đồ | `ChartCard` + `EChart` (theme `chart-theme.ts`) | import echarts trực tiếp trong feature |

Việc cần làm:
1. **Một đường import** cho feedback: giữ `@/components/feedback` (thêm `components/feedback/index.ts` export `useNotify`, `useConfirm`,
   `mobileToast`, `confirmMobile`, `ErrorState`, …). Đổi 14 + 6 chỗ đang import `@/hooks/useNotify|useConfirm`, rồi **xoá** `hooks/useNotify.ts`, `hooks/useConfirm.ts`.
2. **Gộp API thông báo desktop/mobile**: `useNotify()` tự chọn antd hoặc antd-mobile theo khu vực (`/qc`) **hoặc** giữ 2 bản nhưng cùng chữ ký
   (`success(msg)`, `error(msg)`, `confirm({title, content}) → Promise<boolean>`) – chọn một, ghi vào `frontend/CLAUDE.md`.
3. **Thay nút thô**: `GroupTable`, `FindingTable`, `PlanTable` và các form tổ chức/vai trò → `TableActions`/`Button`; `TableActions` nhận thêm
   `extra` với nút có `tone: 'view' | 'add' | 'edit' | 'delete'` để không ai phải tự gắn class.
4. **`index.ts` cho mỗi thư mục component** (`data-display`, `data-entry`, `feedback`, `layout`) để import gọn `@/components/data-display`.
5. **Mục lục component**: tạo `src/components/README.md` – bảng trên + ví dụ dùng ngắn cho từng component.

## 5. Kiểu dữ liệu
- `features/<m>/<m>.types.ts` chỉ chứa alias: `export type InspectionResponse = Schemas['InspectionResponse']` (`Schemas` từ `api.generated`),
  cộng các kiểu thuần UI (filter form, props). Bắt đầu với `inspections/inspection.types.ts` (21 export viết tay).
- Enum trạng thái lấy từ generated (`InspectionResponse['status']`), không khai báo union tay.

## 6. Linter chặn cách làm sai (oxlint – không thêm thư viện)
Thêm vào cấu hình oxlint (`.oxlintrc.json`) quy tắc `no-restricted-imports`:
- Cấm `antd` → `message`, `notification`, `Modal` (dùng `useNotify`/`useConfirm`) ngoài `src/components/feedback/**`.
- Cấm `antd-mobile` → `Toast`, `Dialog` ngoài `src/components/feedback/**`.
- Cấm `axios` ngoài `src/lib/http/**`; cấm `@/lib/http` trong `src/components/**`.
- Cấm `@/hooks/useNotify`, `@/hooks/useConfirm` (sau khi xoá).
- Cấm import sâu vào feature khác (`@/features/*/components/*` từ feature khác – chỉ qua `@/features/<m>` index).
Nếu oxlint không hỗ trợ đủ, thêm script kiểm tra nhỏ trong `tools/` (grep) chạy cùng `npm run lint`.

## 7. Thứ tự làm & hoàn thành
1. §4.1 (một đường import feedback) → §2.4 (bỏ chuỗi vai trò) → §3.5 (PATH + keys) → §4.3 (nút thô) → §5 (kiểu) → §3.3 (tách hook)
   → §4.2, §4.4, §4.5 → §6 (linter, bật cuối cùng khi code đã sạch).
2. Mỗi bước một commit `refactor(frontend): …`.
3. Hoàn thành khi: không còn import `@/hooks/useNotify|useConfirm`; mọi `*.api.ts` có `PATH`; mọi feature có `*.keys.ts`;
   `grep -rn "roles?.includes\|roles.includes" src/features` rỗng; không còn `<button` trong `src/features`; linter §6 bật và qua;
   cập nhật `frontend/CLAUDE.md` (bảng §4 rút gọn) và `src/components/README.md`.
