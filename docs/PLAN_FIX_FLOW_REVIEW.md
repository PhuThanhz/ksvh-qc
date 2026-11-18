# Kế hoạch sửa sau khi rà luồng (17/11/2026)

Nguồn: rà commit `469ee94 "complete all 10 plans"`. Backend 100/100 test và frontend build đang qua, luồng 6 bước PDF đúng hướng.
Còn **2 lỗi** (bắt buộc sửa) và **2 chỗ nghiệp vụ** (đã có đề xuất, làm theo đề xuất trừ khi người dùng nói khác).
Trước khi làm: đọc `CLAUDE.md`, `backend/CLAUDE.md`, `docs/DOMAIN_SPEC.md` §4–§5. Không sửa migration cũ; đổi schema = migration mới.

---

## Việc 1 – Thông báo email/Zalo bị mất (LỖI)
**Hiện tượng:** log test có ~26 lỗi `notification_dispatches_notification_id_fkey ... is not present in table "notifications"`.
**Nguyên nhân:** `backend/src/main/java/vn/ksvh/qc/notification/service/NotificationService.java` – `create()` và `createBatch()`
gọi `dispatchService.dispatchAsync(...)` **bên trong transaction** vừa `save` thông báo. Luồng `@Async` chạy trước khi commit nên
không thấy dòng `notifications` → lỗi khoá ngoại, email/Zalo bị bỏ mà không báo.
**Sửa:**
- Chỉ gửi sau khi commit: trong `create`/`createBatch` đăng ký
  `TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() { afterCommit() { dispatchAsync(...) } })`
  (nếu không có transaction đang chạy thì gọi thẳng). Hoặc phát một event nội bộ và nghe bằng
  `@TransactionalEventListener(phase = AFTER_COMMIT)` rồi mới `dispatchAsync`.
- `dispatchAsync` giữ `@Async`, nên chạy trong transaction riêng (`REQUIRES_NEW` hoặc `@Transactional` như hiện có).
**Test:**
- Thêm test (không dùng `@Transactional` rollback của `ApiTestSupport`, hoặc dùng `TransactionTemplate` commit thật rồi dọn dữ liệu):
  tạo thông báo → chờ async (Awaitility hoặc vòng chờ ngắn) → có dòng `notification_dispatches` với đúng `notification_id`.
- Với test hiện có (rollback): sau khi sửa, log **không còn** lỗi `notification_dispatches_notification_id_fkey`.
  Kiểm tra: `./mvnw -q verify > /tmp/v.log 2>&1; grep -c notification_dispatches_notification_id_fkey /tmp/v.log` → 0.

## Việc 2 – Bỏ lỗi đang sửa kết quả chấm gốc (LỖI – vi phạm quy tắc bắt buộc số 4)
**Hiện tượng:** khi khiếu nại được chấp nhận (bỏ lỗi), code đổi `inspection_items.result` từ `FAIL` → `PASS` và ghi đè `comment`.
**Vị trí:** `backend/src/main/java/vn/ksvh/qc/inspection/service/FindingService.java`
- `submitAppealReview(...)` nhánh `allInvalid` (khoảng dòng 297–305): khối `itemRepository.findById(f.getInspectionItemId()).ifPresent(item -> { item.setResult(ItemResult.PASS); ... })`.
- `concludeAppeal(...)` nhánh `DISMISSED` (khoảng dòng 352–358): khối tương tự.
**Sửa:**
- Xoá hai khối sửa `item`. Bỏ lỗi **chỉ** đổi trạng thái lỗi sang `DISMISSED` + ghi `finding_events` (đã có).
  Kết quả chấm của Chuyên viên giữ nguyên.
- Điểm tuân thủ: quyết định hiển thị:
  - Giữ điểm tuân thủ theo kết quả chấm gốc (bất biến), và **thêm** trường "điểm tuân thủ sau khiếu nại" = tính như cũ nhưng coi tiêu chí có lỗi `DISMISSED` là Đạt.
    Áp dụng ở `InspectionResponse.from(...)` (`dto/InspectionResponse.java`), dashboard (`report/service/DashboardService.java`) và báo cáo.
  - Nếu muốn đơn giản: chỉ dùng "điểm sau khiếu nại" ở dashboard/báo cáo, phiếu vẫn hiển thị điểm gốc + ghi chú "N lỗi đã bỏ do khiếu nại".
- Giao diện: chi tiết phiếu hiển thị tiêu chí đó là "Không đạt – lỗi đã bỏ do khiếu nại đúng" (lấy từ trạng thái lỗi), không đổi màu thành Đạt.
**Test:** sửa test khiếu nại hiện có: sau khi bỏ lỗi, `inspection_items.result` vẫn là `FAIL`, `comment` không đổi; lỗi `DISMISSED`; không có `finding_occurrences` cho lỗi đó.

## Việc 3 – Hạn khắc phục sau khi khiếu nại bị bác (NGHIỆP VỤ – làm theo đề xuất)
**Hiện tượng:** hạn tính từ ngày gửi phiếu; thời gian khiếu nại ăn vào thời gian khắc phục. Nếu khiếu nại kéo dài quá hạn,
job quá hạn (`FindingOverdueJob`, 00:05) sẽ +1 tần suất ngay đêm đó.
**Đề xuất:** khi chốt **giữ lỗi** (đồng thuận `allValid` trong `submitAppealReview` và `concludeAppeal` UPHELD):
`f.setDeadlineDate(hôm nay + f.getRemediationDays())` (cùng cách tính với vòng mới ở Q4).
Ghi chú vào note của sự kiện `APPEAL_UPHELD`: "Hạn khắc phục mới: dd/MM/yyyy".
**Test:** lỗi khiếu nại kéo dài qua hạn cũ (lùi `deadline_date` về quá khứ bằng SQL) → chốt giữ lỗi → hạn mới ở tương lai → chạy `markOverdueFindings()` không +1.
**Ghi DOMAIN_SPEC:** §4 bước 4 – "Đã làm (ngày): giữ lỗi sau khiếu nại → hạn khắc phục tính lại từ ngày chốt (chờ KSVH xác nhận)".

## Việc 4 – Phiếu "kiểm tra kết quả khắc phục" nhận cả lỗi chưa gửi bằng chứng (NGHIỆP VỤ – làm theo đề xuất)
**Hiện tượng:** `backend/src/main/java/vn/ksvh/qc/inspection/service/InspectionService.java` khoảng dòng 299–320 (nhánh `VERIFICATION`)
chấp nhận lỗi `PENDING_VERIFICATION` **và** `REMEDIATING`. Lỗi `REMEDIATING` = CHT chưa gửi bằng chứng; nghiệm thu "Đạt" sẽ đóng lỗi không có bằng chứng.
**Đề xuất (theo tài liệu Word: "sau khi nhà hàng gửi bằng chứng"):** chỉ nhận `PENDING_VERIFICATION`.
- Sửa điều kiện kiểm tra và câu truy vấn gợi ý lỗi ứng viên (`List.of(FindingStatus.PENDING_VERIFICATION, FindingStatus.REMEDIATING)`)
  → chỉ `PENDING_VERIFICATION`; thông báo lỗi tiếng Việt: "Lỗi '%s' chưa gửi bằng chứng khắc phục, chưa thể kiểm tra kết quả".
- Frontend: danh sách lỗi chọn vào phiếu kiểm tra khắc phục chỉ hiện lỗi chờ nghiệm thu (dữ liệu lấy từ API nên thường tự đúng – kiểm tra lại).
**Test:** tạo phiếu `VERIFICATION` với lỗi `REMEDIATING` → 400; với lỗi `PENDING_VERIFICATION` → tạo được.

---

## Việc phụ
- `backend/src/main/resources/application-dev.yml` đang có thay đổi chưa commit: `admin` có thêm vai trò KSVH_LEAD, KSVH_MANAGER, BUSINESS_ADMIN, EXECUTIVE.
  Hỏi người dùng giữ hay bỏ trước khi commit (chỉ ảnh hưởng máy dev).

## Hoàn thành khi
- `cd backend && ./mvnw -q verify` qua hết, log không còn lỗi `notification_dispatches_notification_id_fkey`.
- `cd frontend && npm run typecheck && npm run lint && npm run build` qua (nếu đổi API: `npm run api:types` với backend tạm cổng 8099).
- DOMAIN_SPEC ghi lại việc 2, 3, 4. Commit theo Conventional Commits, ví dụ:
  `fix(notification): dispatch external channels after commit`, `fix(finding): keep inspection results immutable when appeal dismissed`,
  `feat(finding): reset remediation deadline when appeal upheld`, `fix(inspection): verification inspection only accepts findings pending verification`.
