# Các giai đoạn tiếp theo sau khi 2 agent làm xong (lập 18/11/2026)

Điều kiện bắt đầu: hàng đợi §7, §8 trong `docs/PARALLEL_AGENTS.md` của cả Agent BE và Agent FE đều đã xong và commit.
Hiện trạng đo được: **chưa có CI** (`.github/workflows` không có), **frontend 0 test**, backend 24 file test, chỉ có profile `dev`/`prod`
(chưa có `staging`), đã có Spring Actuator, repo `github.com/PhuThanhz/ksvh-qc`. Thư viện / dịch vụ mới → hỏi người dùng trước (CLAUDE.md).

| Giai đoạn | Mục tiêu | Ai làm | Ưu tiên |
|---|---|---|---|
| G1 | Hợp nhất & kiểm tra tổng | 1 agent | Ngay |
| G2 | CI tự động trên GitHub | Agent BE (backend) + Agent FE (frontend) song song | Cao |
| G3 | Test frontend + kiểm thử đầu-cuối | Agent FE | Cao |
| G4 | Môi trường staging | Agent BE | Cao |
| G5 | Nạp dữ liệu thật + cấu hình theo KSVH | Người dùng + agent | Cao |
| G6 | Nghiệm thu (UAT) với Phòng KSVH | Người dùng + KSVH | Cao |
| G7 | Chuẩn bị chạy thật (go-live) | Agent BE + người dùng | Cao |
| G8 | Đào tạo & bàn giao | Agent viết tài liệu + người dùng | Trung bình |
| G9 | Sau go-live: cải tiến & bảo trì | 2 agent | Liên tục |

---

## G1 – Hợp nhất & kiểm tra tổng
1. `cd backend && ./mvnw -q verify`; `cd frontend && npm run typecheck && npm run lint && npm run build`.
2. Mở thử **mọi trang** theo checklist cuối `PLAN_UI_UX.md` (4 kích thước, không lỗi console) – dùng `scripts/smoke_test_cdp.mjs` nếu chạy được.
3. Chạy hết 6 bước luồng PDF bằng các tài khoản dev (`lead` → `manager` → `inspector` → `store` → `obm` → `executive`), ghi lỗi.
4. Sửa lỗi phát hiện (mỗi lỗi một commit). Review toàn bộ thay đổi trên nhánh `feat/ksvh-qc-optimize` (skill `/code-review`, `/security-review`).
5. Mở **Pull Request** vào `main`, mô tả các plan đã làm; gộp khi CI (G2) xanh. Gắn tag `v0.9.0-rc1`.

## G2 – CI tự động (GitHub Actions)
- `.github/workflows/backend.yml`: Java 21, dịch vụ Postgres 17, `./mvnw -q verify` (gồm `ModularityTest`), lưu báo cáo test.
- `.github/workflows/frontend.yml`: Node theo `package.json`, `npm ci`, `typecheck`, `lint`, `build`, báo kích thước bundle.
- Chặn gộp vào `main` khi CI đỏ (branch protection – người dùng bật trên GitHub).
- Kiểm tra bí mật: không có khoá/mật khẩu thật trong repo (chỉ giá trị dev trong `application-dev.yml`).

## G3 – Test frontend & đầu-cuối (cần hỏi thêm thư viện)
- Unit/component (đề xuất **Vitest + React Testing Library**): `permissions` (can/satisfies), bảng trạng thái `constants/status.ts`,
  `lib/http` (ApiError, applyFieldErrors), form zod schema (kế hoạch, kỳ đếm 1–24, khiếu nại), `useInspectionDraft`/hàng đợi ảnh offline.
- Đầu-cuối (đề xuất **Playwright**): 6 bước PDF + các ca lỗi (khiếu nại đồng thuận/bất đồng, quá hạn, kiểm tra khắc phục), chạy trên dữ liệu seed;
  thay dần `scripts/smoke_test_cdp.mjs`. Đưa vào CI (G2).
- Mục tiêu: luồng chính có test tự động; lỗi kiểu "trang sập vì thiếu import" bị CI bắt.

## G4 – Môi trường staging
- `application-staging.yml` (giống prod, CORS/domain staging, Swagger bật có đăng nhập hoặc tắt), `docker-compose` cho staging.
- Máy chủ staging + HTTPS (domain dạng `staging.<tên miền>`), MinIO riêng, Postgres riêng, seed dữ liệu mẫu (`db/dev-seed` hoặc dữ liệu đã ẩn danh).
- Tự triển khai staging khi gộp vào `main` (job CI thứ 3) – nếu người dùng có máy chủ.

## G5 – Dữ liệu thật & cấu hình theo KSVH
1. Nhận file Excel từ Phòng KSVH / Ban Giải pháp: công ty, nhà hàng (toạ độ, CHT, OBM), người dùng & chức danh, **70 tiêu chí**, mẫu phiếu.
   Dùng chức năng Nhập Excel + file mẫu (`docs/excel-templates`); ghi lại lỗi nhập.
2. Khai báo cấu hình rủi ro thật: bảng M1–M4 (khoảng điểm, hạn), kỳ đếm, quy tắc nâng mức – thay số "ví dụ PDF".
3. Cập nhật phương án tạm theo câu trả lời trong `QUESTIONS_FOR_KSVH.md` (Q2, Q5, Q6, Q7, Q9, Q10, Q11, Q12): chủ yếu đổi cấu hình; sửa code nếu khác hẳn.
4. Kiểm tra quyền thật: mỗi chức danh chỉ thấy đúng menu/dữ liệu (CHT chỉ nhà hàng mình, BGĐ chỉ xem).

## G6 – Nghiệm thu (UAT) với Phòng KSVH
- Chạy `docs/UAT_CHECKLIST.md` (21 kịch bản, 6 vai trò) trên **staging** với dữ liệu thật.
- Chạy thử **1 tháng song song** (kế hoạch tháng thật, chấm thật trên điện thoại, xử lý lỗi thật); họp hằng tuần ghi góp ý.
- Phân loại góp ý: lỗi (sửa ngay) · đổi nghiệp vụ (cập nhật DOMAIN_SPEC rồi mới code) · mong muốn thêm (đưa vào G9).
- Chốt biên bản nghiệm thu (`docs/ACCEPTANCE_REPORT.md`).

## G7 – Chuẩn bị chạy thật
- **Bảo mật**: rà `/security-review`; đổi mật khẩu/khoá mặc định; tắt tài khoản dev; JWT secret, DB, S3 qua biến môi trường; HTTPS + CSP đã có.
- **Sao lưu**: chạy `scripts/backup.sh` theo lịch (Postgres + MinIO), **thử khôi phục thật** bằng `restore.sh` trên máy khác, ghi thời gian khôi phục.
- **Giám sát**: Actuator `health`/`info` (chỉ nội bộ), log có `traceId` tập trung; cảnh báo khi backend down, job quá hạn lỗi, ổ đĩa MinIO gần đầy.
  (Prometheus/Grafana hoặc dịch vụ giám sát – hỏi người dùng.)
- **Hiệu năng**: tạo dữ liệu giả lập 1 năm (vd 50 nhà hàng × 12 tháng × 70 tiêu chí), đo API danh sách/báo cáo, xuất Excel/PDF; đặt ngưỡng chấp nhận.
- **Kế hoạch chuyển đổi**: ngày go-live, nhập dữ liệu cuối, đóng băng thay đổi, phương án quay lui.

## G8 – Đào tạo & bàn giao
- Hướng dẫn theo vai trò (`docs/USER_MANUAL.md`): Trưởng nhóm, Quản lý, Chuyên viên (điện thoại), CHT (điện thoại), OBM, BGĐ, Quản trị.
- Video ngắn cho 6 bước luồng; câu hỏi thường gặp; cách cài ứng dụng lên điện thoại (PWA).
- Tài liệu vận hành cho Ban Giải pháp (`docs/DEPLOYMENT_GUIDE.md`): triển khai, sao lưu/khôi phục, xử lý sự cố, thêm người dùng/quyền.

## G9 – Sau go-live
- Theo dõi lỗi 2 tuần đầu, sửa nóng theo mức độ.
- `PLAN_OPTIMIZATION.md` **O4** (tối ưu luồng: thao tác hàng loạt, sao chép kế hoạch…) – làm theo góp ý thật, người dùng duyệt từng mục.
- Dọn kỹ thuật: tên class CSS `bitrix-*` còn sót, mã không còn dùng, cập nhật thư viện định kỳ (antd, Spring Boot) có test.
- Đo định kỳ: kích thước bundle, thời gian phản hồi API, số lỗi trên console – so với bảng số đo trong `PLAN_OPTIMIZATION.md`.

---

## Câu giao việc khi 2 agent đã xong
- **Agent BE:** "Đọc `docs/PLAN_NEXT_PHASES.md`, làm G1 bước 1–4 phần backend, rồi G2 `backend.yml`, rồi G4. Hỏi tôi trước khi thêm dịch vụ/thư viện."
- **Agent FE:** "Đọc `docs/PLAN_NEXT_PHASES.md`, làm G1 bước 2–4 phần frontend, rồi G2 `frontend.yml`, rồi G3 (hỏi tôi trước khi thêm Vitest/Playwright)."
- G5–G8 cần người dùng và Phòng KSVH; agent hỗ trợ viết tài liệu, nhập dữ liệu, sửa lỗi.
