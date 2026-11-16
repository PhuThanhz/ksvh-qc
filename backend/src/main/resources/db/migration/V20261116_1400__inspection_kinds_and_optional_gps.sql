-- Theo tài liệu nghiệp vụ (Word "Ví dụ quy trình kiểm tra ... YS-LTT"), đã chốt với người dùng 16/11/2026.

-- 1. Bỏ "loại nhà hàng": không dùng để chọn mẫu phiếu nữa.
ALTER TABLE org_units DROP COLUMN restaurant_type;
ALTER TABLE inspection_templates DROP COLUMN restaurant_type;

-- 2. Toạ độ GPS nhà hàng chưa bắt buộc (chỉ ghi nhận vị trí khi bắt đầu kiểm tra, không chặn).
ALTER TABLE org_units DROP CONSTRAINT ck_org_units_restaurant_gps;
ALTER TABLE org_units ADD CONSTRAINT ck_org_units_gps_pair
    CHECK ((latitude IS NULL) = (longitude IS NULL));

-- 3. Loại kiểm tra: định kỳ tháng (đủ mẫu phiếu, thực tế) / đột xuất (theo chuyên đề = nhóm tiêu chí).
UPDATE inspections SET inspection_type = CASE WHEN inspection_type ILIKE '%đột%' THEN 'SURPRISE' ELSE 'PERIODIC' END;
ALTER TABLE inspections ALTER COLUMN inspection_type TYPE VARCHAR(20);
ALTER TABLE inspections ALTER COLUMN inspection_type SET DEFAULT 'PERIODIC';
ALTER TABLE inspections ADD CONSTRAINT ck_inspections_type CHECK (inspection_type IN ('PERIODIC', 'SURPRISE'));

-- Hình thức: thực tế tại nhà hàng / từ xa. Định kỳ tháng luôn thực tế.
ALTER TABLE inspections ADD COLUMN inspection_mode VARCHAR(20) NOT NULL DEFAULT 'ON_SITE'
    CHECK (inspection_mode IN ('ON_SITE', 'REMOTE'));
ALTER TABLE inspections ADD CONSTRAINT ck_inspections_periodic_on_site
    CHECK (inspection_type <> 'PERIODIC' OR inspection_mode = 'ON_SITE');

-- Phiếu đột xuất không dùng mẫu phiếu; phiếu định kỳ bắt buộc có mẫu.
ALTER TABLE inspections ALTER COLUMN template_id DROP NOT NULL;
ALTER TABLE inspections ADD CONSTRAINT ck_inspections_periodic_template
    CHECK (inspection_type <> 'PERIODIC' OR template_id IS NOT NULL);

-- Kết quả xác nhận vị trí khi bắt đầu kiểm tra.
ALTER TABLE inspections ADD COLUMN location_status VARCHAR(20)
    CHECK (location_status IN ('VERIFIED', 'OUTSIDE_RADIUS', 'UNVERIFIED', 'REMOTE'));
UPDATE inspections SET location_status = 'VERIFIED' WHERE checkin_at IS NOT NULL AND checkin_distance_m IS NOT NULL;
COMMENT ON COLUMN inspections.location_status IS 'VERIFIED trong bán kính · OUTSIDE_RADIUS ngoài bán kính (vẫn cho kiểm tra) · UNVERIFIED không có toạ độ · REMOTE kiểm tra từ xa';

-- Chuyên đề của phiếu đột xuất (nhóm tiêu chí được kích hoạt).
CREATE TABLE inspection_topics
(
    inspection_id      BIGINT NOT NULL REFERENCES inspections (id) ON DELETE CASCADE,
    criterion_group_id BIGINT NOT NULL REFERENCES criterion_groups (id) ON DELETE RESTRICT,
    PRIMARY KEY (inspection_id, criterion_group_id)
);
CREATE INDEX idx_inspection_topics_criterion_group_id ON inspection_topics (criterion_group_id);
COMMENT ON TABLE inspection_topics IS 'Nhóm tiêu chí (chuyên đề) được kích hoạt cho phiếu kiểm tra đột xuất';
