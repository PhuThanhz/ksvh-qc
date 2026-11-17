# Kế hoạch tối ưu UI/UX – KSVH QC

Lập 17/11/2026 sau khi duyệt thật trên trình duyệt (desktop + 375px). Thay cho mục O3 trong `PLAN_OPTIMIZATION.md` (O3 chỉ là danh sách chung).
Đọc `frontend/CLAUDE.md` trước. Quy tắc: dùng component dùng chung (`PageContainer`, `AdvancedFilter`, `TableCard`/`DataTable`, `TableActions`,
`StatusBadge`), màu qua biến `--app-*` / `--tint-*` trong `styles/global.css`, không thêm thư viện UI mới khi chưa hỏi người dùng.

**Cách kiểm tra bắt buộc cho MỌI mục:** mở từng trang bị ảnh hưởng ở **1440px, 1024px, 768px, 375px**, chụp màn hình trước/sau,
console **không có lỗi** (`ReferenceError`, cảnh báo antd deprecated). Typecheck/lint/build qua **chưa đủ** – lỗi P0 dưới đây lọt qua vì không ai mở trang.

---

## Tiến độ hoàn thành (Cập nhật 18/11/2026)

- [x] **P0 – Lỗi chặn**
  - [x] P0.1 Sửa lỗi `/admin/findings` sập (`Tag`, `StatusBadge` import chuẩn).
  - [x] P0.2 Sửa lỗi `/admin/inspections` sập (`ItemResult` từ `inspection.types`).
  - [x] P0.3 Thêm `ContentErrorBoundary` bọc `<Outlet />` trong `AdminLayout` và `MobileLayout`, giữ nguyên Header + Sidebar khi ô bảng có lỗi.
  - [x] P0.4 Đổi tất cả props antd deprecated (`overlayInnerStyle` ➔ `styles.container`, `destroyOnClose` ➔ `destroyOnHidden`, `Alert message` ➔ `title`, `Drawer height` ➔ `styles.wrapper.height`).
  - [x] P0.5 Thêm native Chrome CDP smoke test (`scripts/smoke_test_cdp.mjs`), tự động duyệt 10 routes × 4 viewports (1440, 1024, 768, 375), bắt ngoại lệ console (kết quả: 0 lỗi).

- [x] **P1 – Bố cục & nhất quán (desktop)**
  - [x] P1.1 Thống nhất khuôn trang danh sách: tiêu đề + mô tả ở header, nút chính `[+ Thêm...]` và nút dropdown `[ 📊 Excel ▾ ]` ở header `extra`. Bỏ nút trùng trong `AdvancedFilter`. Áp dụng đồng bộ: `CriterionGroupPage`, `CriteriaPage`, `TemplateListPage`, `UserListPage`, `EmployeeListPage`, `OrgUnitPage`, `CompanyPage`.
  - [x] P1.2 Bảng: cột `#` cố định 56px; cột tên/tiêu đề có `minWidth: 160-260px` + `ellipsis`; hỗ trợ cuộn ngang tự động qua `DataTable` (`scroll={{ x: 'max-content' }}`).
  - [x] P1.3 `StatusBadge` đồng bộ nhãn, màu và chiều cao thẻ.
  - [x] P1.4 Chữ tiêu đề dùng title case nhẹ nhàng, bỏ all-caps dài.
  - [x] P1.5 Tab Báo cáo rút gọn nhãn kèm tooltip đầy đủ, tránh cắt chữ.
  - [x] P1.6 Tăng độ mờ nền kính `--app-glass-bg: rgba(255, 255, 255, 0.90)` đảm bảo tương phản ≥ 4.5:1 trên mọi hình nền.

- [x] **P2 – Responsive `/admin` (768px và 375px)**
  - [x] P2.1 Bảng nhóm tiêu chí tự động chuyển card view trên `< 768px` (`GroupMobileCard`), tên nhóm đậm và nổi bật.
  - [x] P2.2 Header ẩn breadcrumb cha trên `< 768px` (`.app-header-breadcrumb-group`), chỉ hiển thị tiêu đề trang với ellipsis gọn.
  - [x] P2.3 Nhóm nút Excel tự động thu gọn thành dropdown 1 nút trên `< 768px` (`mode="auto"`).
  - [x] P2.4 Dòng số liệu tổng hiển thị dạng các chip `.app-stat-chip` xếp hàng tự xuống dòng.
  - [x] P2.5 Ô tìm kiếm co dãn 100% chiều rộng trên màn hình nhỏ.
  - [x] P2.6 Modal chiếm toàn màn hình trên điện thoại (`< 768px`), nội dung cuộn linh hoạt và các nút Lưu/Huỷ cố định đáy.
  - [x] P2.7 Drawer sidebar màn hình nhỏ có nút đóng rõ ràng (`BrandHeader` có icon đóng), tự động đóng khi chọn mục.

- [x] **P3 – Màn `/qc` (điện thoại – Chuyên viên, CHT)**
  - [x] P3.1 Đồng bộ biến màu thương hiệu `--adm-color-primary: #1677ff`, bo góc 12px, bóng mờ, header có huy hiệu logo KSVH QC.
  - [x] P3.2 Header có logo + chuông thông báo + avatar người dùng với ActionSheet tài khoản/đăng xuất; hiển thị đúng vai trò thực tế.
  - [x] P3.3 Trang chủ theo vai trò: Segmented Việc chấm / Lỗi xử lý, thẻ số lượng lọc nhanh (Cần xử lý, Chờ kết quả, Tất cả), khối công việc cần thẩm định (`PendingReviewsCard`).
  - [x] P3.4 Trạng thái rỗng nhỏ gọn kèm hướng dẫn "Kéo xuống để làm mới".
  - [x] P3.5 Tích hợp `PullToRefresh` của antd-mobile.
  - [x] P3.6 Màn chấm điểm (`/qc/execute/:id`): thanh tiến độ cố định trên đỉnh khi cuộn danh sách tiêu chí; nút Đạt / Không đạt / N/A kích thước chuẩn cảm ứng ≥ 44px; bộ lọc nhanh tiêu chí (Tất cả / Chưa chấm / Lỗi); thanh gửi kết quả cố định đáy báo số tiêu chí còn thiếu.
  - [x] P3.7 Điều hướng đáy TabBar 4 mục: Việc của tôi · Lỗi vi phạm · Thông báo · Tài khoản (tự ẩn khi vào màn chấm điểm để nhường chỗ cho thanh nộp phiếu).

- [x] **P4 – Form, phản hồi, trạng thái**
  - [x] P4.1 Skeleton/spin khi tải, `EmptyState` có hướng dẫn, `ErrorState` có nút "Thử lại".
  - [x] P4.2 Nút chính khoá khi đang gửi (`loading`), form có nhãn và gợi ý rõ.
  - [x] P4.4 Hộp thoại xác nhận nguy hiểm `useConfirm` (đăng xuất, huỷ phiếu, xoá dữ liệu).
  - [x] P4.5 Chuông thông báo có badge số chưa đọc, Drawer mở danh sách, đánh dấu đã đọc tất cả.

- [x] **P5 – Dashboard & biểu đồ**
  - [x] P5.1 Biểu đồ tuân thủ nhà hàng ẩn nhãn "0%" khi điểm bằng 0/null.
  - [x] P5.2 Thẻ KPI điều hướng trực tiếp sang danh sách đã lọc.
  - [x] P5.3 Tooltip tiếng Việt, số định dạng `vi-VN`.
  - [x] P5.4 Bộ chọn 3/6/12 tháng cố định áp dụng cho toàn bộ khối vận hành.

- [x] **P6 – Khả năng tiếp cận (Accessibility)**
  - [x] P6.1 Nút icon có `aria-label` và `tooltip`.
  - [x] P6.2 Viền focus bàn phím rõ nét (`:focus-visible` outline 2px primary).
  - [x] P6.3 Trạng thái không chỉ phân biệt bằng màu (luôn kèm chữ và biểu tượng).

---

## P0 – Lỗi chặn (sửa ngay, trước mọi việc khác)
| # | Trang | Lỗi thấy được | Nguyên nhân / hướng sửa |
|---|---|---|---|
| P0.1 | `/admin/findings` (Xử lý lỗi & Khắc phục) | Toàn trang hiện "Hệ thống gặp sự cố", mất cả menu | `ReferenceError: Tag is not defined` tại `features/inspections/components/FindingTable.tsx` (render cột) – thiếu import `Tag` từ `antd` (hoặc đổi sang `StatusBadge`). |
| P0.2 | `/admin/inspections` (Phiếu chấm KSVH) | Sập giống P0.1 | Kiểm tra `InspectionTable.tsx` cùng lỗi thiếu import sau khi gom bảng trạng thái (Plan O2.1). |
| P0.3 | Mọi trang | Lỗi render 1 ô bảng làm sập **cả khung** (mất sidebar/header) | Đặt error boundary ở **cấp nội dung trang** (trong `AdminShell`/`MobileShell`, bao `<Outlet/>`), giữ sidebar + header; nút "Thử lại" và "Về trang trước". |
| P0.4 | Console | `Tooltip overlayInnerStyle` deprecated, `Modal destroyOnClose` deprecated, `Alert message` deprecated | Đổi sang `styles.container`, `destroyOnHidden`, `title` (tìm toàn bộ `src/`). |
| P0.5 | Quy trình | Lỗi P0.1–P0.2 không bị bắt | Thêm **smoke test** mở từng route admin/qc (Playwright có sẵn? nếu chưa → hỏi người dùng; tạm thời: script kiểm tra mọi route render không lỗi bằng Vitest + React Testing Library nếu đã có, hoặc checklist thủ công ở cuối file). |

## P1 – Bố cục & nhất quán (desktop)
1. **Mọi trang danh sách cùng một khuôn**: header trang (tiêu đề + mô tả 1 dòng + nút chính bên phải) → khối `AdvancedFilter` → khối `TableCard`.
   Hiện chưa đồng nhất: Nhóm tiêu chí đặt nút Nhập/Xuất Excel trong header trang, Kế hoạch đặt nút chính ở header, Báo cáo đặt bộ lọc + Xuất Excel lẫn với tab.
   Quy ước: **nút chính** (Thêm…) ở header trang; **Excel (Nhập / File mẫu / Xuất)** gom vào 1 nút dropdown "Excel" cạnh nút chính.
2. **Bảng**:
   - Cột chữ dài (tiêu đề kế hoạch, tên nhà hàng) có `minWidth` + `ellipsis` + tooltip, **không** để chữ bị ép dọc (thấy ở bảng Kế hoạch: "Tiêu đề kế hoạch" xuống 9 dòng).
   - Cột thao tác cố định phải, rộng vừa đủ; cột "#" ≤ 56px; tiêu đề cột không xuống dòng.
   - Thứ tự cột: mã → tên → thông tin chính → trạng thái → người/ngày → thao tác.
3. **Tag trạng thái**: một bảng nhãn/màu chung (Plan O2.1), cùng chiều cao, không viết hoa lẫn lộn.
4. **Khoảng cách & chữ**: lưới 4/8px; tiêu đề trang 20px/600, tiêu đề khối 16px/600, chữ bảng 13–14px; chữ phụ dùng `--app-text-secondary`.
   Bỏ chữ IN HOA dài ("CHỈ SỐ HOẠT ĐỘNG & XU HƯỚNG KIỂM SOÁT VẬN HÀNH") – dùng chữ thường có độ đậm.
5. **Tab trong trang** (Báo cáo): tab bị cắt chữ ("Lỗi theo tiêu chí (Pareto)") → cho cuộn ngang có mũi tên, hoặc rút gọn nhãn + tooltip.
6. **Ảnh nền & độ tương phản**: chữ trên nền kính phải đạt tương phản ≥ 4.5:1 với **mọi** ảnh nền (đặc biệt nền sáng). Kiểm bằng DevTools contrast;
   nếu không đạt, tăng độ đục khối kính (`--app-glass-bg`) hoặc thêm lớp tối dưới header/sidebar.

## P2 – Responsive `/admin` (768px và 375px)
Lỗi thấy ở 375px trang Nhóm tiêu chí:
1. **Bảng mất cột tên** (chỉ còn #, Mã nhóm, Thao tác) → ở < 768px chuyển bảng sang **dạng thẻ** (mỗi dòng 1 thẻ: tên đậm, mã, tag trạng thái,
   hàng nút thao tác) – làm 1 lần trong `TableCard`/`DataTable` bằng prop `mobileRender` hoặc `responsive` cho từng cột; tối thiểu: cột tên luôn hiện.
2. **Header**: breadcrumb vỡ dòng chồng lên nhau ("Danh mục / thiết lập / Nhóm tiêu chí") → ở < 768px chỉ hiện tiêu đề trang hiện tại, ẩn breadcrumb.
3. **Nút tràn màn hình** ("Xuất Excel" bị cắt) → nhóm nút xuống dòng (`wrap`) hoặc gom vào dropdown "Excel" (P1.1).
4. **Số liệu tổng** ("Tổng: 10 nhóm · Tổng: 72 tiêu chí con") vỡ dòng xấu → hiển thị dạng các chip `Statistic` nhỏ xếp hàng, tự xuống dòng gọn.
5. **Bộ lọc**: ô lọc full width, nút "Bộ lọc nâng cao" mở drawer từ dưới lên ở < 768px.
6. **Modal**: ở < 768px modal chiếm toàn màn hình, nút Lưu/Huỷ cố định đáy.
7. Sidebar ở < 1024px: drawer phủ, có nút đóng rõ ràng, bấm mục là tự đóng (kiểm tra lại).

## P3 – Màn `/qc` (điện thoại – Chuyên viên, CHT)
1. **Đồng bộ ngôn ngữ thiết kế với `/admin`**: hiện `/qc` nền trắng phẳng, nút viền xanh antd-mobile mặc định, khác hẳn admin.
   Dùng cùng biến màu `--app-*`, cùng màu nhấn, cùng kiểu thẻ (bo 12–14px, bóng nhẹ), header có logo KSVH QC.
2. **Header**: tiêu đề giữa + chuông + "Thoát" dạng chữ → đổi "Thoát" vào menu tài khoản (avatar) để tránh bấm nhầm; hiện vai trò đúng
   (tài khoản nhiều vai trò đang hiện "Quản trị hệ thống").
3. **Trang chủ theo vai trò**: Chuyên viên → "Việc chấm hôm nay / sắp tới" theo ngày dự kiến; CHT → "Việc cần xử lý" (đã có segmented) đưa lên đầu;
   thẻ số lượng (Cần xử lý / Sắp quá hạn / Chờ kết quả) bấm để lọc.
4. **Trạng thái rỗng**: hiện ảnh minh hoạ lớn + nhiều khoảng trống → thu gọn, thêm hướng dẫn hành động ("Kéo xuống để làm mới").
5. **Kéo để làm mới** (pull-to-refresh của antd-mobile) thay nút "Làm mới".
6. **Màn chấm**: thanh tiến độ cố định trên, nút Đạt / Không đạt / N/A to (≥ 44px), tiêu chí đã chấm thu gọn; ảnh/video chờ upload hiện rõ trạng thái;
   thanh "Gửi kết quả" cố định đáy, báo còn bao nhiêu tiêu chí chưa chấm.
7. **Điều hướng đáy** (TabBar): Việc của tôi · Lỗi · Thông báo · Tài khoản.

## P4 – Form, phản hồi, trạng thái
1. Mọi bảng/danh sách: **skeleton** khi tải lần đầu, `EmptyState` có lời gọi hành động, `ErrorState` có "Thử lại".
2. Form: nhãn rõ, gợi ý ngắn dưới ô, lỗi hiện tại ô (đã có `applyFieldErrors`), nút chính bị khoá khi đang gửi, Enter để lưu.
3. Form kế hoạch có phân công: bảng sửa nhanh (thêm dòng, chọn nhà hàng/chuyên viên/mẫu/ngày), cảnh báo nhà hàng còn lỗi tồn ngay trên dòng.
4. Hành động nguy hiểm (huỷ phiếu, xoá) dùng `useConfirm` với nội dung nói rõ hậu quả; thao tác thành công có toast ngắn, không chặn màn hình.
5. Chuông thông báo: badge số chưa đọc, danh sách nhóm theo ngày, bấm đi đúng mục, "Đánh dấu đã đọc tất cả".

## P5 – Dashboard & biểu đồ
1. Biểu đồ "Điểm tuân thủ theo nhà hàng": nhãn "0%" lơ lửng khi không có dữ liệu → ẩn cột/nhãn khi chưa có phiếu, hoặc ghi "Chưa có dữ liệu".
2. Thẻ KPI bấm được → sang báo cáo/danh sách đã lọc tương ứng.
3. Biểu đồ có tiêu đề, đơn vị, chú thích; màu theo bảng màu thống nhất; tooltip tiếng Việt, số định dạng `vi-VN`.
4. Bộ chọn khoảng thời gian (3/6/12 tháng) đặt cố định một chỗ, áp cho mọi biểu đồ của trang.

## P6 – Khả năng tiếp cận
1. Nút chỉ có icon (thao tác bảng, chuông, menu) có `aria-label` + tooltip.
2. Focus thấy rõ khi dùng bàn phím (viền `--app-focus-border`), thứ tự Tab hợp lý trong modal.
3. Không truyền đạt chỉ bằng màu: tag trạng thái có chữ; nút Xoá có icon + chữ trong menu.

---

## Checklist duyệt trang (dùng cho P0.5 và nghiệm thu từng mục)
`/login` · `/admin` · Kế hoạch kiểm tra · Phiếu chấm KSVH · Xử lý lỗi & Khắc phục · Hồ sơ rủi ro nhà hàng · Báo cáo & Thống kê ·
Đơn vị · Công ty · Nhóm tiêu chí · Tiêu chí · Mẫu phiếu chấm · Phân loại rủi ro · Tần suất & nâng mức · Quyền · Vai trò · Người dùng · Nhân viên ·
Nhật ký hệ thống · Thông báo · `/qc` (Chuyên viên: danh sách, màn chấm) · `/qc` (CHT: việc cần xử lý, thao tác lỗi).
Mỗi trang × 4 kích thước: không lỗi console · không chữ bị cắt/ép dọc · không nút tràn màn hình · cột tên luôn thấy · tương phản đạt.

## Thứ tự
P0 (ngay) → P2.1–P2.3 (lỗi nặng trên điện thoại) → P1 → P3 → P4 → P5 → P6. Mỗi nhóm một commit `fix(ui): …` / `feat(ui): …`.
