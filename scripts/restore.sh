#!/bin/bash
# ==============================================================================
# Script phục hồi dữ liệu PostgreSQL & MinIO Media cho KSVH QC
# Cách dùng: ./scripts/restore.sh <file_db_backup.sql.gz> [file_media_backup.tar.gz]
# ==============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Sử dụng: $0 <path_to_db_backup.sql.gz> [path_to_media.tar.gz]"
    exit 1
fi

DB_BACKUP_FILE="$1"
MEDIA_BACKUP_FILE="${2:-}"
DB_NAME="${DB_NAME:-ksvh_qc}"
DB_USER="${DB_USERNAME:-postgres}"

if [ ! -f "$DB_BACKUP_FILE" ]; then
    echo "LỖI: Không tìm thấy file sao lưu $DB_BACKUP_FILE" >&2
    exit 1
fi

echo "===================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bắt đầu phục hồi cơ sở dữ liệu KSVH QC..."
echo "File DB: $DB_BACKUP_FILE"

# 1. Phục hồi Database
if command -v docker &> /dev/null && docker ps | grep -q "ksvh-postgres"; then
    echo "-> Đang giải nén và nạp vào container ksvh-postgres..."
    gunzip -c "$DB_BACKUP_FILE" | docker exec -i ksvh-postgres psql -U "$DB_USER" "$DB_NAME"
elif command -v psql &> /dev/null; then
    echo "-> Đang giải nén và nạp vào local PostgreSQL..."
    gunzip -c "$DB_BACKUP_FILE" | psql -U "$DB_USER" -h "${DB_HOST:-localhost}" "$DB_NAME"
else
    echo "LỖI: Không tìm thấy lệnh psql hoặc container ksvh-postgres!" >&2
    exit 1
fi

echo "✓ Phục hồi Database thành công."

# 2. Phục hồi Media nếu được cung cấp
if [ -n "$MEDIA_BACKUP_FILE" ] && [ -f "$MEDIA_BACKUP_FILE" ]; then
    echo "-> Đang phục hồi kho ảnh MinIO từ $MEDIA_BACKUP_FILE..."
    if command -v docker &> /dev/null && docker volume inspect project-ksvh_miniodata &> /dev/null; then
        docker run --rm \
            -v project-ksvh_miniodata:/data \
            -v "$(dirname "$MEDIA_BACKUP_FILE")":/backup \
            alpine tar -xzf "/backup/$(basename "$MEDIA_BACKUP_FILE")" -C /data
        echo "✓ Phục hồi Media thành công."
    fi
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] QUY TRÌNH PHỤC HỒI HOÀN TẤT THÀNH CÔNG!"
echo "===================================================================="
