# Chạy 2 agent song song không đụng nhau

Cập nhật 18/11/2026. Cả hai agent làm **cùng thư mục, cùng nhánh** `feat/ksvh-qc-optimize`, nên chia theo **vùng file**.
Hiện tại: Agent BE đang làm Plan O1 (tách service backend, chưa commit); Agent FE đang sửa `frontend/` (UI/kiến trúc, chưa commit).

## 1. Ai sở hữu file nào
| Vùng | Agent BE | Agent FE |
|---|---|---|
| `backend/**` | ✅ sửa | ❌ chỉ đọc |
| `frontend/**` (trừ `src/types/api.generated.ts`) | ❌ chỉ đọc | ✅ sửa |
| `frontend/src/types/api.generated.ts` | ❌ | ✅ chỉ sinh lại khi Agent BE báo "API đã đổi" (§3) |
| `docker-compose.yml`, `frontend/nginx.conf`, `frontend/Dockerfile` | ❌ | ✅ |
| `backend/Dockerfile`, `scripts/**` | ✅ | ❌ |
| `docs/PLAN_OPTIMIZATION.md` | ✅ chỉ đánh dấu O1, O5 (phần backend) | ✅ chỉ đánh dấu O3, O5 (phần frontend) |
| `docs/PLAN_UI_UX.md`, `docs/PLAN_FRONTEND_ARCHITECTURE.md`, `frontend/CLAUDE.md` | ❌ | ✅ |
| `docs/DOMAIN_SPEC.md`, `docs/ROADMAP.md`, `CLAUDE.md`, `backend/CLAUDE.md`, `README.md` | ✅ (FE muốn sửa thì nhờ BE) | ❌ |

## 2. Quy tắc commit (bắt buộc cả hai)
- **Không** dùng `git add -A`, `git add .`, `git commit -a`, `git stash`, `git checkout -- .`, `git reset --hard`, `git clean`
  (sẽ gom hoặc xoá mất file đang làm dở của agent kia).
- Chỉ add đúng vùng của mình: Agent BE `git add backend/ docs/<file của BE>`; Agent FE `git add frontend/ docs/<file của FE>`.
- Trước khi commit: `git status --short` và `git diff --cached --stat` để chắc chắn **không có file của vùng kia** trong commit.
- Không `git pull/rebase/merge`, không đổi nhánh, không sửa lịch sử (`--amend` chỉ với commit vừa tạo của chính mình).
- Commit nhỏ, thường xuyên, Conventional Commits: BE `refactor(backend): …` / `perf(report): …`; FE `fix(ui): …` / `refactor(frontend): …`.

## 3. Khi backend đổi API (giao tiếp giữa 2 agent)
- Plan O1 **không được đổi API** (chỉ chuyển code). Nếu bắt buộc đổi (đường dẫn, trường DTO): Agent BE commit xong rồi ghi một dòng vào
  §5 bên dưới ("API đã đổi: …, commit …"). Agent BE **không** sửa `frontend/`.
- Agent FE đọc §5 trước mỗi lượt làm; khi có dòng mới: chạy backend tạm cổng 8099
  (`cd backend && ./mvnw -q spring-boot:run -Dspring-boot.run.arguments=--server.port=8099`), rồi
  `cd frontend && API_DOCS_URL=http://localhost:8099/v3/api-docs npm run api:types`, sửa `features/*/api` cho khớp, tắt backend tạm.

## 4. Tài nguyên dùng chung
| Tài nguyên | Quy định |
|---|---|
| `./mvnw verify` / `backend/target/` | **Chỉ Agent BE** chạy. Agent FE không build/test backend (trừ chạy tạm cổng 8099 ở §3 khi BE không đang build). |
| Cổng 5273 (Vite dev) | **Chỉ Agent FE** chạy dev server. |
| Cổng 8088 (backend dev) | Agent BE; Agent FE dùng 8088 để xem giao diện, không tự khởi động lại. |
| Postgres `ksvh_qc` | Test backend chạy trong transaction rollback – dùng chung được. Không ai chạy migration tay / sửa dữ liệu bằng SQL. |
| `npm install`, `pom.xml`, `package.json` | Không thêm/đổi thư viện khi chưa hỏi người dùng (CLAUDE.md). |

## 5. Bảng tin giữa 2 agent (chỉ ghi thêm dòng, không xoá)
| Ngày giờ | Agent | Nội dung |
|---|---|---|
| 18/11 | — | Bắt đầu chia vùng theo file này. |
| 18/11 (điều phối) | Người kiểm tra | Lượt 1: commit `e1b2e8c` gộp cả backend (27 file) + frontend (21 file) – từ giờ **mỗi commit chỉ 1 vùng** (§2). |
| 18/11 (điều phối) | Người kiểm tra | `scripts/smoke_test_cdp.mjs` (smoke test giao diện) giao cho **Agent FE** sở hữu; các file khác trong `scripts/` vẫn của BE. |
| 18/11 (điều phối) | Người kiểm tra | Agent BE: migration `V20261118_1000` hợp lệ (đã chạy trên DB dev – **không sửa file này nữa**). Index đơn `idx_findings_restaurant_id`, `idx_findings_criterion_id`, `idx_inspections_status` giờ thừa vì đã có index ghép cùng cột đầu → nếu muốn bỏ thì làm **migration mới**, đo `EXPLAIN` trước/sau. |
| 18/11 (điều phối) | Người kiểm tra | Cả hai: làm xong việc đang dở, commit, rồi làm **§8 trước §7**. Agent FE chờ BE ghi API Q5/Q6 vào đây rồi mới làm giao diện Q5/Q6. |

## 6. Khi cả hai xong
Một người (hoặc agent thứ ba) chạy kiểm tra tổng: `cd backend && ./mvnw -q verify`,
`cd frontend && npm run typecheck && npm run lint && npm run build`, rồi **mở thử mọi trang** theo checklist cuối `docs/PLAN_UI_UX.md`
(4 kích thước màn hình, không lỗi console).

---

## Câu giao việc (dán cho từng agent)

**Agent BE:**
> Đọc `docs/PARALLEL_AGENTS.md` và tuân thủ nghiêm. Bạn là **Agent BE**: chỉ sửa `backend/` và các file docs được giao cho BE.
> Làm tiếp Plan O1 rồi phần backend của Plan O5 trong `docs/PLAN_OPTIMIZATION.md`. Không đổi API; nếu buộc phải đổi thì ghi vào §5.
> Commit chỉ `git add backend/ …`, không `git add -A`/`commit -a`/`stash`/`reset`. Chạy `./mvnw -q verify` trước mỗi commit.

**Agent FE:**
> Đọc `docs/PARALLEL_AGENTS.md` và tuân thủ nghiêm. Bạn là **Agent FE**: chỉ sửa `frontend/` và các file docs được giao cho FE.
> Làm theo thứ tự: `docs/PLAN_UI_UX.md` mục P0 → `docs/PLAN_FRONTEND_ARCHITECTURE.md` (bỏ qua phần đã xong ở commit `74945a0`, Plan O2)
> → phần còn lại `docs/PLAN_UI_UX.md` → phần frontend Plan O5. Đọc §5 trước mỗi lượt. Commit chỉ `git add frontend/ …`,
> không `git add -A`/`commit -a`/`stash`/`reset`. Mỗi mục: typecheck/lint/build + mở thử trang ở 4 kích thước màn hình.

---

## 7. Hàng đợi việc tiếp theo (rà 18/11/2026)
Làm xong việc hiện tại thì lấy việc **kế tiếp chưa xong** trong hàng của mình, từ trên xuống. Xong mục nào: đánh dấu
`ĐÃ XONG (commit …)` ngay tại mục đó trong file plan tương ứng + ghi 1 dòng vào §5. Không nhảy sang hàng của agent kia.

### Đã xong – không làm lại
`PLAN_FIX_FLOW_REVIEW.md` (commit `5382407`) · `PLAN_REMAINING_GAPS.md` (`297008f`) · `PLAN_PLAN_ASSIGNMENTS.md` ·
`PLAN_OPTIMIZATION.md` O0 (`9fddbee`, `fae4d9f`, `a32e86c`), O1 + O2 (`74945a0`, `e1b2e8c`) · `PLAN_UI_UX.md` P0.1 (thiếu import `Tag` đã sửa).

### Hàng của Agent BE
1. `PLAN_OPTIMIZATION.md` **O5 – phần Backend** (mục 6–10): đo số câu SQL / N+1 cho danh sách phiếu, lỗi, chi tiết kế hoạch, báo cáo;
   `EXPLAIN ANALYZE` + migration index cho báo cáo; job quá hạn / nhắc hạn chạy theo lô; Excel streaming (`SXSSFWorkbook`).
   Ghi bảng số đo trước/sau vào file.
2. **Smoke test API cho mọi route GET** (hỗ trợ `PLAN_UI_UX.md` P0.5 phía backend): test gọi mọi endpoint danh sách/chi tiết với tài khoản
   đủ quyền → không 500. Chỉ thêm test, không đổi API.
3. **Dọn backend còn lại**: số ma → `@ConfigurationProperties` (O1.3) nếu chưa làm; rà `ModularityTest`; cập nhật `backend/CLAUDE.md`
   cấu trúc package mới sau O1 (`inspection/service/finding`, `report/service/query`, `report/service/pdf`, `inspection/config`).
4. `PLAN_OPTIMIZATION.md` **O4 – Tối ưu luồng** phần backend (thao tác hàng loạt: xác nhận nhiều lỗi, nghiệm thu nhiều lỗi, sao chép kế hoạch tháng trước):
   **PHẢI hỏi người dùng duyệt từng mục trước khi code** (đổi hành vi). Mỗi mục đổi API → ghi §5 cho Agent FE.
5. Hết việc: chờ, không tự đi sửa `frontend/`.

### Hàng của Agent FE
1. `PLAN_UI_UX.md` **P0 còn lại**: P0.2 (kiểm tra `/admin/inspections` không sập), P0.3 (error boundary cấp nội dung, giữ menu),
   P0.4 (cảnh báo antd deprecated: `overlayInnerStyle`, `destroyOnClose`, `Alert message`), P0.5 (checklist / smoke test mở mọi route).
2. `PLAN_FRONTEND_ARCHITECTURE.md` – các mục **chưa xong** (đo 18/11):
   - §4.1 một đường import feedback: vẫn còn `src/hooks/useNotify.ts`, `src/hooks/useConfirm.ts` → chuyển hết sang `@/components/feedback`, xoá 2 file.
   - §2.4 bỏ chuỗi vai trò: `features/inspections/pages/mobile/InspectionHomePage.tsx` (`roles?.includes('STORE_MANAGER')`, `'SYSTEM_ADMIN'`).
   - §3.2 query key: mới 6 feature có `*.keys.ts` → thêm cho các feature còn lại (audit, notifications, reports, risk-profile, …).
   - §3.5 kiểm tra lại `PATH`: `audit.api.ts`, `notification.api.ts`, `report.api.ts` chưa có `const PATH` trong file (nếu đã gom về 1 file PATH chung thì ghi rõ trong `frontend/CLAUDE.md`).
   - §4.3 nút thô `<button>` trong features, §4.4 `index.ts` cho thư mục component, §4.5 `src/components/README.md`, §6 linter (bật cuối cùng).
3. `PLAN_UI_UX.md` **P2.1–P2.3** (điện thoại: bảng mất cột tên → dạng thẻ, breadcrumb vỡ, nút tràn) → **P1** → **P3** → **P4** → **P5** → **P6**.
4. `PLAN_OPTIMIZATION.md` **O5 – phần Frontend** (mục 1–5): tách chunk `/admin` – `/qc`, ECharts theo module, ảnh nền nhỏ, `staleTime`,
   phân trang danh sách dài. Ghi số đo bundle trước/sau.
5. `PLAN_OPTIMIZATION.md` **O4 phần giao diện**: chỉ làm mục mà người dùng đã duyệt và Agent BE đã báo API ở §5.

### Không agent nào tự làm (cần người)
- `ROADMAP.md` Plan 4 & Plan 10, `QUESTIONS_FOR_KSVH.md`: chờ Phòng KSVH trả lời Q2, Q3, Q5, Q6, Q7, Q9, Q10, Q11, Q12.
- `PLAN_APPEAL_REVIEW_AND_NOTIFICATION.md`: đã được làm theo giá trị mặc định trong ROADMAP Plan 1–2; chỉnh lại khi có trả lời Q6/Q9.
- Kiểm tra tổng cuối cùng (§6) sau khi cả hai hàng đều hết.

## 8. Việc mới: phương án tạm cho câu hỏi KSVH (18/11/2026)
Nguồn: mục "Phương án TẠM ÁP DỤNG" cuối `docs/QUESTIONS_FOR_KSVH.md`. Chèn vào **đầu** hàng đợi §7 của mỗi agent (ưu tiên hơn tối ưu).
Mọi con số qua `@ConfigurationProperties` (có mặc định), ghi "tạm áp dụng – chờ KSVH" trong comment. Đổi API → ghi §5.

**Agent BE**
1. **Q5 – hạn CHT phản hồi**: cấu hình `app.finding.response-days=3`; job hằng ngày (chung giờ với job quá hạn): lỗi `OPEN` quá N/2 ngày → nhắc CHT;
   quá N ngày → **không đổi trạng thái**, phát sự kiện thông báo OBM + Quản lý KSVH (mỗi lỗi một lần, có cột/bảng ghi đã báo để không lặp);
   API lỗi trả thêm `responseOverdue: boolean` + lọc `responseOverdue=true`. Test: không tự xác nhận, không +1, chỉ báo 1 lần.
2. **Q6 – hạn thẩm định**: cấu hình `app.appeal.review-days=3`; job: khiếu nại `APPEALED` quá hạn còn người `PENDING` → chuyển `APPEAL_MEETING`
   + sự kiện `AppealMeetingRequiredEvent`; ghi `finding_events` (actor hệ thống, note "Hết hạn thẩm định"). Test.
3. **Q2** test chốt: quá hạn rồi nghiệm thu chưa đạt trong cùng vòng → chỉ +1 mỗi vòng.
4. **Q7** kiểm tra dashboard + 5 báo cáo dùng điểm sau khiếu nại (lỗi `DISMISSED` = Đạt); sửa nếu chưa.
5. **Q10** giới hạn video ở server: presign `video/*` ≤ 50 MB (cấu hình riêng `max-video-bytes`), ảnh giữ 10 MB. Test.
6. **Q12** kiểm tra sự kiện M4: người nhận gồm EXECUTIVE + KSVH_MANAGER, có link tải biên bản, phát khi lỗi chốt M4 (xác nhận / giữ lỗi / tính lại lên M4).
7. **Q9** mặc định Zalo tắt; không gửi Zalo nếu chưa cấu hình khoá ZNS.

**Agent FE** (sau khi BE báo API ở §5)
1. **Q5**: nhãn "Quá hạn phản hồi" ở bảng lỗi và thẻ lỗi mobile; bộ lọc; thẻ đếm trên dashboard.
2. **Q6**: chi tiết khiếu nại hiện hạn thẩm định và ai chưa đánh giá.
3. **Q7**: chi tiết phiếu hiện "Tuân thủ khi chấm" và "Sau khiếu nại"; "x / y tiêu chí" tính trừ N/A.
4. **Q10**: chặn video > 60 giây / > 50 MB ngay khi chọn, báo lỗi tiếng Việt.
5. **Q9**: trang cài đặt thông báo – Zalo mặc định tắt, ẩn nếu server báo chưa cấu hình.
