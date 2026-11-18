#!/bin/bash
# ==============================================================================
# Script tự động sao lưu dữ liệu PostgreSQL & MinIO Media cho KSVH QC
# Chạy thủ công: ./scripts/backup.sh
# Hoặc cấu hình Cron: 0 2 * * * /path/to/project/scripts/backup.sh >> /var/log/ksvh_backup.log 2>&1
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-ksvh_qc}"
DB_USER="${DB_USERNAME:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

echo "===================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bắt đầu quy trình sao lưu KSVH QC..."
echo "Thư mục lưu trữ: $BACKUP_DIR"

# 1. Sao lưu PostgreSQL Database
DB_BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_db_${TIMESTAMP}.sql.gz"
echo "-> Đang xuất cơ sở dữ liệu '$DB_NAME'..."

if command -v docker &> /dev/null && docker ps | grep -q "ksvh-postgres"; then
    docker exec ksvh-postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$DB_BACKUP_FILE"
elif command -v pg_dump &> /dev/null; then
    pg_dump -U "$DB_USER" -h "${DB_HOST:-localhost}" "$DB_NAME" | gzip > "$DB_BACKUP_FILE"
else
    echo "LỖI: Không tìm thấy lệnh pg_dump hoặc container ksvh-postgres!" >&2
    exit 1
fi

DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
echo "✓ Sao lưu Database thành công: $DB_BACKUP_FILE ($DB_SIZE)"

# 2. Sao lưu MinIO Media (ảnh vi phạm, bằng chứng khắc phục)
MEDIA_BACKUP_FILE="$BACKUP_DIR/minio_media_${TIMESTAMP}.tar.gz"
echo "-> Đang sao lưu kho ảnh MinIO..."

if command -v docker &> /dev/null && docker volume inspect project-ksvh_miniodata &> /dev/null; then
    docker run --rm \
        -v project-ksvh_miniodata:/data:ro \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar -czf "/backup/minio_media_${TIMESTAMP}.tar.gz" -C /data .
    echo "✓ Sao lưu Media thành công: $MEDIA_BACKUP_FILE"
elif [ -d "./miniodata" ]; then
    tar -czf "$MEDIA_BACKUP_FILE" -C "./miniodata" .
    echo "✓ Sao lưu Media thành công: $MEDIA_BACKUP_FILE"
else
    echo "ℹ Bỏ qua sao lưu Media (không phát hiện thư mục/volume miniodata)."
fi

# 3. Tạo file SHA256 Checksum
echo "-> Đang tính toán mã băm SHA256..."
cd "$BACKUP_DIR"
sha256sum "$(basename "$DB_BACKUP_FILE")" > "${TIMESTAMP}_checksums.sha256"
if [ -f "$(basename "$MEDIA_BACKUP_FILE")" ]; then
    sha256sum "$(basename "$MEDIA_BACKUP_FILE")" >> "${TIMESTAMP}_checksums.sha256"
fi
cd - > /dev/null

# 4. Dọn dẹp bản sao lưu cũ vượt quá RETENTION_DAYS
echo "-> Xoá các bản sao lưu cũ hơn $RETENTION_DAYS ngày..."
find "$BACKUP_DIR" -type f -mtime "+$RETENTION_DAYS" -exec rm -f {} \;

echo "[$(date '+%Y-%m-%d %H:%M:%S')] QUY TRÌNH SAO LƯU HOÀN TẤT THÀNH CÔNG!"
echo "===================================================================="
