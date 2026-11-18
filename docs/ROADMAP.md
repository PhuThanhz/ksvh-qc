# Lộ trình hoàn thiện phần mềm KSVH QC

Lập 17/11/2026. Mỗi **Plan** là một đợt làm độc lập: có mục tiêu, việc cần làm, điều kiện "xong". Làm theo thứ tự ưu tiên.
Trước mỗi plan: đọc `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`, `docs/DOMAIN_SPEC.md`. Đổi schema = migration Flyway mới.
Kiểm tra chung khi xong: `cd backend && ./mvnw -q verify` + `cd frontend && npm run typecheck && npm run lint && npm run build`;
đổi API → sinh lại `npm run api:types` (backend tạm cổng 8099 nếu 8088 đang bận).

## Hiện trạng (đã có)
Đăng nhập + 8 vai trò/permission · tổ chức, nhân viên, người dùng (+ Excel) · danh mục 5–9 (nhóm, tiêu chí, mẫu phiếu, bảng mức, tần suất 1–24 tháng,
nâng mức; phiên bản theo ngày hiệu lực, chặn bản trùng) · kế hoạch có phân công, duyệt tự tạo phiếu · chấm trên điện thoại (GPS ghi nhận,
ảnh có watermark, server xác nhận ảnh) · lỗi: xác nhận / khiếu nại (1 người chốt) / khắc phục / nghiệm thu · job quá hạn +1 · CHT xác nhận phiếu
không lỗi · bộ tính rủi ro (RiskCalculator) · dashboard cơ bản · in phiếu.

---

## Plan 1 – Khiếu nại nhiều người thẩm định (PDF s.12) · Ưu tiên CAO – ĐÃ HOÀN THÀNH (17/11/2026)
- Migration `V20261117_1400__appeal_reviews_and_meeting.sql`: bảng `appeal_reviews`, trạng thái lỗi `APPEAL_MEETING`, action `APPEAL_REVIEWED`, `APPEAL_MEETING`.
- Backend:
  - Khiếu nại chọn $N \in [2, 5]$ người thẩm định từ danh sách ứng viên (KSVH + OBM của nhà hàng, loại trừ chuyên viên đã chấm lỗi, bắt buộc có $\ge 1$ đại diện KSVH).
  - Từng thẩm định viên đánh giá qua `POST /findings/{id}/appeal-reviews` (`FINDING_VALID` / `FINDING_INVALID` kèm comment).
  - Tự động chốt khi đủ phiếu: 100% đồng thuận bỏ lỗi → `DISMISSED` (tiêu chí chuyển sang `PASS`), 100% đồng thuận giữ lỗi → `CONFIRMED` (+1 tần suất), bất đồng ý kiến → `APPEAL_MEETING`.
  - Quản lý KSVH chủ trì họp và kết luận qua `POST /findings/{id}/conclude-appeal` (chỉ hợp lệ ở trạng thái `APPEAL_MEETING`, ghi `meetingNotes`).
  - API `GET /findings/pending-reviews` (danh sách lỗi chờ tôi thẩm định).
- Frontend:
  - Form khiếu nại chọn người thẩm định từ danh sách ứng viên (hiển thị tag KSVH/OBM, kiểm tra ràng buộc).
  - Form thẩm định khiếu nại cho thẩm định viên (nút hành động trên bảng lỗi và mobile).
  - Form kết luận họp khiếu nại cho Quản lý KSVH kèm biên bản họp.
  - Tab "Chờ tôi thẩm định" trên admin và mobile `/qc`.
  - Modal chi tiết hiển thị thẻ Hội đồng thẩm định khiếu nại (vòng, từng thẩm định viên, ý kiến, nhận xét, thời gian).
- Test: bộ test toàn diện trong `InspectionExecutionFlowTests` (đồng thuận giữ lỗi, đồng thuận bỏ lỗi, bất đồng chuyển sang họp và kết luận họp, kiểm tra quyền 403, kiểm tra validation 400). Đã verify backend và build frontend thành công.

## Plan 2 – Thông báo trong ứng dụng (PDF s.9–13) · Ưu tiên CAO – ĐÃ HOÀN THÀNH (17/11/2026)
- Module `notification`: bảng `notifications` (user_id, type, title, body, link, read_at, created_at) + index (user_id, read_at), Flyway `V20261117_1500__notifications.sql`.
- Sự kiện miền Spring (`ApplicationEventPublisher`, `@EventListener` + `@Transactional`):
  - Kế hoạch: `PlanSubmittedEvent`, `PlanApprovedEvent`, `PlanRejectedEvent`.
  - Phiếu chấm: `InspectionAssignedEvent`, `InspectionSubmittedEvent`, `FindingM4AlertEvent` (cảnh báo M4 gửi Quản lý KSVH, OBM, BGĐ).
  - Khiếu nại: `FindingAppealedEvent`, `AppealMeetingRequiredEvent`, `FindingAppealConcludedEvent`.
  - Khắc phục & Nghiệm thu: `RemediationSubmittedEvent`, `FindingVerifiedEvent`.
  - Quá hạn & Nhắc việc: `FindingOverdueEvent`, `FindingReminderDueEvent` (job `FindingReminderJob` quét 08:00 hàng ngày trước 1 ngày đến hạn).
- API:
  - `GET /api/v1/notifications` (phân trang).
  - `GET /api/v1/notifications/unread-count`.
  - `POST /api/v1/notifications/{id}/read`.
  - `POST /api/v1/notifications/read-all`.
- Frontend:
  - `NotificationBell`: Icon chuông + badge số lượng chưa đọc, popover xem danh sách thông báo và đánh dấu đã đọc.
  - Tích hợp trên Desktop Header (`AppHeader`) và Mobile Header (`MobileShell`).
  - Polling tự động mỗi 60 giây qua TanStack Query.
  - Bấm thông báo chuyển hướng tức thì tới đúng màn hình chi tiết (`link`).
- Test: integration test `NotificationFlowTests` (quyền hạn, đánh dấu đã đọc, unread count, chuyển phát sự kiện miền, job nhắc việc). ModularityTest và 78 test backend pass 100%, frontend lint/typecheck/build pass.

## Plan 3 – Báo cáo & xuất file (Excel & PDF) · Ưu tiên CAO – ĐÃ HOÀN THÀNH (17/11/2026)
- Thư viện PDF: tích hợp `com.github.librepdf:openpdf:2.0.3` (được người dùng duyệt theo TECH_STACK.md); nhúng font tiếng Việt mã nguồn mở `Be Vietnam Pro` (SIL Open Font License: `BeVietnamPro-Regular.ttf`, `BeVietnamPro-Bold.ttf`) trong `backend/src/main/resources/fonts/` (thay thế font thương mại Arial), tuân thủ 100% bản quyền và đảm bảo chạy tương thích mọi môi trường Docker/Linux/Mac.
- Backend (module `report`):
  - 5 báo cáo điều hành nghiệp vụ KSVH:
    1. Tổng hợp phiếu chấm theo tháng (số phiếu, tỷ lệ % tuân thủ, lỗi M1–M4).
    2. Xếp hạng nhà hàng theo tỷ lệ tuân thủ & điểm rủi ro (Xuất sắc / Tốt / Trung bình / Cần cải thiện).
    3. Phân tích lỗi theo tiêu chí & nhóm tiêu chí (xác định % luỹ kế Pareto theo chuẩn 80/20).
    4. Tình trạng & tiến độ khắc phục lỗi (đúng hạn, trễ hạn, quá hạn đang mở, tỷ lệ đúng hạn).
    5. Năng suất chuyên viên KSVH (số phiếu phân công/hoàn thành, thời lượng chấm TB, lỗi phát hiện, lỗi M3-M4).
  - Xuất Excel (.xlsx) cho cả 5 báo cáo qua `ExcelWriter.export` + `ExcelResponses`.
  - Xuất PDF (`PdfExportService` + `PdfResponses` header RFC 5987 UTF-8):
    - Phiếu kiểm tra KSVH đầy đủ: Thông tin chung, Checkin GPS & thời lượng, kết quả từng tiêu chí kèm hình ảnh/ghi chú, danh sách lỗi vi phạm hiện trường, chữ ký KSVH & CHT.
    - Biên bản vi phạm đặc biệt nghiêm trọng M4: Cảnh báo sự cố khẩn cấp, mức độ ảnh hưởng, thông tin nhà hàng & CHT, mô tả lỗi, chữ ký xác nhận của Ban Giám đốc & Phòng KSVH.
  - Phân quyền: `report:read`, `report:export`, `inspection:read_all`, `inspection:read_own`, `finding:respond`.
- Frontend:
  - Trang `/admin/reports` (menu "Báo cáo & Thống kê" thuộc nhóm Vận hành kiểm soát):
    - Bộ lọc đa năng `ReportFilterBar`: Khoảng ngày, Công ty, Nhà hàng, Chuyên viên KSVH, Nhóm tiêu chí.
    - Tab 1: Tổng hợp tháng (KPI cards, biểu đồ xu hướng số phiếu và % tuân thủ ECharts, bảng chi tiết có dòng Tổng cộng, nút Xuất Excel).
    - Tab 2: Xếp hạng nhà hàng (bảng thứ hạng, tỷ lệ tuân thủ, số lỗi đang mở, phân loại rủi ro Tag màu, nút Xuất Excel).
    - Tab 3: Phân tích lỗi Pareto (biểu đồ Pareto kết hợp Bar cột số lần và Line đường luỹ kế % ngưỡng 80/20, bảng phân tích, nút Xuất Excel).
    - Tab 4: Tiến độ khắc phục (KPI cards, thanh tiến độ Progress tỷ lệ đúng hạn từng nhà hàng, theo dõi quá hạn mở, nút Xuất Excel).
    - Tab 5: Năng suất chuyên viên (tỷ lệ hoàn thành, thời lượng chấm trung bình, số lỗi M3-M4 phát hiện, nút Xuất Excel).
  - Nút "Tải PDF" phiếu kiểm tra trên modal chi tiết phiếu chấm KSVH (`InspectionDetailModal`).
  - Nút "Biên bản M4 (PDF)" trên modal chi tiết lỗi vi phạm M4 (`FindingDetailModal`).
- Test: integration test `ReportApiTests` (8 integration tests kiểm tra đầy đủ JSON API, xuất Excel 5 báo cáo, xuất PDF phiếu kiểm tra, xuất PDF biên bản M4, kiểm tra phân quyền 403). Backend verify pass 86/86 tests + Spring Modulith compliant, frontend build pass 100%.

## Plan 4 – Hạ mức ảnh hưởng & Hồ sơ rủi ro từng nhà hàng · Ưu tiên TRUNG BÌNH – XONG PHẦN KỸ THUẬT – CHỜ KSVH XÁC NHẬN (17/11/2026)
- Rà `RiskCalculator` với TC-3 (hạ mức sau kỳ không lỗi):
  - Phương thức `evaluateCurrentRisk` đánh giá trạng thái rủi ro tại bất kỳ thời điểm nào (`asOfDate`).
  - Tự động hạ mức về `baseImpact` khi nhà hàng có đủ số tháng dương lịch sạch lỗi (`resetPeriodMonths`, mặc định 6 tháng).
  - Tính chính xác ngày dự kiến hạ mức tiếp theo (`expectedResetDate`).
  - Vi phạm mới sau hạ mức bắt đầu chu kỳ đếm độc lập mới từ mức gốc.
- API & DTOs:
  - `GET /api/v1/restaurants/{id}/risk-profile?asOfDate=...`: Hồ sơ rủi ro chi tiết từng tiêu chí, mức gốc vs hiệu lực, số tháng sạch, dự kiến hạ mức, lịch sử các lần vi phạm.
  - `GET /api/v1/risk/escalated-criteria?asOfDate=...`: Danh sách điểm nóng đang bị nâng mức trên toàn hệ thống.
- Frontend:
  - Trang `/admin/risk-profiles` (menu "Hồ sơ rủi ro nhà hàng" thuộc nhóm Vận hành kiểm soát):
    - Tab 1: Hồ sơ rủi ro nhà hàng (bộ chọn nhà hàng, chọn ngày, 4 KPI cards, bảng tiêu chí, modal lịch sử vi phạm).
    - Tab 2: Tiêu chí đang nâng mức toàn hệ thống (bảng toàn hệ thống, liên kết 1 click xem hồ sơ chi tiết).
  - Tích hợp deep link từ Báo cáo Xếp hạng nhà hàng sang Hồ sơ rủi ro.
- **Trạng thái xác nhận nghiệp vụ:** Kỹ thuật đã hoàn tất 100%. Đang chờ Phòng KSVH xác nhận các câu hỏi nghiệp vụ liên quan:
  - **Q2:** Chu kỳ đếm tần suất vi phạm (3 tháng / 6 tháng / 1 năm) – phần mềm đang để cấu hình linh hoạt mặc định 12 tháng.
  - **Q3:** Điều kiện hạ mức (số tháng không lỗi liên tiếp) – phần mềm đang để cấu hình linh hoạt mặc định 6 tháng.
  - Chi tiết giả định và câu hỏi xem tại [docs/QUESTIONS_FOR_KSVH.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/QUESTIONS_FOR_KSVH.md).
- Test: Unit test `RiskCalculatorTests` và Integration test `RestaurantRiskProfileApiTests` (4 integration tests) pass 100%. ModularityTest và toàn bộ 91 test backend pass 100%, frontend lint/typecheck/build pass.

## Plan 5 – Kiểm tra kết quả khắc phục & đề xuất kiểm tra đột xuất · Ưu tiên TRUNG BÌNH – ĐÃ HOÀN THÀNH (17/11/2026)
- Loại phiếu thứ 3 "Kiểm tra kết quả khắc phục" (`VERIFICATION`):
  - Database: Cập nhật ràng buộc `ck_inspections_type` cho phép `VERIFICATION`, bổ sung `finding_id` vào `inspection_items` (`V20261117_1600__verification_inspections.sql`).
  - Backend: Gom các lỗi chờ nghiệm thu (`PENDING_VERIFICATION`, `REMEDIATING`) của nhà hàng vào 1 phiếu kiểm tra (thực tế tại nhà hàng hoặc từ xa);
    khi chuyên viên hoàn tất chấm điểm: kết quả Đạt (`PASS` → đóng lỗi `CLOSED`), Chưa đạt (`FAIL` → giữ `CONFIRMED`, phạt +1 vi phạm theo `finding_occurrences` nguồn `VERIFY_FAILED`, mở chu kỳ khắc phục mới); phiếu nghiệm thu hoàn thành chuyển `COMPLETED`.
  - API: `GET /api/v1/findings/verification-candidates?restaurantId=...` lấy danh sách lỗi đủ điều kiện nghiệm thu của nhà hàng.
- Cảnh báo khi lập kế hoạch tháng (`PriorFindingsWarning`):
  - Tự động phát hiện nhà hàng còn lỗi vi phạm chưa nghiệm thu / tồn đọng từ tháng trước.
  - API: `GET /api/v1/inspection-plans/restaurant-warnings?restaurantId=...&beforeDate=...`.
  - Tích hợp cảnh báo trực quan `RestaurantPriorWarningTag` vào chi tiết kế hoạch (`PlanDetailModal`) và bảng phân công lập kế hoạch (`PlanAssignmentEditor`).
- Gợi ý kiểm tra đột xuất (`SurpriseInspectionSuggestion`):
  - Hệ thống tự động phân tích điểm rủi ro, phát hiện nhà hàng có lỗi M4/M3 chưa khắc phục, điểm rủi ro tăng cao, hoặc tiêu chí bị nâng mức.
  - Tự động nhóm các chuyên đề vi phạm gợi ý (`suggestedTopicGroupIds`).
  - API: `GET /api/v1/inspections/surprise-suggestions`.
  - Nút "Gợi ý đột xuất" kèm Badge thông báo số lượng trên trang danh sách phiếu kiểm tra (`InspectionListPage`) mở modal danh sách đề xuất (`SurpriseSuggestionsModal`), hỗ trợ 1 chạm tự động điền form tạo phiếu đột xuất.
- Trải nghiệm chuyên viên trên Mobile (`InspectionExecutionPage` / `InspectionCriterionCard`):
  - Hiển thị đầy đủ thông tin lỗi ban đầu, ảnh vi phạm, phương án và ảnh bằng chứng khắc phục của nhà hàng qua component `FindingRemediationInfo`.
- Test: integration test `VerificationAndSurpriseFlowTests` (4 integration tests kiểm tra toàn diện luồng tạo phiếu nghiệm thu, chấm đạt đóng lỗi, chấm không đạt phạt vi phạm, đề xuất đột xuất, cảnh báo kế hoạch). Toàn bộ 95 backend tests pass 100%, Spring Modulith compliant, frontend build pass 100% (tất cả các file source <= 250 dòng).

## Plan 6 – Trải nghiệm điện thoại & ngoại tuyến (Web Responsive & PWA) · Ưu tiên TRUNG BÌNH – ĐÃ HOÀN THÀNH (17/11/2026)
- Trải nghiệm di động Web Responsive & PWA:
  - Ứng dụng web tối ưu trải nghiệm cho trình duyệt điện thoại (Safari / Chrome) bằng bộ giao diện `antd-mobile` tích hợp sẵn, hỗ trợ cài đặt lên màn hình chính điện thoại (PWA qua `manifest.webmanifest` và Service Worker tĩnh `sw.js`).
  - Hàng đợi ngoại tuyến IndexedDB (`offline-media-queue.ts` & `useOfflineSync.ts`): Khi mạng chập chờn hoặc mất sóng tại hiện trường (tầng hầm, nhà bếp), ảnh chụp bằng chứng được lưu trữ an toàn trong IndexedDB của trình duyệt và tự động đẩy lên máy chủ ngay khi có kết nối trở lại.
  - Hỗ trợ quay & tải video ngắn bằng chứng ($\le 50\text{MB} \approx 60$ giây, MP4/MOV) kèm trình phát video tích hợp trên thẻ tiêu chí và các modal chi tiết.
  - Lưu nháp tự động trên máy (`localStorage` theo từng phiếu kiểm tra): Chuyên viên đang chấm điểm tại hiện trường nếu bị mất sóng, vô tình reload hoặc đổi ứng dụng thì dữ liệu chấm vẫn được lưu trữ nguyên vẹn, tránh mất bài.
  - Chụp ảnh bằng chứng có watermark vị trí GPS, thời gian thực, tên Chuyên viên và tên nhà hàng.
  - Màn hình mobile thông minh cho Cửa hàng trưởng & Chuyên viên (`InspectionHomePage`): Bộ lọc segmented "Cần xử lý", "Chờ kết quả", "Tất cả" giúp gom gọn việc cần làm (phiếu được giao, yêu cầu thẩm định khiếu nại, lỗi cần xác nhận, lỗi đang khắc phục, phiếu chờ xác nhận đã xem).

## Plan 7 – Nhật ký hệ thống & toàn vẹn dữ liệu · Ưu tiên TRUNG BÌNH – ĐÃ HOÀN THÀNH (17/11/2026)
- Database:
  - Migration `V20261117_1700__audit_logs.sql`: Bảng `audit_logs` (thời điểm, user_id, username, user_full_name, action, target_type, target_id, summary, ip_address, details JSON text) kèm 4 indexes tối ưu truy vấn.
- Backend (Module `audit` & `shared.audit`):
  - Sự kiện `AuditLogEvent` trong `vn.ksvh.qc.shared.audit` cho phép mọi module publish event kiểm toán mà không gây phụ thuộc vòng (tuân thủ 100% Spring Modulith).
  - Tự động ghi vết mọi thao tác quản trị & thay đổi dữ liệu nhạy cảm:
    - Người dùng & phân quyền: `USER_CREATE`, `USER_UPDATE`, `USER_RESET_PASSWORD`, `USER_DELETE`, `ROLE_CREATE`, `ROLE_UPDATE`, `ROLE_DELETE`, `LOGIN_LOCKOUT`.
    - Danh mục tiêu chí: `CRITERION_CREATE`, `CRITERION_UPDATE`, `CRITERION_DELETE`, `CRITERION_GROUP_CREATE`, `CRITERION_GROUP_UPDATE`.
    - Cấu hình rủi ro: `RISK_CONFIG_UPDATE` (bảng phân loại mức rủi ro, cấu hình tần suất, quy tắc nâng mức).
    - Kế hoạch & kiểm tra: `PLAN_APPROVE`, `PLAN_REJECT`, `INSPECTION_CANCEL` (lưu lý do huỷ phiếu).
    - Khiếu nại: `APPEAL_CONCLUDE` (biên bản kết luận cuộc họp khiếu nại của Quản lý KSVH).
  - API: `GET /api/v1/audit-logs` (phân trang, lọc theo keyword, action, targetType, userId, khoảng ngày), `GET /api/v1/audit-logs/{id}`, `GET /api/v1/audit-logs/actions`, `GET /api/v1/audit-logs/target-types`. Phân quyền nghiêm ngặt với `system:log:read`.
  - Rà soát & khoá chặt tính bất biến dữ liệu: Sau khi nộp `SUBMITTED`, bảng `inspection_items` (kết quả chấm gốc `FAIL`, ghi chú hiện trường, ảnh/video bằng chứng gốc) hoàn toàn bất biến qua toàn bộ chu kỳ khiếu nại, khắc phục và nghiệm thu; tiêu chí được chấp nhận khiếu nại giữ nguyên kết quả gốc `FAIL` và chỉ chuyển trạng thái hiển thị `findingStatus` sang `DISMISSED`. Đã kiểm chứng qua test tích hợp chuyên sâu `testStrictImmutabilityOfInspectionItemsAcrossEntirePostSubmitLifecycle`.
- Frontend:
  - Trang `/admin/audit-logs` ([AuditLogPage.tsx](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/frontend/src/features/audit/pages/AuditLogPage.tsx)): Bộ lọc đa năng (hành động, loại đối tượng, khoảng ngày, từ khoá), bảng dữ liệu có Tag màu theo loại hành động, nút xem chi tiết và nút xuất CSV.
  - Modal [AuditLogDetailModal.tsx](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/frontend/src/features/audit/components/AuditLogDetailModal.tsx): Xem chi tiết bản ghi kiểm toán, format JSON dữ liệu chi tiết dễ nhìn.
  - Tích hợp route và menu "Nhật ký hệ thống" vào nhóm Quản trị hệ thống trên thanh điều hướng.
- Test: integration test `AuditLogApiTests` và `ModularityTest` pass 100%. Toàn bộ 97 test backend pass 100%, frontend lint/typecheck/build pass (tất cả các file source <= 250 dòng).

## Plan 8 – Kênh thông báo ngoài (email / Zalo) · Ưu tiên THẤP – ĐÃ HOÀN THÀNH (17/11/2026)
- Database: Migration `V20261117_1800__notification_channels.sql` tạo 2 bảng:
  - `user_notification_preferences`: Cấu hình bật/tắt email/zalo và thông tin liên hệ tuỳ chọn theo từng người dùng.
  - `notification_dispatches`: Hàng đợi & nhật ký gửi thông báo (Outbox pattern) hỗ trợ lưu trạng thái `PENDING`, `SENT`, `FAILED`, số lần thử lại, nguyên nhân lỗi.
- Backend:
  - Tích hợp `spring-boot-starter-mail` (Jakarta Mail & Spring Context Support).
  - Tự động phân giải thông tin người nhận: ưu tiên cấu hình riêng của user $\rightarrow$ email/số điện thoại từ hồ sơ nhân viên (`employee.api.EmployeeLookupApi`) $\rightarrow$ tài khoản username.
  - Trình tạo email HTML tiếng Việt chuẩn nhận diện thương hiệu KSVH QC (`EmailTemplateService`): banner màu xanh KSVH `#003a8c`, khung card tin nhắn sắc nét, nút bấm Call-to-Action dẫn thẳng tới màn hình chi tiết, hỗ trợ hiển thị đẹp trên mọi trình duyệt/thiết bị.
  - Bộ gửi `EmailNotificationSender` & `ZaloNotificationSender`: gửi thật khi có cấu hình (SMTP/Zalo ZNS), tự động ghi nhận mô phỏng môi trường phát triển (không làm tắc nghẽn luồng nghiệp vụ).
  - Tự động tạo bản ghi gửi thông báo kênh ngoài đồng bộ theo sự kiện in-app của Plan 2; xử lý ngầm bất đồng bộ `@Async` chỉ sau khi giao dịch cơ sở dữ liệu đã commit thành công (`@TransactionalEventListener(phase = AFTER_COMMIT)`), tránh triệt để lỗi khoá ngoại.
  - Cơ chế thử lại tự động: Scheduled job `retryFailedDispatches` quét 5 phút/lần tự động gửi lại các thông báo bị lỗi tối đa 3 lần.
  - API cấu hình kênh cá nhân: `GET /api/v1/notifications/preferences`, `PUT /api/v1/notifications/preferences`.
- Frontend:
  - Cập nhật icon Cài đặt (`SettingOutlined`) ngay trên đầu danh sách thông báo chuông (`NotificationList`).
  - Modal [NotificationPreferenceModal.tsx](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/frontend/src/features/notifications/components/NotificationPreferenceModal.tsx): giao diện trực quan cho phép người dùng bật/tắt nhận Email, bật/tắt nhận Zalo, nhập email/SĐT tuỳ chọn (hiển thị email mặc định).
- Test: integration test `ExternalNotificationFlowTests` (lấy/cập nhật cấu hình, tạo bản ghi gửi outbox khi có sự kiện, sinh HTML template, quét và thử lại bản ghi thất bại). Toàn bộ 100/100 test backend pass 100%, Spring Modulith compliant, frontend build pass 100%.

## Plan 9 – Sẵn sàng triển khai & Tăng cường Bảo mật · Ưu tiên CAO – ĐÃ HOÀN THÀNH (17/11/2026)
- Docker & Triển khai 1 Lệnh:
  - Multi-stage build `backend/Dockerfile`: Build bằng Maven + Eclipse Temurin 21 JDK, runtime tối ưu Eclipse Temurin 21 JRE, font TrueType tiếng Việt cho PDF, non-root user `appuser:appgroup`, healthcheck `/actuator/health`.
  - Multi-stage build `frontend/Dockerfile`: Build bằng Node 22 Alpine, runtime Nginx 1.27 Alpine phục vụ file tĩnh, SPA routing fallback `/index.html`, reverse proxy `/api` và `/actuator` sang backend container, gzip nén tài nguyên và cache 1 năm cho assets.
  - Cấu hình [docker-compose.yml](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docker-compose.yml) đầy đủ 5 services: `postgres:17-alpine` (healthcheck, volume `pgdata`), `minio` (healthcheck, volume `miniodata`), `minio-init` (tự động tạo bucket `ksvh-qc`), `backend` (kết nối nội bộ mạng Docker), `frontend` (Nginx cổng 80).
  - Tệp mẫu biến môi trường [.env.example](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/.env.example) chú thích tiếng Việt rõ ràng, tuyệt đối không lưu secret cứng trong repo.
- Bảo mật hệ thống & Phòng chống Brute-force:
  - Cấu hình profile `prod` ([application-prod.yml](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/backend/src/main/resources/application-prod.yml)): Tự động tắt Swagger UI và OpenAPI docs, tắt seed data mẫu, tắt hiển thị chi tiết stacktrace khi lỗi, cookie `Secure` + `SameSite=Strict`, giới hạn mức log. CORS cấu hình linh hoạt qua biến môi trường `CORS_ALLOWED_ORIGINS`.
  - Chống Brute-force đăng nhập (`LoginAttemptService`): Giới hạn 5 lần đăng nhập thất bại trong 15 phút theo cặp `username@ip`. Lần thứ 6 bị chặn ngay với mã lỗi 429 `AUTH_ACCOUNT_LOCKED`, tự động ghi audit log `LOGIN_LOCKOUT`.
  - Header bảo mật Spring Security & Nginx: HTTP Strict Transport Security (`HSTS` maxAge 31536000s, includeSubDomains), Content-Security-Policy (`CSP`), `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `X-XSS-Protection "1; mode=block"`, `Referrer-Policy strict-origin-when-cross-origin`, `Permissions-Policy "geolocation=(self), camera=(self)"`.
- Vận hành & Sao lưu tự động:
  - Script [scripts/backup.sh](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/scripts/backup.sh): Tự động xuất cơ sở dữ liệu PostgreSQL (`pg_dump` nén gzip) và kho ảnh MinIO Media, sinh mã băm SHA256 checksum kiểm tra toàn vẹn, tự động dọn dẹp bản sao lưu quá 30 ngày.
  - Script [scripts/restore.sh](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/scripts/restore.sh): Phục hồi nhanh cơ sở dữ liệu và dữ liệu ảnh chỉ bằng 1 dòng lệnh.
- Tài liệu vận hành & Hướng dẫn:
  - Hướng dẫn triển khai Production chi tiết: [docs/DEPLOYMENT_GUIDE.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/DEPLOYMENT_GUIDE.md) (yêu cầu phần cứng, cấu hình SSL/HTTPS cho camera/GPS di động, cron backup, giám sát healthcheck).
  - Sổ tay hướng dẫn sử dụng: [docs/USER_MANUAL.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/USER_MANUAL.md) chi tiết cho cả 8 vai trò người dùng và toàn bộ quy trình 6 giai đoạn vận hành KSVH.
  - Cập nhật [README.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/README.md) đầy đủ mục Hướng dẫn Triển khai Production & Cấu hình Biến môi trường.

## Plan 10 – Kiểm thử tổng & nghiệm thu với Phòng KSVH · Cuối cùng – XONG PHẦN KỸ THUẬT – CHỜ KSVH XÁC NHẬN (17/11/2026)
- Kịch bản end-to-end theo 6 bước PDF cho cả 8 vai trò người dùng: Lập kế hoạch $\rightarrow$ Duyệt tự động sinh phiếu $\rightarrow$ Chấm trên điện thoại (GPS check-in, ảnh watermark) $\rightarrow$ Xác nhận & Khiếu nại hội đồng $\rightarrow$ Khắc phục & Nghiệm thu / Quá hạn phạt tần suất $\rightarrow$ Báo cáo & Điều hành.
- Toàn bộ 102/102 automated test backend pass 100%, Spring Modulith compliant 100%.
- Frontend: 0 lỗi TypeScript, 0 cảnh báo lint, build production thành công, 100% tệp mã nguồn $\le 250$ dòng.
- **Trạng thái nghiệm thu:**
  - Kỹ thuật & tự động hoá: Đã hoàn tất 100% và sẵn sàng.
  - Danh mục 9 câu hỏi nghiệp vụ gửi Phòng KSVH xem tại [docs/QUESTIONS_FOR_KSVH.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/QUESTIONS_FOR_KSVH.md) (bao gồm Q2, Q3, Q5, Q6, Q7, Q9, Q10, Q11, Q12 cùng các giả định an toàn phần mềm đang áp dụng).
  - Kịch bản & checklist nghiệm thu UAT chi tiết theo từng vai trò đã soạn thảo tại [docs/UAT_CHECKLIST.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/UAT_CHECKLIST.md) (21 kịch bản kiểm thử cho 6 nhóm vai trò).
  - Bàn giao Báo cáo Nghiệm thu tổng thể [docs/ACCEPTANCE_REPORT.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/ACCEPTANCE_REPORT.md), Sổ tay Người dùng [docs/USER_MANUAL.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/USER_MANUAL.md), Hướng dẫn Triển khai [docs/DEPLOYMENT_GUIDE.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/DEPLOYMENT_GUIDE.md).

---

## Tổng kết Lộ trình Phát triển
- **8/10 Plans đã hoàn thành 100%:** Plan 1, 2, 3, 5, 6, 7, 8, 9.
- **2/10 Plans đã xong phần kỹ thuật – chờ Phòng KSVH xác nhận nghiệp vụ & nghiệm thu thực tế:**
  - ⏳ **Plan 4:** Hạ mức ảnh hưởng sau kỳ không lỗi & Hồ sơ rủi ro (Chờ chốt Q2, Q3 về chu kỳ tháng sạch lỗi và chu kỳ nâng mức).
  - ⏳ **Plan 10:** Kiểm thử UAT với Phòng KSVH (Chờ đại diện KSVH thực hiện 21 kịch bản UAT trong [docs/UAT_CHECKLIST.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/UAT_CHECKLIST.md) và phản hồi 9 câu hỏi trong [docs/QUESTIONS_FOR_KSVH.md](file:///Users/huynhthanhphu/Documents/PROJECT%20-%20KSVH/docs/QUESTIONS_FOR_KSVH.md)).
