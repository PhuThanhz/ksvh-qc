-- Plan 1: Khiếu nại có N người thẩm định, bất đồng thì họp (PDF s.12, DOMAIN_SPEC §4 bước 4).
-- Thêm trạng thái APPEAL_MEETING cho findings; thêm action APPEAL_REVIEWED, APPEAL_MEETING cho finding_events.
-- Bảng appeal_reviews lưu từng phiếu thẩm định của hội đồng.

ALTER TABLE findings DROP CONSTRAINT IF EXISTS findings_status_check;
ALTER TABLE findings ADD CONSTRAINT findings_status_check CHECK (status IN (
    'OPEN', 'CONFIRMED', 'APPEALED', 'APPEAL_MEETING', 'REMEDIATING', 'PENDING_VERIFICATION', 'CLOSED', 'DISMISSED'
));

ALTER TABLE finding_events DROP CONSTRAINT IF EXISTS finding_events_action_check;
ALTER TABLE finding_events ADD CONSTRAINT finding_events_action_check CHECK (action IN (
    'CREATED', 'CONFIRMED', 'APPEALED', 'APPEAL_REVIEWED', 'APPEAL_MEETING',
    'APPEAL_UPHELD', 'APPEAL_DISMISSED',
    'REMEDIATION_PLANNED', 'REMEDIATION_SUBMITTED', 'VERIFY_PASSED', 'VERIFY_FAILED', 'OVERDUE'
));

ALTER TABLE findings ADD COLUMN IF NOT EXISTS appeal_round INTEGER NOT NULL DEFAULT 1;
COMMENT ON COLUMN findings.appeal_round IS 'Vòng khiếu nại (1, 2...) để liên kết với các lượt thẩm định';

CREATE TABLE appeal_reviews
(
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    finding_id   BIGINT      NOT NULL REFERENCES findings (id) ON DELETE CASCADE,
    reviewer_id  BIGINT      NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    is_ksvh_rep  BOOLEAN     NOT NULL DEFAULT FALSE,
    verdict      VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (verdict IN ('PENDING', 'FINDING_VALID', 'FINDING_INVALID')),
    comment      TEXT,
    reviewed_at  TIMESTAMPTZ,
    appeal_round INTEGER     NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_appeal_reviews_reviewer UNIQUE (finding_id, reviewer_id, appeal_round)
);

CREATE INDEX idx_appeal_reviews_finding ON appeal_reviews (finding_id);
CREATE INDEX idx_appeal_reviews_reviewer ON appeal_reviews (reviewer_id);
CREATE INDEX idx_appeal_reviews_pending ON appeal_reviews (reviewer_id, verdict);

COMMENT ON TABLE appeal_reviews IS 'Ý kiến thẩm định khiếu nại của từng thành viên hội đồng (PDF s.12)';
