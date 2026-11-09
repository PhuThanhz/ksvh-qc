# Tech stack – Phần mềm Kiểm soát vận hành (KSVH / QC)

Đã chốt ngày 09/11/2026.

## Frontend – ReactJS
| Hạng mục | Lựa chọn |
|---|---|
| Nền tảng | React 19 + TypeScript + Vite (cổng dev 5273) |
| Dashboard quản lý (`/admin`) | Ant Design, biểu đồ ECharts, bản đồ Leaflet |
| Màn hình chấm QC trên điện thoại (`/qc`) | Ant Design Mobile |
| Gọi API / state | Axios + TanStack Query, Zustand |
| Form | react-hook-form + zod |
| Điều hướng | React Router |
| GPS | `navigator.geolocation.watchPosition`, `enableHighAccuracy`, lấy mẫu có accuracy tốt nhất |
| Chụp ảnh | `<input type="file" accept="image/*" capture="environment">` (camera gốc), nén ảnh, đóng dấu giờ / GPS / người chấm |

## Backend – Java Spring Boot
| Hạng mục | Lựa chọn |
|---|---|
| Nền tảng | Java 21 + Spring Boot 4.1.2, build bằng Maven (`./mvnw`) |
| Bảo mật | Spring Security OAuth2 Resource Server + JWT HS256 (access 30 phút, refresh 14 ngày) |
| Database | **PostgreSQL 16+** (quản lý bằng pgAdmin hoặc DBeaver), Spring Data JPA; có thể bật PostGIS cho truy vấn GPS |
| Migration | Flyway (`backend/src/main/resources/db/migration`) |
| Lưu ảnh | MinIO (tương thích S3), presigned URL ký bằng AWS SDK v2 |
| Xuất báo cáo | Apache POI (Excel), OpenPDF (PDF) |
| Tài liệu API | springdoc-openapi (Swagger UI) |

## Ghi chú
- Web chạy bắt buộc qua **HTTPS** (trình duyệt chặn GPS/camera trên HTTP).
- Server tự kiểm tra khoảng cách GPS tới điểm chấm (Haversine), không tin số liệu từ client.
- Tạo database trước (mặc định UTF-8, lưu tiếng Việt thoải mái):
  ```sql
  CREATE DATABASE ksvh_qc;
  ```
- Bảng do Flyway tạo; không tạo/sửa bảng bằng tay trong pgAdmin/DBeaver để tránh lệch với migration.
