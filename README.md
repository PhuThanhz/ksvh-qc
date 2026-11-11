# KSVH QC – Phần mềm Kiểm soát vận hành

Chấm điểm QC: quản lý trên **dashboard web**, nhân viên **đi chấm bằng điện thoại qua trình duyệt** (GPS check-in, chụp ảnh bằng chứng có đóng dấu, xuất Excel/PDF).

| Thư mục | Nội dung |
|---|---|
| `backend/` | Java 21 + Spring Boot 4 (Maven) – API, JWT, Flyway |
| `frontend/` | React + TypeScript + Vite – `/admin` (dashboard) và `/qc` (mobile) |
| `docs/` | Tech stack, tài liệu nghiệp vụ |

Chi tiết công nghệ: [docs/TECH_STACK.md](docs/TECH_STACK.md).

## Yêu cầu
- Java 21, Node 20+, PostgreSQL 17 (Homebrew: `brew services start postgresql@17`)
- MinIO (lưu ảnh) – chỉ cần khi test chụp ảnh: `docker compose up -d minio minio-init` hoặc `brew install minio/stable/minio`

## Chạy lần đầu
```bash
# 1. Tạo database (một lần)
psql -h localhost -d postgres -c "CREATE DATABASE ksvh_qc;"

# 2. Backend – http://localhost:8088 (Flyway tự tạo bảng)
cd backend && ./mvnw spring-boot:run

# 3. Frontend – terminal khác
cd frontend && npm install && npm run dev:http   # http://localhost:5273
```

Tài khoản dev (admin / manager / auditor) được tạo tự động ở profile `dev`, xem `app.seed.users` trong
[backend/src/main/resources/application-dev.yml](backend/src/main/resources/application-dev.yml).

## Địa chỉ hữu ích
| | |
|---|---|
| App (máy tính) | http://localhost:5273 |
| Swagger UI | http://localhost:8088/swagger-ui.html |
| Health | http://localhost:8088/actuator/health |
| MinIO console | http://localhost:9001 |

## Test trên điện thoại (GPS + camera)
Trình duyệt điện thoại chỉ cho dùng GPS/camera qua **HTTPS**.
1. Điện thoại và máy tính cùng Wi-Fi.
2. `cd frontend && npm run dev` → Vite in ra `https://<IP-máy-tính>:5273`.
3. Chạy backend với `S3_PUBLIC_ENDPOINT=https://<IP-máy-tính>:5273 ./mvnw spring-boot:run` để upload ảnh đi qua proxy HTTPS của Vite.
4. Mở địa chỉ đó trên điện thoại, chấp nhận cảnh báo chứng chỉ tự ký, vào **Thử GPS & ảnh**.

## Biến môi trường backend
| Biến | Mặc định (dev) |
|---|---|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | `jdbc:postgresql://localhost:5432/ksvh_qc` / `postgres` / `postgres` |
| `JWT_SECRET` | giá trị dev; **bắt buộc đặt** ở môi trường thật (≥ 32 ký tự) |
| `AUTH_ALLOWED_ORIGINS` | rỗng (dev); môi trường thật đặt domain, vd `https://qc.ksvh.vn` |
| `S3_PUBLIC_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | `https://localhost:5273`, `ksvh-qc`, `minioadmin`, `minioadmin` |
| `SPRING_PROFILES_ACTIVE` | `dev` |

## Sau khi đổi API backend
```bash
cd frontend && npm run api:types   # backend phải đang chạy
```

## Lệnh kiểm tra
```bash
cd backend && ./mvnw verify          # build + test (cần Postgres đang chạy)
cd frontend && npm run typecheck && npm run lint && npm run build
```
