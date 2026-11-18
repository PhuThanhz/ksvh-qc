# Plan: Cải tổ giao diện KSVH QC – "Bitrix glass" nhanh, đẹp, đồng bộ (admin + mobile /qc)

## Context
Người dùng thấy giao diện **lag, kính mờ xấu, nút xấu, chữ xấu, UX kém** và muốn giữ phong cách **sidebar kính mờ kiểu Bitrix24** nhưng phải mượt.

Khảo sát hiện trạng (`frontend/src`):
- **Kính mờ "giả":** đã tắt hết `backdrop-filter` (commit f75fc10) nên sidebar/header thành khối navy đặc (`#0f172a` / `#111c34` – 2 màu lệch nhau) đè lên nền gradient tím → không còn chất kính, chỉ còn nặng nề.
- **Nền:** `AmbientCanvas` + `features/theme/ambient.presets.ts` dùng gradient 6 lớp radial và **ảnh Unsplash 1600px tải từ mạng** (chậm, nháy, phụ thuộc internet). `components/layout/AmbientCanvas.tsx` import `features/theme` → **vi phạm hướng phụ thuộc** của CLAUDE.md.
- **CSS đánh nhau với antd:** `styles/global.css` 663 dòng, **227 `!important`**, còn class chết (`.apple-frosted-*`, `.bitrix-stream-card`, `.bitrix-date-badge`…). Token antd (`app/config/theme.ts`) nói một kiểu (màu Apple `#34c759`, `#1d1d1f`), CSS nói kiểu khác (Tailwind slate `#16a34a`, `#0f172a`).
- **Gây lag:** selector `:has()` trên **mọi ô bảng** (`.ant-table-cell:has(.action-btn)`, `[class*="action-btn"]`) → tính lại style toàn bảng mỗi lần hover/render; `transition: all` + `!important` trên menu/tabs; 682 inline `style={{}}`.
- **Màu nhấn lệch:** nút chính đen `#0f172a`, mobile + `theme-color` xanh `#1677ff`.
- **Font:** khai báo `Inter` nhưng không nạp file → mỗi máy một kiểu chữ.
- Nút thao tác bảng: ô 30×30 nền pha màu + viền màu cho cả 4 nút → rối mắt.

Quyết định đã chốt với người dùng: phong cách **sidebar kính mờ Bitrix**, phạm vi **toàn bộ admin + mobile /qc**, **tự host Inter** (`@fontsource-variable/inter`). Màu nhấn không có ưu tiên → chọn **xanh dương `#2563eb`** để đồng bộ admin & mobile.

## Ảnh mẫu người dùng chọn (18/11/2026)
Người dùng gửi ảnh tham khảo (một trang "Nhập kho" của phần mềm khác) và muốn giao diện **"tựa như này"**. Chỉ lấy **phong cách**; không chép logo, tên hay bố cục nhận diện của sản phẩm đó. Những đặc điểm cần đạt:

| Vùng | Đặc điểm cần đạt |
|---|---|
| Nền | Ảnh chụp thật phủ kín màn hình (gợi ý: ảnh bếp/nhà hàng/nguyên liệu, hợp nghiệp vụ KSVH), **tự host**, có bản quyền phù hợp |
| Sidebar | Kính mờ thấy màu ảnh nền xuyên qua; logo + tên + dòng phụ ở trên; mục menu chữ trắng 15px, icon nét mảnh; **mục đang chọn = viên kính sáng hơn có viền trắng mảnh**; menu con thụt lề, mũi tên ^/v; dưới cùng là **thẻ kính hồ sơ** (avatar tròn màu, tên, badge vai trò dạng pill, nút cài đặt) + dòng phiên bản Web/API chữ nhỏ |
| Header | Cũng là kính trong suốt trên ảnh (không có khối màu đặc); nút hamburger vuông bo góc dạng kính; bên phải là các **pill kính**: chọn nhà hàng/công ty ("Tất cả nhà hàng"), "Hướng dẫn", chuông thông báo tròn |
| Nội dung | **Không có lớp nền xám phủ**; các khối trắng **bo góc lớn (~20px)** nổi thẳng trên ảnh, cách nhau ~20px, bóng rất nhẹ |
| Khối tiêu đề trang | Thanh nhấn dọc màu primary bên trái tiêu đề (22px/700) + dòng mô tả xám; bên phải nút **dạng pill nền xám nhạt** (Xuất Excel có icon xanh lá, Tải file mẫu, Import Excel), nút chính "Thêm …" pill có icon + chữ đậm |
| Khối lọc | Một hàng: pill khoảng ngày ("Tháng này · 01/11 – 30/11/2026" có icon lịch), ô tìm kiếm pill nền xám chiếm phần còn lại, nút "Bộ lọc" pill |
| Bảng | Header chữ thường đậm vừa 15px, không viết HOA, có icon sắp xếp; dòng cao thoáng (~46px), chỉ có đường kẻ ngang mảnh; **mã phiếu dùng font mono**; cột nhà hàng = link xanh có icon + dòng phụ xám; số căn phải |
| Nút thao tác | Ô vuông ~36px bo 10px **nền pha màu nhạt, không viền**: Xem (xanh dương), In (xám), Sửa (cam), Xoá (đỏ); cột "Thao tác" ghim phải |

→ Phần "Hướng thiết kế" và các bước dưới đây đã chỉnh theo bảng này. Chỗ nào khác với bảng thì **làm theo bảng**.

## Đặc tả nền Header & Sidebar (đã chốt: trong suốt kiểu kính)
Header và sidebar **không có màu nền đặc**: nhìn xuyên thấy ảnh nền, nhưng ảnh phía sau **bị làm mờ và tối đi một chút** để chữ trắng luôn đọc rõ. Nếu trong suốt 100% mà không làm mờ thì gặp ảnh nhiều chi tiết (rau củ, đèn) chữ menu sẽ lẫn vào ảnh.

Thông số cụ thể (lớp `.glass-chrome`, dùng chung cho sidebar, header, drawer sidebar trên màn nhỏ):

| Thuộc tính | Giá trị |
|---|---|
| Nền chính | `transparent`; KHÔNG dùng `#0f172a`/`#111c34` |
| Lớp ảnh mờ (`::before`) | bản ảnh nền đã làm mờ sẵn (blur ~24px), `background-attachment: fixed; background-size: cover; background-position: center` để khớp đúng vị trí ảnh nền phía sau |
| Lớp phủ tối (`::after`) | sidebar `linear-gradient(180deg, rgba(0,0,0,.28), rgba(0,0,0,.18))`; header `rgba(0,0,0,.22)`; cộng thêm giá trị thanh trượt "độ tối" người dùng chỉnh |
| Viền | sidebar `border-right: 1px solid rgba(255,255,255,.18)`; header `border-bottom: 1px solid rgba(255,255,255,.18)` |
| Bóng | không có (giữ cảm giác phẳng như ảnh mẫu) |
| Chữ / icon | `#fff` cho mục chính, `rgba(255,255,255,.75)` cho chữ phụ; `text-shadow: 0 1px 2px rgba(0,0,0,.25)` |
| Mục menu hover | nền `rgba(255,255,255,.12)` |
| Mục menu đang chọn | nền `rgba(255,255,255,.22)` + viền `1px solid rgba(255,255,255,.35)`, bo 12px |
| Nút trên header (hamburger, pill) | nền `rgba(255,255,255,.14)`, viền `rgba(255,255,255,.28)`, hover `.22` |
| Thẻ hồ sơ đáy sidebar | nền `rgba(255,255,255,.12)`, viền `rgba(255,255,255,.22)`, bo 14px |
| Fallback | trình duyệt không tải được ảnh mờ → nền `rgba(15,23,42,.55)` (vẫn đọc được chữ) |

Hiệu năng: **không** dùng `backdrop-filter` (đây là nguyên nhân lag trước đây). Vì phía sau sidebar/header chỉ có ảnh nền tĩnh, ảnh mờ dựng sẵn cho kết quả nhìn giống hệt mà gần như không tốn GPU. Header dính trên cùng khi cuộn: nội dung cuộn **chui dưới** header, header vẫn chỉ hiển thị ảnh nền mờ (giống ảnh mẫu), không làm mờ nội dung đang cuộn.

## Hướng thiết kế
- **Khung:** ảnh nền thật toàn màn hình; **sidebar + header là kính** (trong mờ, viền sáng mảnh); **vùng nội dung là các khối trắng bo góc lớn nổi thẳng trên ảnh** (bảng, form dễ đọc, không blur).
- **Kính mờ không lag – "pre-blurred glass":** không dùng `backdrop-filter` trên nội dung cuộn. Thay vào đó:
  1. Hình nền được làm mờ **sẵn một lần** (ảnh `*-blur.webp` sinh lúc build/tự host, hoặc canvas blur 1 lần rồi cache `objectURL`).
  2. Sidebar/Header vẽ lớp `::before` dùng **chính ảnh đã mờ** với `background-attachment: fixed` (khớp vị trí nền) + lớp phủ `rgba(15,23,42,.45)` + viền `rgba(255,255,255,.12)` + nhiễu nhẹ.
  → Hiệu ứng y như kính Bitrix nhưng chi phí = vẽ 1 ảnh tĩnh, 0 shader blur mỗi khung hình.
  - Tuỳ chọn "Hiệu ứng kính thật" (backdrop-filter `blur(20px) saturate(160%)` chỉ trên sidebar, vì phía sau sidebar chỉ có nền tĩnh) bật bằng `@supports` + tắt khi `prefers-reduced-transparency`/máy yếu. Mặc định dùng pre-blurred.
- **Nền – cho chọn nhiều ảnh khi chỉnh giao diện (yêu cầu người dùng 18/11/2026):**
  - **Thư viện ảnh có sẵn:** khoảng 12 ảnh chụp thật, **tự host** trong `public/backgrounds/`. Mỗi ảnh có 3 bản: ảnh chính webp ~150–250KB, bản đã làm mờ ~20KB, thumbnail ~10KB. Chia nhóm (Nhà hàng & bếp, Nguyên liệu, Thiên nhiên, Thành phố, Tối giản/gradient) bằng `Segmented`/tab trong `ThemeModal`. Bỏ toàn bộ URL Unsplash.
  - **Ảnh của tôi:** người dùng **tải lên nhiều ảnh cùng lúc** (`Upload` `multiple`, chỉ nhận jpg/png/webp, ≤ 5MB/ảnh, tối đa 10 ảnh). Mỗi ảnh được nén về webp ≤ 1920px bằng `browser-image-compression` (thư viện đã có sẵn), sinh bản mờ + thumbnail bằng canvas, rồi **lưu trong IndexedDB của trình duyệt** (localStorage không chứa nổi ảnh). Không gửi lên server, không đi qua S3, vì đây không phải ảnh bằng chứng. Có nút xoá từng ảnh.
  - **Lưới chọn:** thumbnail dạng lưới 3–4 cột, ảnh đang dùng có viền primary + dấu ✓, **bấm là đổi nền ngay** (xem trước trực tiếp sau modal), có nút "Khôi phục mặc định".
  - **Tuỳ chọn thêm:** thanh trượt độ tối lớp phủ (0–40%) để chữ sidebar luôn đọc rõ; công tắc **"Tự đổi ảnh"** (xoay vòng các ảnh đã đánh dấu yêu thích mỗi lần đăng nhập hoặc mỗi N phút). Đổi ảnh dùng crossfade 2 lớp `opacity` (không `transition` trên `background-image`) và tải trước ảnh kế tiếp.
  - Store `ambient.store.ts` (key `ksvh-ambient-theme-v4`) chỉ lưu `selectedId`, `favorites[]`, `overlay`, `autoRotate`; dữ liệu ảnh nằm trong IndexedDB và được tham chiếu theo id. Tách `useBackgroundLibrary()` (đọc/ghi IndexedDB, mỗi hook < 150 dòng); `ThemeModal` tách thành `BackgroundGallery`, `BackgroundUploader`, `BackgroundOptions` để mỗi file ≤ 250 dòng.
- **Màu & chữ:** primary `#2563eb`; thang xám slate; trạng thái thống nhất (success `#16a34a`, warning `#d97706`, danger `#dc2626`, info `#0284c7`). Inter variable, thang chữ 12/13/14/16/20/24, `font-feature-settings: 'cv11','ss01'`, số dùng `tabular-nums`.
- **Nút:** nút trên trang dạng **pill** (bo 999px, cao 40) nền `#f1f5f9`, chữ đậm; nút chính cùng kiểu pill, chữ đậm + icon "+" (biến thể primary xanh đặc dùng trong modal/form); cao 44 trên mobile. **Nút thao tác bảng:** ô 36×36 bo 10, nền pha màu nhạt **không viền**, icon màu theo nghĩa (xem xanh, in xám, sửa cam, xoá đỏ), hover đậm màu nền hơn. Hành động phụ gom vào menu "⋯" khi > 4 nút.
- **Font mono** (`ui-monospace, 'SF Mono', Menlo`) cho mã phiếu/mã nhà hàng: class `.app-code`.
- **UX:** header kính có pill chọn công ty/nhà hàng, "Hướng dẫn", chuông; tiêu đề trang nằm trong khối tiêu đề (không nhồi breadcrumb lên header); `PageContainer` thống nhất tiêu đề/mô tả/nút; empty/loading/error state đồng nhất (skeleton thay spinner); bảng thoáng, header không viết HOA.

## Các bước thực hiện

### 1. Nền tảng design token (quan trọng nhất – mọi trang đẹp lên tự động)
- `src/app/config/theme.ts`: viết lại toàn bộ token antd (colorPrimary `#2563eb`, màu trạng thái, `fontFamily: 'Inter Variable', …`, `fontSize: 14`, `borderRadius: 8`, `controlHeight: 34`) + component tokens Button/Table/Menu/Card/Tabs/Input/Modal/Tag. **Mục tiêu: dời style từ CSS `!important` sang token.**
- Tách `src/styles/global.css` thành: `tokens.css` (biến CSS), `base.css` (reset, font, scrollbar, focus), `glass.css` (sidebar/header kính), `utilities.css` (`.app-subtext`…). Xoá class chết (`apple-frosted-*`, `bitrix-stream-card`, `bitrix-right-widget`, `bitrix-date-badge*`). Mục tiêu < 40 `!important`.
- Xoá selector `:has()` trên ô bảng; cột thao tác dùng `className`/`fixed` + `width` khai báo trong `DataTable`.
- Thay `transition: all` bằng thuộc tính cụ thể (`background-color, color`).
- `main.tsx`: `import '@fontsource-variable/inter'` (cần `npm i @fontsource-variable/inter` – người dùng đã đồng ý). `index.html`: `theme-color` đồng bộ.
- antd-mobile: biến `--adm-color-primary`, `--adm-font-family` khớp token.

### 2. Khung admin kính Bitrix
- `src/components/layout/AmbientCanvas.tsx` → nhận `background` qua props (bỏ import `features/theme`, ghép ở `app/router/shells.tsx`) – sửa vi phạm phụ thuộc.
- `src/features/theme/ambient.presets.ts`: preset tự host `{ id, name, image, blurImage, thumbnail }`; thêm `useBlurredImage(url)` (canvas blur 1 lần, cache) cho ảnh tuỳ chỉnh; bump key store `ksvh-ambient-theme-v4`.
- `public/backgrounds/`: ảnh nền đã nén + bản blur + thumbnail (**cần ảnh chụp thật** như ảnh mẫu: người dùng cung cấp hoặc lấy ảnh có giấy phép miễn phí (Unsplash/Pexels license), tải về, nén webp ≤ 250KB rồi tự host; ảnh mặc định nên là chủ đề nhà hàng/nguyên liệu).
- `AdminLayout.tsx`, `Sidebar.tsx`, `SidebarProfile.tsx`, `AppHeader.tsx`: dùng class `.glass-chrome` (pre-blurred), bỏ inline style lặp; sidebar ~280px/76px khi thu gọn; mục chọn = viên kính `rgba(255,255,255,.22)` + viền `rgba(255,255,255,.35)`; menu con thụt lề; thẻ kính hồ sơ + badge vai trò + dòng phiên bản ở đáy. Header 64px kính: hamburger vuông kính, bên phải các pill kính (chọn công ty/nhà hàng nếu có API sẵn, nếu chưa thì bỏ qua, không bịa nghiệp vụ; "Hướng dẫn"; chuông `NotificationBell`).
- Vùng nội dung: **không phủ nền**; khối trắng `rgba(255,255,255,.96)` bo 20px, `box-shadow: 0 8px 24px rgba(0,0,0,.08)`, khoảng cách 20px. Ảnh nền cần đủ "dịu" (lớp phủ tối 15–25% trên chính ảnh nền) để chữ trắng sidebar luôn đọc rõ.

### 3. Design system components (`src/components/`)
- `TableActions.tsx` / `ActionButton`: ô 36×36 nền pha màu không viền (giữ cơ chế `--tint`), thêm tone `print`; prop `overflow` gom nút thừa vào `Dropdown`.
- `DataTable.tsx`, `TableCard.tsx`, `AdvancedFilter.tsx`, `FilterBar.tsx`: khối bộ lọc một hàng (pill khoảng ngày + ô tìm pill + nút "Bộ lọc" mở bộ lọc nâng cao); header bảng 14–15px chữ thường; cột thao tác ghim phải.
- `PageContainer.tsx`: khối tiêu đề trắng bo 20px, thanh nhấn dọc primary, tiêu đề 22px/700, mô tả, `extra` nút pill (`ExcelActions` theo cùng kiểu pill).
- `KpiCard.tsx`, `StatisticCard.tsx`, `StatusBadge.tsx`, `SeverityTag.tsx`: chuyển inline style sang class; tag dạng "dot + chữ" thay hộp màu đậm.
- `EmptyState`, `LoadingState` (skeleton), `ErrorState`: thống nhất.
- `charts/chart-theme.ts`: bảng màu biểu đồ khớp token mới, font Inter.

### 4. Các trang admin (áp dụng mẫu, không đổi logic/API)
Lần lượt: `auth/LoginPage` (nền ảnh + thẻ kính đăng nhập), `dashboard`, `inspections/pages/admin` (4 trang, gồm luồng duyệt), `criteria` (5), `organizations` (3), `reports`, `users`, `roles`, `employees`, `audit`, `notifications`, `ThemeModal`. Mỗi trang: dùng `PageContainer`, `TableCard`, `TableActions`; gỡ inline style lặp lại thành class/utility; giữ file ≤ 250 dòng (oxlint). `InspectionPrintDocument` (in ấn) giữ nguyên style in.

### 5. Mobile `/qc`
- `MobileLayout.tsx`: nền `--app-surface-sunken`, NavBar trắng có bóng mảnh, TabBar có màu primary, safe-area đúng.
- `features/inspections/pages/mobile` + `components/mobile/*` (`MobileFindingCard`, `InspectionCriterionCard`…): thẻ tiêu chí rõ ràng, nút Đạt/Không đạt/N/A lớn 44px dạng segmented màu theo nghĩa, khu vực ảnh bằng chứng dạng lưới, thanh hành động chính `block` dính đáy.
- Không đụng `useGeolocation` / `usePhotoCapture` / logic chấm.

### 6. Dọn & đo hiệu năng
- Kiểm tra bằng Chrome DevTools Performance: cuộn bảng 50 dòng, mở/đóng sidebar, hover menu → mục tiêu không có "Recalculate Style" > 8ms, 60fps.
- Chỉ chụp ảnh nền khi đổi preset; không `transition` trên `background-image`.

## File quan trọng
`frontend/src/app/config/theme.ts`, `frontend/src/styles/global.css` (→ tách file), `frontend/src/components/layout/{AdminLayout,AmbientCanvas,Sidebar,SidebarProfile,AppHeader,MobileLayout,PageContainer}.tsx`, `frontend/src/components/data-display/{TableActions,DataTable,TableCard,KpiCard,StatusBadge}.tsx`, `frontend/src/features/theme/*`, `frontend/src/app/router/shells.tsx`, `frontend/src/main.tsx`, `frontend/index.html`.

Lưu ý: working tree đang có thay đổi chưa commit (TableActions, FindingActionButtons, global.css…) – làm tiếp trên đó, không ghi đè mất.

## Kiểm tra
1. `cd frontend && npm run typecheck && npm run lint && npm run build` – phải pass.
2. Chạy backend :8088 + `npm run dev:http` (cổng 5273), mở preview trong browser pane: đăng nhập, duyệt dashboard, danh sách nhà hàng, tiêu chí, phiếu chấm, báo cáo; chụp ảnh trước/sau.
3. Mở modal giao diện: đổi qua 3–4 ảnh có sẵn, tải lên cùng lúc 3 ảnh của mình, tải lại trang (ảnh vẫn còn), xoá 1 ảnh, bật "Tự đổi ảnh" → sidebar/header kính luôn khớp nền, chuyển ảnh mượt, không nháy.
4. Performance trace khi cuộn bảng/hover menu (đo bằng `javascript_tool` + `performance` API): không long task > 50ms do style.
5. `resize_window` mobile (375×812) → kiểm tra `/qc`: check-in, chấm tiêu chí, chụp ảnh, gửi phiếu.
6. Chạy agent `code-reviewer` trước khi đề xuất commit.
