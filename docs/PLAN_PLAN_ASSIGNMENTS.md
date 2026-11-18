# Kế hoạch: Phân công theo kế hoạch (PDF s.9) – ĐÃ HOÀN THÀNH

Mục tiêu (DOMAIN_SPEC §4 bước 1): kế hoạch chứa **danh sách phân công** (nhà hàng × chuyên viên × mẫu phiếu × ngày dự kiến).
Quản lý KSVH **duyệt → server tự tạo phiếu** cho từng dòng. **Phiếu định kỳ bắt buộc thuộc kế hoạch đã duyệt**; đột xuất tạo riêng.
Thông báo cho Chuyên viên: chờ module Thông báo (xem PLAN_APPEAL_REVIEW_AND_NOTIFICATION.md).

## Đã hoàn thành (17/11/2026)
1. **Backend**:
   - Migration `backend/.../db/migration/V20261117_1300__plan_assignments.sql`: bảng `inspection_plan_assignments`
     (plan_id CASCADE, restaurant_id, inspector_id, template_id, scheduled_date, sort_order, inspection_id), unique (plan_id, restaurant_id).
   - Entity `PlanAssignment.java`, repo `PlanAssignmentRepository.java`.
   - DTOs: `PlanAssignmentRequest`, `PlanAssignmentResponse`, `PlanCreateRequest`, `PlanUpdateRequest`, `PlanResponse`.
   - `InspectionService`: `createChecked`, `createFromPlanAssignment`, `requirePlanForPeriodic`, `validateTemplateForAssignment`.
   - `InspectionPlanService`:
     - Inject `PlanAssignmentRepository`, `OrgUnitLookupApi`, `CriteriaLookupApi`, `InspectionRepository`, `InspectionService`.
     - `create`/`update`: lưu phân công (xoá cũ thêm mới, chỉ khi DRAFT/REJECTED), kiểm tra không trùng nhà hàng, ngày trong khoảng, nhà hàng active RESTAURANT, chuyên viên active KSVH_INSPECTOR, mẫu phiếu hợp lệ qua `criteriaLookupApi.findTemplate` + `validateTemplateForAssignment`.
     - `submit`: bắt buộc ≥ 1 dòng phân công.
     - `approve`: APPROVED + saveAndFlush, duyệt từng dòng gọi `createFromPlanAssignment`, ghi `inspectionId`. Lỗi dòng nào rollback toàn bộ.
     - `search`: `assignmentCount` qua `findByPlanIdIn`, `assignments` rỗng.
     - `get`: trả chi tiết phân công, tên nhà hàng / chuyên viên / mẫu, mã + trạng thái phiếu đã tạo.
   - Tests: `InspectionExecutionFlowTests` mở rộng (end-to-end kế hoạch + duyệt tự sinh phiếu, các ca lỗi 400).
   - Toàn bộ backend test & verify thành công (`./mvnw -q verify`).

2. **Frontend & Types**:
   - Sinh lại `src/types/api.generated.ts` từ OpenAPI 3.1.
   - `inspection.types.ts`: cập nhật `PlanAssignmentRequest`, `PlanAssignmentResponse`, `PlanResponse`, `PlanCreateRequest`, `PlanUpdateRequest`.
   - `PlanAssignmentEditor.tsx`: bảng phân công trực quan trong modal lập kế hoạch (thêm/xoá dòng, chọn nhà hàng, chuyên viên, mẫu, ngày dự kiến trong khoảng thời gian kế hoạch).
   - `PlanFormModal.tsx`: tích hợp phân công, kiểm tra dữ liệu trước khi gửi.
   - `PlanDetailModal.tsx`: hiển thị chi tiết kế hoạch + danh sách phân công và trạng thái phiếu đã tạo.
   - `PlanTable.tsx`: bổ sung cột số phân công.
   - `InspectionSingleForm.tsx` & `InspectionBatchForm.tsx`: bắt buộc chọn kế hoạch đã duyệt khi tạo phiếu định kỳ.
   - Kiểm tra chuẩn UI: `npm run typecheck`, `npm run lint`, `npm run build` đều pass, tất cả file ≤ 250 dòng.

3. **Tài liệu nghiệp vụ**:
   - `DOMAIN_SPEC.md`: cập nhật "Đã làm" tại §4 Bước 1 và quyết định Q8.

## Các việc khác trong phiên đã xong (chưa commit)
Gộp/tách trang rủi ro, giảm màu + biến CSS `--app-*`, tách AdvancedFilter/TableCard, kỳ đếm 1–24 tháng, chặn phiên bản cấu hình trùng,
sửa DATE_FORMAT → to_char, seed dev Postgres, job quá hạn +1, xác nhận ảnh bằng chứng, CHT xác nhận phiếu không lỗi (AWAITING_ACK).
Backend verify và frontend build đều qua **trước** khi bắt đầu phần phân công.
