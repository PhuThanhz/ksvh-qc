# Hướng dẫn Triển khai Hệ thống KSVH QC (Production Deployment Guide)

Tài liệu hướng dẫn triển khai thực tế hệ thống Kiểm soát Vận hành (KSVH QC) trên môi trường Production bằng Docker Compose, đảm bảo tính sẵn sàng, bảo mật cao và vận hành ổn định.

---

## 1. Yêu cầu Hệ thống

### 1.1. Cấu hình Máy chủ (Server / VPS)
- **Hệ điều hành:** Ubuntu 22.04 LTS / 24.04 LTS hoặc Debian 12.
- **Phần cứng tối thiểu:**
  - CPU: 2 Cores (x86_64 hoặc ARM64).
  - RAM: 4 GB (JVM backend cấp 2 GB, PostgreSQL 1 GB, hệ điều hành và Nginx 1 GB).
  - Disk: 40 GB SSD (NVMe khuyến nghị cho PostgreSQL và MinIO Media).
- **Phần cứng khuyến nghị (từ 50+ nhà hàng):**
  - CPU: 4 Cores.
  - RAM: 8 GB.
  - Disk: 100 GB SSD.

### 1.2. Phần mềm cài đặt sẵn trên Host
- Docker Engine $\ge 26.0$.
- Docker Compose plugin $\ge v2.25$.
- Git, OpenSSL, curl, gzip, tar.

---

## 2. Quy trình Triển khai 1 Lệnh

### Bước 1: Sao chép mã nguồn & Chuẩn bị thư mục
```bash
git clone <git-repo-url> /opt/ksvh-qc
cd /opt/ksvh-qc
```

### Bước 2: Thiết lập biến môi trường
Sao chép mẫu cấu hình:
```bash
cp .env.example .env
nano .env
```
*Lưu ý các biến quan trọng:*
1. `JWT_SECRET`: Chuỗi ngẫu nhiên tối thiểu 32 ký tự (sinh bằng `openssl rand -hex 32`).
2. `DB_PASSWORD`: Mật khẩu cơ sở dữ liệu mạnh.
3. `S3_SECRET_KEY`: Mật khẩu kho lưu trữ ảnh MinIO mạnh.
4. `APP_CLIENT_URL`: Domain chính thức của web (vd: `https://qc.ksvh.vn`).
5. `CORS_ALLOWED_ORIGINS` & `AUTH_ALLOWED_ORIGINS`: Khớp với tên miền chính thức.

### Bước 3: Khởi chạy toàn bộ hệ thống bằng Docker Compose
```bash
docker compose up -d --build
```
Hệ thống sẽ tự động thực hiện:
- Khởi động cơ sở dữ liệu PostgreSQL 17 và MinIO S3.
- Chờ container database và minio đạt trạng thái healthy.
- Tự động tạo bucket `ksvh-qc` trong MinIO.
- Build mã nguồn Spring Boot bằng Maven và đóng gói image tối ưu Eclipse Temurin 21.
- Tự động chạy tất cả các bản migration Flyway cập nhật schema mới nhất.
- Build mã nguồn React và phục vụ qua Nginx Alpine.

### Bước 4: Kiểm tra trạng thái dịch vụ
```bash
docker compose ps
```
Tất cả 5 containers (`ksvh-postgres`, `ksvh-minio`, `ksvh-minio-init`, `ksvh-backend`, `ksvh-frontend`) phải ở trạng thái `running` hoặc `healthy` (`ksvh-minio-init` hoàn thành với mã `0`).

---

## 3. Cấu hình HTTPS (Bắt buộc cho Điện thoại di động)

Trình duyệt di động (iOS Safari, Android Chrome) **bắt buộc HTTPS** để cho phép truy cập:
- Vị trí GPS hiện trường (`navigator.geolocation`).
- Camera chụp ảnh bằng chứng vi phạm (`capture="environment"`).

### Sử dụng Nginx Reverse Proxy trên Host kèm Let's Encrypt Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Tạo cấu hình Nginx host (`/etc/nginx/sites-available/qc.ksvh.vn`):
```nginx
server {
    server_name qc.ksvh.vn;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Kích hoạt và cấp chứng chỉ SSL miễn phí:
```bash
sudo ln -s /etc/nginx/sites-available/qc.ksvh.vn /etc/nginx/sites-enabled/
sudo certbot --nginx -d qc.ksvh.vn
```

---

## 4. Tự động Sao lưu Dữ liệu (Backup & Disaster Recovery)

### 4.1. Lập lịch sao lưu tự động hằng ngày
Hệ thống cung cấp sẵn script sao lưu toàn vẹn cả PostgreSQL và MinIO Media tại `scripts/backup.sh`.
Mở cấu hình crontab của máy chủ:
```bash
crontab -e
```
Thêm dòng sau để tự động sao lưu lúc 02:00 sáng mỗi ngày:
```cron
0 2 * * * cd /opt/ksvh-qc && ./scripts/backup.sh >> /var/log/ksvh_backup.log 2>&1
```

### 4.2. Phục hồi dữ liệu khi có sự cố
Để phục hồi lại toàn bộ hệ thống từ file backup:
```bash
cd /opt/ksvh-qc
./scripts/restore.sh ./backups/ksvh_qc_db_YYYYMMDD_HHMMSS.sql.gz [./backups/minio_media_YYYYMMDD_HHMMSS.tar.gz]
```

---

## 5. Giám sát & Vận hành

| Hạng mục | Lệnh / Địa chỉ |
|---|---|
| Health Check | `curl -f http://localhost:8088/actuator/health` |
| Xem log backend | `docker compose logs -f backend` |
| Xem log frontend | `docker compose logs -f frontend` |
| Khởi động lại hệ thống | `docker compose restart` |
| Dừng hệ thống | `docker compose down` |
