# KSVH QC – Phần mềm Kiểm soát Vận hành & Quản trị Chất lượng

Hệ thống số hoá và chuẩn hoá toàn diện quy trình Kiểm soát Vận hành (KSVH QC): quản lý trên **dashboard web máy tính**, nhân viên **chấm điểm hiện trường bằng điện thoại di động** (GPS check-in, chụp ảnh đóng dấu vị trí thời gian thực, lưu nháp ngoại tuyến, quy trình khiếu nại hội đồng thẩm định, nghiệm thu kết quả khắc phục, xuất Excel & PDF).

---

## Cấu trúc Dự án
| Thư mục / Tệp | Nội dung |
|---|---|
| `backend/` | Java 21 + Spring Boot 4 (Spring Modulith, Maven, PostgreSQL 17, Flyway, MinIO S3, OpenPDF, Apache POI) |
| `frontend/` | React 19 + TypeScript + Vite + Ant Design (Web Desktop) & Ant Design Mobile (Web Responsive) |
| `docs/` | Tài liệu kiến trúc, nghiệp vụ, lộ trình phát triển và sổ tay người dùng |
| `scripts/` | Script sao lưu (`backup.sh`) và phục hồi dữ liệu (`restore.sh`) tự động |
| `docker-compose.yml` | Khởi chạy toàn bộ hệ thống bằng Docker chỉ với 1 lệnh |

---

## Tài liệu Dự án
- [Sổ tay Hướng dẫn Sử dụng (8 vai trò)](docs/USER_MANUAL.md)
- [Hướng dẫn Triển khai Production (Docker & Bảo mật)](docs/DEPLOYMENT_GUIDE.md)
- [Lộ trình Hoàn thiện & Trạng thái Tính năng](docs/ROADMAP.md)
- [Đặc tả Nghiệp vụ KSVH](docs/DOMAIN_SPEC.md)
- [Công nghệ & Tech Stack](docs/TECH_STACK.md)

---

## Triển khai Nhanh bằng Docker Compose (Khuyên dùng)
```bash
# 1. Sao chép file cấu hình môi trường
cp .env.example .env

# 2. Khởi chạy toàn bộ hệ thống (PostgreSQL, MinIO, Backend, Frontend Nginx)
docker compose up -d --build

# 3. Truy cập ứng dụng:
# - Giao diện Web: http://localhost (hoặc domain cấu hình)
# - API Backend: http://localhost:8088
# - MinIO S3 Console: http://localhost:9001
```

---

## Chạy Môi trường Phát triển (Dev)
### Yêu cầu
- Java 21 (JDK), Node.js 20+, PostgreSQL 17.
- MinIO (chụp ảnh): `docker compose up -d minio minio-init`.

### Khởi động
```bash
# 1. Tạo database (chỉ cần chạy một lần)
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE ksvh_qc;"

# 2. Khởi động Backend – cổng 8088 (Flyway tự động chạy migration)
cd backend && ./mvnw spring-boot:run

# 3. Khởi động Frontend – cổng 5273
cd frontend && npm install && npm run dev:http
```

### 8 Tài khoản Thử nghiệm (Môi trường Dev)
Mật khẩu mặc định: `<TênVaiTrò>@123` (ví dụ `Admin@123`, `Lead@123`, `Inspector@123`).
| Username | Vai trò | Chức năng chính |
|---|---|---|
| `admin` | SYSTEM_ADMIN | Quản trị tài khoản, phân quyền, xem nhật ký kiểm toán |
| `bizadmin` | BUSINESS_ADMIN | Quản lý danh mục công ty, nhà hàng, nhân viên |
| `lead` | KSVH_LEAD | Lập kế hoạch kiểm tra tháng, phân công, danh mục tiêu chí |
| `manager` | KSVH_MANAGER | Duyệt kế hoạch, chủ trì họp khiếu nại, giám sát hồ sơ rủi ro |
| `inspector` | KSVH_INSPECTOR | Check-in GPS, chấm điểm hiện trường, nghiệm thu khắc phục |
| `store` | STORE_MANAGER | Ký biên bản, khiếu nại lỗi (24h), nộp bằng chứng khắc phục |
| `obm` | OBM | Tham gia hội đồng khiếu nại, đôn đốc khu vực |
| `executive` | EXECUTIVE | Bảng điều hành tổng hợp, nhận cảnh báo M4, phân tích Pareto |

---

## Sao lưu & Phục hồi Dữ liệu
```bash
# Sao lưu cơ sở dữ liệu PostgreSQL và MinIO Media
./scripts/backup.sh

# Phục hồi dữ liệu từ bản sao lưu
./scripts/restore.sh ./backups/ksvh_qc_db_YYYYMMDD_HHMMSS.sql.gz ./backups/minio_media_YYYYMMDD_HHMMSS.tar.gz
```

---

## Kiểm tra Chất lượng Mã nguồn (CI/CD)
```bash
# 1. Kiểm tra Backend (100 tests pass + Spring Modulith compliant)
cd backend && ./mvnw test

# 2. Kiểm tra Frontend (TypeScript typecheck + Oxlint + Vite build)
cd frontend && npm run typecheck && npm run lint && npm run build
```
