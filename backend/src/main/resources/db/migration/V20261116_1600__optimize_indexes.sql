-- Tối ưu hoá chỉ mục (indexes) cho các truy vấn thống kê, dashboard và lịch sử vi phạm.

-- 1. Thống kê theo ngày nộp phiếu và lọc theo nhà hàng + trạng thái
CREATE INDEX idx_inspections_submitted_at ON inspections (submitted_at);
CREATE INDEX idx_inspections_res_status ON inspections (restaurant_id, status);

-- 2. Thống kê lỗi quá hạn và xu hướng theo thời gian
CREATE INDEX idx_findings_status_deadline ON findings (status, deadline_date);
CREATE INDEX idx_findings_created_at ON findings (created_at);

-- 3. Tối ưu tải lịch sử thao tác của lỗi (FindingEvent) theo thứ tự thời gian
CREATE INDEX idx_finding_events_finding_created ON finding_events (finding_id, created_at ASC, id ASC);
