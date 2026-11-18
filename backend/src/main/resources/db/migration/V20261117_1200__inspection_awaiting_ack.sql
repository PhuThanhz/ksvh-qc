-- Phiếu không có lỗi: CHT phải xác nhận "đã xem" rồi phiếu mới hoàn thành (DOMAIN_SPEC §4 bước 3, PDF s.11).
-- SUBMITTED ── không lỗi ──→ AWAITING_ACK → COMPLETED (CHT đã xem). Ghi lại người và thời điểm xác nhận.
ALTER TABLE inspections DROP CONSTRAINT inspections_status_check;
ALTER TABLE inspections ADD CONSTRAINT inspections_status_check CHECK (status IN (
    'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'AWAITING_ACK', 'COMPLETED', 'CANCELLED'));

ALTER TABLE inspections ADD COLUMN acknowledged_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE inspections ADD COLUMN acknowledged_at TIMESTAMPTZ;
CREATE INDEX idx_inspections_acknowledged_by ON inspections (acknowledged_by);

COMMENT ON COLUMN inspections.acknowledged_by IS 'CHT xác nhận đã xem phiếu không có lỗi';
COMMENT ON COLUMN inspections.acknowledged_at IS 'Thời điểm CHT xác nhận đã xem';
