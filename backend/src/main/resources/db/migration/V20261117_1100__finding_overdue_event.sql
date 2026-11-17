-- Job quá hạn khắc phục (DOMAIN_SPEC §4 bước 5.4, PDF s.7, s.13): lỗi quá hạn mà chưa nghiệm thu đạt
-- → +1 tần suất (finding_occurrences.source = 'OVERDUE', đã có) và ghi lịch sử với action 'OVERDUE' (thêm ở đây).
-- Sự kiện do job tạo không có người thực hiện (actor_id NULL = hệ thống).
ALTER TABLE finding_events DROP CONSTRAINT finding_events_action_check;
ALTER TABLE finding_events ADD CONSTRAINT finding_events_action_check CHECK (action IN (
    'CREATED', 'CONFIRMED', 'APPEALED', 'APPEAL_UPHELD', 'APPEAL_DISMISSED',
    'REMEDIATION_PLANNED', 'REMEDIATION_SUBMITTED', 'VERIFY_PASSED', 'VERIFY_FAILED', 'OVERDUE'));

-- Job quét lỗi theo trạng thái + hạn khắc phục mỗi ngày.
CREATE INDEX IF NOT EXISTS idx_findings_status_deadline ON findings (status, deadline_date);
