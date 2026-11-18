-- Plan 5: Phiếu kiểm tra kết quả khắc phục (VERIFICATION)
-- 1. Bổ sung loại kiểm tra VERIFICATION vào ck_inspections_type
ALTER TABLE inspections DROP CONSTRAINT ck_inspections_type;
ALTER TABLE inspections ADD CONSTRAINT ck_inspections_type
    CHECK (inspection_type IN ('PERIODIC', 'SURPRISE', 'VERIFICATION'));

-- 2. Liên kết từng dòng trong phiếu kiểm tra với lỗi vi phạm đang được nghiệm thu
ALTER TABLE inspection_items ADD COLUMN finding_id BIGINT REFERENCES findings (id) ON DELETE SET NULL;
CREATE INDEX idx_inspection_items_finding_id ON inspection_items (finding_id);
COMMENT ON COLUMN inspection_items.finding_id IS 'Liên kết tới lỗi vi phạm đang được nghiệm thu khắc phục (loại phiếu VERIFICATION)';
