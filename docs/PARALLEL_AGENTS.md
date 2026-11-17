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
