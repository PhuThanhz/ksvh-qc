-- Khoá lạc quan: tránh 2 người thao tác cùng lúc (vd. xác nhận 2 lần → tần suất +2).
ALTER TABLE inspections ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE findings ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Ngày hẹn CHT tự chọn (≤ hạn khắc phục theo mức rủi ro). deadline_date giữ nguyên là hạn do server tính.
ALTER TABLE findings ADD COLUMN remediation_target_date DATE;
COMMENT ON COLUMN findings.remediation_target_date IS 'Ngày hẹn khắc phục do CHT chọn, không vượt deadline_date';

-- Lịch sử thao tác trên lỗi (quy tắc 4: ai làm, lúc nào). Chỉ thêm, không sửa/xoá.
CREATE TABLE finding_events
(
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    finding_id  BIGINT      NOT NULL REFERENCES findings (id) ON DELETE CASCADE,
    action      VARCHAR(40) NOT NULL CHECK (action IN ('CREATED', 'CONFIRMED', 'APPEALED', 'APPEAL_UPHELD',
                                                       'APPEAL_DISMISSED', 'REMEDIATION_PLANNED',
                                                       'REMEDIATION_SUBMITTED', 'VERIFY_PASSED', 'VERIFY_FAILED')),
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    actor_id    BIGINT REFERENCES users (id) ON DELETE SET NULL,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_finding_events_finding_id ON finding_events (finding_id);
CREATE INDEX idx_finding_events_actor_id ON finding_events (actor_id);
COMMENT ON TABLE finding_events IS 'Lịch sử thao tác trên lỗi vi phạm: xác nhận, khiếu nại, kết luận, khắc phục, nghiệm thu';
