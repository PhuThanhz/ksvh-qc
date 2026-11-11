# KSVH QC – Quy tắc chung cho toàn dự án

Phần mềm chấm điểm QC cho team Kiểm soát vận hành. Quản lý dùng **dashboard web** (`/admin`), người chấm dùng **trình duyệt điện thoại** (`/qc`): check-in GPS, chấm theo checklist, chụp ảnh bằng chứng, xuất Excel/PDF.

- Tech stack đã chốt: [docs/TECH_STACK.md](docs/TECH_STACK.md). Không thêm framework/thư viện lớn mới khi chưa hỏi người dùng.
- Nghiệp vụ gốc: `docs/PM_KIEMSOATVANHANH_CHECK.pdf` (khi có). Nghiệp vụ chưa rõ → hỏi, không tự bịa tiêu chí/công thức tính điểm.
- Quy tắc riêng: [backend/CLAUDE.md](backend/CLAUDE.md), [frontend/CLAUDE.md](frontend/CLAUDE.md).

## Ngôn ngữ
- Trao đổi với người dùng, comment code, thông báo lỗi hiển thị cho người dùng: **tiếng Việt có dấu**.
- Tên biến, hàm, class, bảng, cột, endpoint, commit type: **tiếng Anh**.

## Cấu trúc
```
backend/   Spring Boot 4, package theo feature: vn.ksvh.qc.<module>
frontend/  React + Vite, src/features/<khu-vực>
docs/      tài liệu nghiệp vụ, tech stack
```
Module nghiệp vụ: `auth`, `user`, `location`, `checklist`, `audit`, `media`, `report` (frontend: `features/<tên-số-nhiều>`). Kiến trúc và quy ước đã duyệt: [docs/ARCHITECTURE_PROPOSAL.md](docs/ARCHITECTURE_PROPOSAL.md).

## Quy tắc bắt buộc (bảo mật & toàn vẹn dữ liệu)
1. **Không tin client.** Server tự tính khoảng cách GPS (`GeoUtils.distanceMeters`), tự tính tổng điểm, tự kiểm tra quyền. Toạ độ/điểm từ client chỉ là dữ liệu đầu vào.
2. **Phân quyền theo permission** (`module:action`, một user nhiều role). Backend kiểm tra bằng `@PreAuthorize` + kiểm tra sở hữu dữ liệu trong service; frontend chỉ ẩn/hiện qua `permissions/`. Không viết chuỗi role/permission rải rác.
3. **Ảnh** đi qua presigned URL (`/api/v1/media/presign-upload`), không upload file qua Spring. Object key do server sinh. Ảnh gắn với phiên chấm phải được server xác nhận object tồn tại.
4. **Phiên chấm đã nộp (SUBMITTED/APPROVED) là bất biến** với AUDITOR; mọi thay đổi sau nộp phải có người thực hiện và thời điểm.
5. **Token:** access token chỉ ở bộ nhớ trình duyệt; refresh token chỉ ở cookie HttpOnly và DB lưu SHA-256. Không ghi token vào localStorage.
6. **Không commit bí mật.** JWT secret, mật khẩu DB, key S3 lấy từ biến môi trường. Giá trị dev chỉ nằm trong `application-dev.yml`.
7. **Schema chỉ đổi bằng Flyway migration mới** (`V<yyyyMMdd_HHmm>__mo_ta.sql`). Không sửa migration đã chạy, không tạo bảng bằng tay trong DBeaver.

## Quy trình làm việc
- Trước khi sửa: đọc code liên quan và quy tắc của thư mục đó.
- Sau khi sửa, chạy kiểm tra tương ứng và báo kết quả thật:
  - Backend: `cd backend && ./mvnw -q verify` (cần Postgres chạy)
  - Frontend: `cd frontend && npm run typecheck && npm run lint && npm run build`
- Đổi API → chạy backend rồi `cd frontend && npm run api:types`, sửa `features/<m>/api/*` trong cùng thay đổi.
- Thay đổi lớn (module mới, đổi schema, đổi luồng chấm) → lên kế hoạch và hỏi trước.
- Commit theo Conventional Commits: `feat(audit): ...`, `fix(media): ...`. Chỉ commit khi người dùng yêu cầu.

## Agents dự án (`.claude/agents/`)
| Agent | Dùng khi |
|---|---|
| `qc-domain-analyst` | Đọc tài liệu nghiệp vụ → đặc tả tiêu chí, luồng chấm, vai trò, câu hỏi còn mở |
| `db-designer` | Thiết kế bảng / viết Flyway migration PostgreSQL |
| `spring-backend` | Làm API, service, entity, phân quyền ở backend |
| `react-frontend` | Làm màn hình `/admin` và `/qc`, gọi API |
| `code-reviewer` | Review thay đổi theo các quy tắc trên trước khi commit |

## Môi trường dev
- Postgres 17 (Homebrew), DB `ksvh_qc`, cổng 5432. Backend cổng 8088, frontend cổng 5273 (cố định).
- Test GPS/camera trên điện thoại cần HTTPS: `npm run dev` + `S3_PUBLIC_ENDPOINT` (xem README).
