# Kế hoạch tối ưu KSVH QC

Lập 17/11/2026 từ số đo thật trong repo. Làm **sau** `PLAN_FIX_FLOW_REVIEW.md` và `PLAN_REMAINING_GAPS.md`.
Nguyên tắc chung: **không đổi hành vi nghiệp vụ** (trừ Plan O4 – có ghi rõ), mỗi plan một nhánh/commit riêng, trước và sau đều chạy
`cd backend && ./mvnw -q verify` + `cd frontend && npm run typecheck && npm run lint && npm run build`. Không thêm thư viện lớn khi chưa hỏi người dùng.

## Số đo hiện tại (để so sánh khi xong)
| Chỉ số | Hiện tại | Mục tiêu | Trạng thái |
|---|---|---|---|
| `vendor-antd` (gzip) | 1.457 kB (461 kB) | < 900 kB (< 300 kB) | Chờ Plan O5 |
| `vendor-echarts` (gzip) | 516 kB (172 kB) | < 250 kB (< 90 kB), chỉ tải ở trang có biểu đồ | Chờ Plan O5 |
| `InspectionService.java` / `FindingService.java` | 873 / 693 dòng | mỗi lớp < 300 dòng | Chờ Plan O1 |
| `ReportService` / `PdfExportService` / `InspectionPlanService` | 519 / 485 / 429 dòng | < 300 dòng | Chờ Plan O1 |
| File frontend sát giới hạn 250 dòng | 0 file ≥ 200 dòng trong số 10 file mục tiêu | không file nào > 200 dòng | **ĐÃ XONG (O2.3)** |
| Bảng trạng thái (`STATUS_TAG`/`STATUS_TABS`/`ACTION_META`) chép lại | 1 chỗ (`constants/status.ts`) | 1 chỗ | **ĐÃ XONG (O2.1)** |
| Kiểu dữ liệu viết tay `inspection.types.ts` | Alias từ `api.generated.ts` | lấy từ `api.generated.ts` | **ĐÃ XONG (O2.2)** |
| API layer URL rải rác | 1 hằng `PATH` tập trung | tập trung 1 chỗ | **ĐÃ XONG (O2.4)** |

---

## Plan O1 – Tối ưu code backend
1. **Tách lớp service quá dài** (giữ API công khai, chỉ chuyển code):
   - `InspectionService` → `InspectionQueryService` (search, get, my-tasks, toResponse), `InspectionCreationService` (create, batch, từ kế hoạch,
     đột xuất, kiểm tra khắc phục), `InspectionExecutionService` (checkin, submit, acknowledge, cancel), `FindingFactory` (sinh lỗi + tính rủi ro khi gửi phiếu).
   - `FindingService` → `FindingQueryService`, `FindingResponseService` (confirm, appeal, review, conclude), `FindingRemediationService`
     (kế hoạch, bằng chứng, nghiệm thu, quá hạn). Các khối lặp (`transition`, `reassess`, `addOccurrence`, đổi hạn vòng mới) gom vào `FindingLifecycle`.
   - `ReportService` → mỗi báo cáo một lớp truy vấn; `PdfExportService` → `PdfLayout` dùng chung (font, header, bảng) + 2 lớp xuất.
2. **Bỏ lặp kiểm tra quyền/trạng thái**: gom `requireStatus`, kiểm tra kế hoạch đã duyệt (đang lặp ở create và createBatch), kiểm tra CHT vào
   `InspectionAccess` / helper riêng.
3. **Thông điệp & hằng số**: các chuỗi lỗi tiếng Việt lặp lại → hằng số trong lớp `Messages` của module; số ma (99 phiếu/tháng, 2–5 người thẩm định,
   20 ảnh) → cấu hình `@ConfigurationProperties` có giá trị mặc định.
4. **Kiểu & null**: DTO dùng `@Schema(nullable = true)` thống nhất; bỏ `Optional` trả về null; `record` cho mọi kết quả nội bộ.
5. **Kiểm tra**: `./mvnw -q verify` qua, `ModularityTest` qua; không đổi file OpenAPI (so `v3/api-docs` trước/sau bằng `diff`).

## Plan O2 – Tối ưu code frontend
1. **Một nguồn cho trạng thái**: tạo `features/inspections/constants/status.ts` (nhãn + màu cho Plan/Inspection/Finding/Event, dùng biến
   `--app-*`/tone `success|processing|warning|error|default`); thay 7 chỗ đang chép (`PlanTable`, `FindingTable`, `InspectionTable`,
   `FindingTimeline`, `PlanDetailModal`, `MobileFindingCard`, `InspectionListPage`). Dùng `StatusBadge` sẵn có.
2. **Kiểu dữ liệu lấy từ API**: `inspection.types.ts` (21 export viết tay) → alias từ `@/types/api.generated` (`Schemas['InspectionResponse']`…),
   như quy ước `frontend/CLAUDE.md`. Sửa lỗi type phát sinh.
3. **Tách file sát giới hạn** (≥ 230 dòng): `TemplateFormModal`, `BatchCriterionModal`, `InspectionPrintDocument`, `InspectionBatchForm`,
   `FindingActionModal` (mỗi hành động một form con), `InspectionExecutionPage` (tách `useInspectionDraft`, `ExecutionHeader`, `SubmitBar`),
   `InspectionListPage`, `useInspectionData.ts` (tách theo plan / inspection / finding), `RestaurantRiskProfileTab`, `InspectionSingleForm`.
4. **API layer**: mọi URL vào hằng `PATH` ở đầu `*.api.ts` (hiện `inspection.api.ts` viết đường dẫn rải rác) – theo `frontend/CLAUDE.md`.
5. **Style inline → class/biến**: các style lặp (thẻ mobile, dòng phụ xám 12px) → class trong `styles/` dùng biến `--app-*`.
6. **Kiểm tra**: typecheck/lint/build qua; giao diện không đổi (chụp màn hình các trang chính trước/sau).

## Plan O3 – Tối ưu giao diện (UI/UX)
1. **Nhất quán**: mọi trang danh sách = `PageContainer` + `AdvancedFilter` + `TableCard`/`DataTable`; mọi nút thao tác dùng `TableActions`;
   tag trạng thái dùng bảng chung (O2.1). Rà trang Báo cáo, Nhật ký, Thông báo, Hồ sơ rủi ro theo chuẩn này.
2. **Trạng thái rỗng / đang tải / lỗi**: mọi bảng có `EmptyState` có hướng dẫn hành động ("Chưa có kế hoạch – bấm Tạo kế hoạch"), skeleton khi tải,
   `ErrorState` có nút thử lại.
3. **Form**: nhãn + gợi ý ngắn, báo lỗi tại trường (đã có `applyFieldErrors`), nút chính cố định cuối modal, phím Enter để lưu; form dài (kế hoạch có
   phân công) chia bước hoặc bảng sửa nhanh.
4. **Màn hình hẹp & điện thoại**: kiểm tra 375px/768px cho `/admin` (bảng cuộn ngang có cột thao tác cố định, bộ lọc xếp gọn) và `/qc`
   (nút lớn ≥ 44px, thanh gửi cố định, không tràn chữ).
5. **Khả năng tiếp cận**: `aria-label` cho nút chỉ có icon, độ tương phản chữ trên nền kính ≥ 4.5:1 (đặc biệt trên ảnh nền sáng), focus thấy rõ.
6. **Dashboard**: mỗi thẻ số bấm sang báo cáo chi tiết với bộ lọc tương ứng; biểu đồ có chú thích và đơn vị.
7. **Kiểm tra**: chụp màn hình trước/sau từng trang (desktop + 375px), không còn lỗi console.

## Plan O4 – Tối ưu luồng nghiệp vụ (có đổi hành vi – hỏi người dùng từng mục)
1. **Giảm thao tác CHT**: xác nhận nhiều lỗi một lần (chọn nhiều → Xác nhận); lập kế hoạch khắc phục cho nhiều lỗi cùng ngày hẹn.
2. **Kế hoạch tháng nhanh**: nút "Sao chép kế hoạch tháng trước" (giữ nhà hàng / chuyên viên / mẫu, đổi ngày); import phân công từ Excel; cảnh báo
   nhà hàng còn lỗi chưa xác minh ngay trong form (đã có API cảnh báo – đưa lên giao diện).
3. **Chuyên viên**: danh sách việc theo ngày dự kiến; nghiệm thu nhiều lỗi của cùng nhà hàng trong một màn; nhắc phiếu được giao quá ngày dự kiến
   chưa bắt đầu.
4. **Quản lý**: hàng chờ duyệt (kế hoạch chờ duyệt, khiếu nại cần họp) trên dashboard; duyệt kế hoạch xem trước số phiếu sẽ sinh.
5. **Thông báo**: gộp nhiều sự kiện cùng loại trong 1 giờ thành 1 thông báo; link mở đúng mục cần thao tác.
6. **Kiểm tra**: test API cho thao tác hàng loạt (mỗi lỗi vẫn ghi `finding_events` riêng – quy tắc 4); đếm số bước trước/sau cho 6 bước PDF.

## Plan O5 – Tối ưu hiệu năng
**Frontend**
1. **antd 1,46 MB**: kiểm tra trang `/qc` có tải `vendor-antd` không (chỉ nên tải `antd-mobile`) → tách chunk theo khu vực `/admin` và `/qc`
   trong `vite.config.ts` (`manualChunks` theo đường dẫn), lazy-load modal/drawer nặng (in phiếu, form kế hoạch, chọn ảnh nền).
2. **echarts 516 KB**: chuyển sang import theo module `echarts/core` + chỉ các chart/component đang dùng (bar, line, pie, grid, tooltip, legend);
   chỉ tải ở Dashboard/Báo cáo (lazy).
3. **Ảnh nền**: ảnh Unsplash 2400px → kích thước theo màn hình (`w=1600`, `fm=webp`), `loading` sau khi trang đã hiển thị; thumbnail chỉ tải khi mở
   hộp chọn giao diện.
4. **TanStack Query**: đặt `staleTime` hợp lý cho danh mục ít đổi (công ty, nhà hàng, mẫu phiếu, cấu hình rủi ro: 5 phút); chuông thông báo
   poll 60s chỉ khi tab đang hiện (`refetchIntervalInBackground: false`).
5. **Danh sách dài**: bảng > 200 dòng không phân trang (Quyền, Nhóm tiêu chí trong modal) → phân trang hoặc ảo hoá.
**Backend**
6. **N+1 & truy vấn lặp**: bật `spring.jpa.properties.hibernate.generate_statistics` khi test, đếm số câu SQL cho: danh sách phiếu, danh sách lỗi,
   chi tiết kế hoạch, báo cáo → mục tiêu số câu không tăng theo số dòng (gom `findAllById`, `findSummaries`, `findRefs` một lần).
   Điểm nghi vấn: `FindingService` gọi `inspectionRepository.findById` lặp lại (dòng ~636, 651, 686) trong cùng request.
7. **Index cho báo cáo**: chạy `EXPLAIN ANALYZE` 5 truy vấn báo cáo + dashboard với dữ liệu giả lập (vd 50 nhà hàng × 12 tháng × 70 tiêu chí);
   thêm index thiếu bằng migration mới (ứng viên: `findings(restaurant_id, created_at)`, `findings(criterion_id, created_at)`,
   `inspections(status, submitted_at)`, `finding_occurrences(restaurant_id, criterion_id, occurred_at)`).
8. **Job**: `FindingOverdueJob`/`FindingReminderJob` xử lý theo lô (vd 200 lỗi/lần) và mỗi lô một transaction, để một lỗi hỏng không chặn cả job.
9. **Xuất file**: Excel dùng streaming (`SXSSFWorkbook`) cho báo cáo lớn; PDF/Excel lớn chạy nền + tải về khi xong nếu > 10.000 dòng.
10. **Kiểm tra**: số đo bundle sau build; thời gian phản hồi API danh sách/báo cáo với dữ liệu giả lập (ghi bảng trước/sau vào PR).

---

## Thứ tự đề xuất
O2.1–O2.2 (nhanh, giảm lỗi) → O1 (tách service, dễ bảo trì) → O5 (hiệu năng, có số đo) → O3 (giao diện) → O4 (luồng – cần người dùng duyệt từng mục).
Mỗi plan xong: cập nhật bảng "Số đo hiện tại" ở đầu file với số mới.

---

## Plan O0 – Sửa trước khi tối ưu (bổ sung 17/11/2026 sau khi rà commit `297008f`) · Ưu tiên CAO, làm TRƯỚC O1–O5
Rà lại: 104/104 test backend qua, frontend build qua. Còn 2 lỗi nhỏ + 1 chỗ tài liệu sai.

### O0.1 – Service worker giữ bản cũ sau khi triển khai (LỖI)
- File: `frontend/public/sw.js`, `frontend/index.html`.
- Hiện tượng: `STATIC_ASSETS` chứa `'/'` và `'/index.html'` → nhánh cache-first chạy **trước** nhánh `navigate`, nên mở `/` luôn nhận `index.html` cũ;
  tên cache cố định `ksvh-qc-static-v1` không đổi theo bản build → người dùng kẹt ở bản cũ sau mỗi lần triển khai cho tới khi tự xoá cache.
  Service worker còn được đăng ký cả khi chạy dev (`npm run dev` / localhost) gây khó hiểu khi code.
- Sửa:
  1. Bỏ `'/'`, `'/index.html'` khỏi danh sách cache-first. Mọi yêu cầu `mode === 'navigate'` (và `index.html`) dùng **network-first**,
     chỉ lấy cache khi mất mạng; khi tải mạng thành công thì cập nhật bản `index.html` trong cache để dùng lúc offline.
  2. `/assets/*` (tên file có hash) giữ cache-first như cũ.
  3. Tên cache gắn phiên bản build: sinh `sw.js` lúc build hoặc chèn `__BUILD_ID__` (vd hash/ thời điểm build qua plugin nhỏ trong `vite.config.ts`);
     `activate` xoá cache cũ (đã có).
  4. Không đăng ký service worker ở dev: chỉ đăng ký khi `import.meta.env.PROD` (chuyển đoạn đăng ký sang `src/main.tsx` hoặc file
     `public/register-sw.js` – xem O0.2 vì CSP chặn script inline).
- Kiểm tra: build 2 lần liên tiếp có thay đổi code → mở `/` lần 2 nhận bản mới (DevTools → Application → Service Workers / Cache);
  tắt mạng → điều hướng `/qc` vẫn mở được giao diện.

### O0.2 – CSP chưa áp cho trang web thật (BẢO MẬT)
- Hiện tượng: CSP chỉ đặt trong `backend/.../security/SecurityConfig.java` → chỉ gắn vào phản hồi API JSON. Trang HTML do nginx phục vụ
  (`frontend/nginx.conf`) chỉ có `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection` – **không có CSP**.
- Sửa:
  1. Thêm vào `frontend/nginx.conf` (khối phục vụ SPA, `always`):
     `Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; font-src 'self' data:; connect-src 'self' https:; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'"`
     (`style-src 'unsafe-inline'` cần cho antd/style inline; `img-src https:` cho ảnh nền Unsplash và ảnh MinIO; `media-src` cho video bằng chứng).
     Nếu MinIO/ảnh dùng domain cụ thể, thay `https:` bằng domain đó.
  2. Thêm `Referrer-Policy "strict-origin-when-cross-origin"` và `Strict-Transport-Security` (khi chạy HTTPS) vào nginx; bỏ `X-XSS-Protection` (đã lỗi thời).
  3. Script đăng ký service worker đang **inline** trong `index.html` → bị `script-src 'self'` chặn: chuyển sang `src/main.tsx` (chỉ khi PROD) theo O0.1.
- Kiểm tra: chạy bản build qua docker-compose/nginx, mở `/admin` và `/qc`: không có lỗi CSP trong console (ảnh nền, ảnh/video bằng chứng,
  xuất PDF/Excel, đăng nhập, chuông thông báo đều chạy); `curl -I` trang chủ thấy header CSP.

### O0.3 – Tài liệu tài khoản thử
- Báo cáo trước ghi sai tài khoản (`lead / Admin@123`, `auditor1`, `store1`). Tài khoản đúng theo `backend/src/main/resources/application-dev.yml`:
  `admin / Admin@123` (đa vai trò trên máy dev), `bizadmin / Bizadmin@123`, `lead / Lead@123`, `manager / Manager@123`,
  `inspector / Inspector@123`, `store / Store@123`, `obm / Obm@123`, `executive / Executive@123`.
- Sửa mọi tài liệu có nhắc tài khoản (README, `docs/UAT_CHECKLIST.md`, …) cho khớp. Lưu ý: tài khoản dev chỉ tạo khi username chưa tồn tại,
  nên đổi vai trò trong yml không tự cập nhật user đã có trong DB – ghi chú điều này trong README.

### Hoàn thành O0 khi
`cd backend && ./mvnw -q verify` + `cd frontend && npm run typecheck && npm run lint && npm run build` qua; kiểm tra thủ công O0.1/O0.2 như trên;
commit riêng: `fix(pwa): network-first app shell and versioned cache`, `fix(security): add CSP and security headers to nginx`, `docs: correct dev test accounts`.
