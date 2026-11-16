-- Luồng nghiệp vụ cốt lõi KSVH (docs/DOMAIN_SPEC.md §4, §5):
-- 1. Kế hoạch kiểm tra (inspection_plans)
-- 2. Phiếu chấm điểm (inspections) & chi tiết tiêu chí (inspection_items)
-- 3. Lỗi vi phạm (findings) & lịch sử tần suất vi phạm (finding_occurrences)

CREATE TABLE inspection_plans
(
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_code        VARCHAR(30)  NOT NULL,
    title            VARCHAR(200) NOT NULL,
    start_date       DATE         NOT NULL,
    end_date         DATE         NOT NULL,
    status           VARCHAR(30)  NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    rejection_reason VARCHAR(500),
    notes            VARCHAR(1000),
    created_by       BIGINT REFERENCES users (id) ON DELETE SET NULL,
    approved_by      BIGINT REFERENCES users (id) ON DELETE SET NULL,
    approved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_plan_dates CHECK (end_date >= start_date)
);
CREATE UNIQUE INDEX uq_inspection_plans_code ON inspection_plans (lower(plan_code));
CREATE INDEX idx_inspection_plans_status ON inspection_plans (status);
CREATE INDEX idx_inspection_plans_created_by ON inspection_plans (created_by);
COMMENT ON TABLE inspection_plans IS 'Kế hoạch kiểm tra KSVH: Trưởng nhóm lập, Quản lý duyệt';

CREATE TABLE inspections
(
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code               VARCHAR(30)      NOT NULL,
    plan_id            BIGINT REFERENCES inspection_plans (id) ON DELETE SET NULL,
    restaurant_id      BIGINT           NOT NULL REFERENCES org_units (id) ON DELETE RESTRICT,
    template_id        BIGINT           NOT NULL REFERENCES inspection_templates (id) ON DELETE RESTRICT,
    inspector_id       BIGINT           NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    inspection_type    VARCHAR(50)      NOT NULL DEFAULT 'Định kỳ',
    status             VARCHAR(30)      NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED')),
    cancel_reason      VARCHAR(500),
    checkin_lat        DOUBLE PRECISION,
    checkin_lng        DOUBLE PRECISION,
    checkin_distance_m DOUBLE PRECISION,
    checkin_at         TIMESTAMPTZ,
    submitted_at       TIMESTAMPTZ,
    completed_at       TIMESTAMPTZ,
    notes              VARCHAR(1000),
    created_by         BIGINT REFERENCES users (id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ      NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_inspections_code ON inspections (lower(code));
CREATE INDEX idx_inspections_plan_id ON inspections (plan_id);
CREATE INDEX idx_inspections_restaurant_id ON inspections (restaurant_id);
CREATE INDEX idx_inspections_inspector_id ON inspections (inspector_id);
CREATE INDEX idx_inspections_status ON inspections (status);
COMMENT ON TABLE inspections IS 'Phiếu chấm điểm kiểm tra tại nhà hàng';

CREATE TABLE inspection_items
(
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inspection_id  BIGINT       NOT NULL REFERENCES inspections (id) ON DELETE CASCADE,
    criterion_id   BIGINT       NOT NULL REFERENCES criteria (id) ON DELETE RESTRICT,
    criterion_code VARCHAR(30)  NOT NULL,
    criterion_name VARCHAR(300) NOT NULL,
    group_name     VARCHAR(200),
    base_impact    SMALLINT     NOT NULL CHECK (base_impact BETWEEN 1 AND 5),
    result         VARCHAR(20)  NOT NULL DEFAULT 'UNRATED' CHECK (result IN ('UNRATED', 'PASS', 'FAIL', 'NA')),
    comment        TEXT,
    evidence_urls  TEXT,
    sort_order     INTEGER      NOT NULL DEFAULT 0,
    evaluated_at   TIMESTAMPTZ
);
CREATE INDEX idx_inspection_items_inspection_id ON inspection_items (inspection_id);
CREATE INDEX idx_inspection_items_criterion_id ON inspection_items (criterion_id);
COMMENT ON TABLE inspection_items IS 'Chi tiết đánh giá từng tiêu chí trong phiếu chấm';

CREATE TABLE findings
(
    id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inspection_id             BIGINT      NOT NULL REFERENCES inspections (id) ON DELETE CASCADE,
    inspection_item_id        BIGINT      NOT NULL REFERENCES inspection_items (id) ON DELETE CASCADE,
    restaurant_id             BIGINT      NOT NULL REFERENCES org_units (id) ON DELETE RESTRICT,
    criterion_id              BIGINT      NOT NULL REFERENCES criteria (id) ON DELETE RESTRICT,
    base_impact               SMALLINT    NOT NULL CHECK (base_impact BETWEEN 1 AND 5),
    violation_count           INTEGER     NOT NULL DEFAULT 1,
    calculated_score          INTEGER     NOT NULL DEFAULT 1,
    risk_level_code           VARCHAR(20) NOT NULL,
    risk_level_name           VARCHAR(100),
    remediation_days          INTEGER     NOT NULL DEFAULT 7,
    deadline_date             DATE,
    status                    VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CONFIRMED', 'APPEALED', 'REMEDIATING', 'PENDING_VERIFICATION', 'CLOSED', 'DISMISSED')),
    description               TEXT        NOT NULL,
    evidence_urls             TEXT,
    remediation_plan          TEXT,
    remediation_evidence_urls TEXT,
    remediation_submitted_at  TIMESTAMPTZ,
    verification_comment      TEXT,
    verified_by               BIGINT REFERENCES users (id) ON DELETE SET NULL,
    verified_at               TIMESTAMPTZ,
    appeal_reason             TEXT,
    appeal_evidence_urls      TEXT,
    appeal_submitted_at       TIMESTAMPTZ,
    appeal_concluded_by       BIGINT REFERENCES users (id) ON DELETE SET NULL,
    appeal_conclusion         VARCHAR(30) CHECK (appeal_conclusion IS NULL OR appeal_conclusion IN ('UPHELD', 'DISMISSED')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_findings_inspection_id ON findings (inspection_id);
CREATE INDEX idx_findings_restaurant_id ON findings (restaurant_id);
CREATE INDEX idx_findings_criterion_id ON findings (criterion_id);
CREATE INDEX idx_findings_status ON findings (status);
COMMENT ON TABLE findings IS 'Lỗi vi phạm phát sinh từ tiêu chí Không đạt, theo dõi xác nhận, khiếu nại, khắc phục, nghiệm thu';

CREATE TABLE finding_occurrences
(
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    restaurant_id BIGINT      NOT NULL REFERENCES org_units (id) ON DELETE RESTRICT,
    criterion_id  BIGINT      NOT NULL REFERENCES criteria (id) ON DELETE RESTRICT,
    finding_id    BIGINT REFERENCES findings (id) ON DELETE SET NULL,
    source        VARCHAR(30) NOT NULL CHECK (source IN ('CONFIRMED', 'APPEAL_UPHELD', 'VERIFY_FAILED', 'OVERDUE')),
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_occurrences_res_crit ON finding_occurrences (restaurant_id, criterion_id, occurred_at);
COMMENT ON TABLE finding_occurrences IS 'Lịch sử phát sinh tần suất lỗi của nhà hàng theo tiêu chí để tính điểm rủi ro';
