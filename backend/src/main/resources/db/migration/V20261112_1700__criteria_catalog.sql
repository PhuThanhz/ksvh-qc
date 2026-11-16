-- Danh mục 5–9 (docs/DOMAIN_SPEC.md §3, §6): nhóm tiêu chí, tiêu chí, mẫu phiếu, phân loại rủi ro,
-- cấu hình tần suất, quy tắc nâng mức ảnh hưởng. Không xoá tiêu chí / mẫu phiếu: chỉ ngưng hoạt động.

-- 5. Nhóm tiêu chí và tiêu chí
CREATE TABLE criterion_groups
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(30)  NOT NULL,
    name       VARCHAR(200) NOT NULL,
    sort_order INTEGER      NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX uq_criterion_groups_code ON criterion_groups (lower(code));
CREATE INDEX idx_criterion_groups_updated_by ON criterion_groups (updated_by);
COMMENT ON TABLE criterion_groups IS 'Nhóm tiêu chí chấm (vd: Vệ sinh, Kho, Tiền)';

CREATE TABLE criteria
(
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id          BIGINT       NOT NULL REFERENCES criterion_groups (id) ON DELETE RESTRICT,
    code              VARCHAR(30)  NOT NULL,
    name              VARCHAR(300) NOT NULL,
    check_method      TEXT,
    evidence_required TEXT,
    base_impact       SMALLINT     NOT NULL CHECK (base_impact BETWEEN 1 AND 5),
    sort_order        INTEGER      NOT NULL DEFAULT 0,
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by        BIGINT REFERENCES users (id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX uq_criteria_code ON criteria (lower(code));
CREATE INDEX idx_criteria_group_id ON criteria (group_id);
CREATE INDEX idx_criteria_updated_by ON criteria (updated_by);
COMMENT ON TABLE criteria IS 'Tiêu chí / điểm rủi ro: cách kiểm tra, bằng chứng yêu cầu, mức ảnh hưởng gốc (1–5)';

-- 6. Mẫu phiếu chấm
CREATE TABLE inspection_templates
(
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(30)  NOT NULL,
    name            VARCHAR(200) NOT NULL,
    restaurant_type VARCHAR(100),
    inspection_type VARCHAR(100),
    description     VARCHAR(500),
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by      BIGINT REFERENCES users (id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX uq_inspection_templates_code ON inspection_templates (lower(code));
CREATE INDEX idx_inspection_templates_updated_by ON inspection_templates (updated_by);
COMMENT ON TABLE inspection_templates IS 'Mẫu phiếu chấm: bộ tiêu chí theo loại nhà hàng (trống = mọi loại) / loại kiểm tra';

CREATE TABLE template_criteria
(
    template_id  BIGINT  NOT NULL REFERENCES inspection_templates (id) ON DELETE CASCADE,
    criterion_id BIGINT  NOT NULL REFERENCES criteria (id) ON DELETE RESTRICT,
    sort_order   INTEGER NOT NULL,
    PRIMARY KEY (template_id, criterion_id)
);
CREATE INDEX idx_template_criteria_criterion_id ON template_criteria (criterion_id);
COMMENT ON TABLE template_criteria IS 'Tiêu chí thuộc mẫu phiếu, kèm thứ tự hiển thị khi chấm';

-- 7. Phân loại rủi ro. Khoảng điểm [min_score, max_score); max_score NULL = không giới hạn trên.
CREATE TABLE risk_levels
(
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code             VARCHAR(10)   NOT NULL UNIQUE,
    name             VARCHAR(100)  NOT NULL,
    min_score        NUMERIC(8, 2) NOT NULL CHECK (min_score >= 0),
    max_score        NUMERIC(8, 2),
    remediation_days INTEGER       NOT NULL CHECK (remediation_days > 0),
    action           VARCHAR(500),
    sort_order       INTEGER       NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_by       BIGINT REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_risk_levels_range CHECK (max_score IS NULL OR max_score > min_score)
);
CREATE INDEX idx_risk_levels_updated_by ON risk_levels (updated_by);
COMMENT ON TABLE risk_levels IS 'Mức rủi ro M1–M4: khoảng điểm [min, max), hạn khắc phục, hành động';

-- 8. Cấu hình tần suất: mỗi dòng là một phiên bản, áp dụng từ effective_from. Không sửa bản cũ.
CREATE TABLE frequency_configs
(
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    period_months  SMALLINT    NOT NULL CHECK (period_months IN (3, 6)),
    effective_from DATE        NOT NULL UNIQUE,
    note           VARCHAR(500),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by     BIGINT REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX idx_frequency_configs_created_by ON frequency_configs (created_by);
COMMENT ON TABLE frequency_configs IS 'Kỳ đếm tần suất lỗi (3 hoặc 6 tháng) theo ngày hiệu lực';

-- 9. Quy tắc nâng mức ảnh hưởng: phiên bản theo ngày hiệu lực. Không sửa bản cũ.
CREATE TABLE impact_escalation_rules
(
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    threshold_count     SMALLINT    NOT NULL CHECK (threshold_count >= 2),
    step_increase       SMALLINT    NOT NULL CHECK (step_increase BETWEEN 1 AND 4),
    max_impact          SMALLINT    NOT NULL CHECK (max_impact BETWEEN 1 AND 5),
    reset_period_months SMALLINT    NOT NULL CHECK (reset_period_months BETWEEN 1 AND 24),
    effective_from      DATE        NOT NULL UNIQUE,
    note                VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          BIGINT REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX idx_impact_escalation_rules_created_by ON impact_escalation_rules (created_by);
COMMENT ON TABLE impact_escalation_rules IS 'Nâng mức ảnh hưởng khi lỗi lặp lại: ngưỡng, số bậc tăng, mức trần, kỳ hạ lại';

-- Số liệu VÍ DỤ trong tài liệu nghiệp vụ (slide 14–16). Phòng KSVH cần xác nhận và sửa trên giao diện.
INSERT INTO risk_levels (code, name, min_score, max_score, remediation_days, action, sort_order)
VALUES ('M1', 'Thấp', 0, 1, 60, 'Theo dõi và chuẩn hoá', 1),
       ('M2', 'Trung bình', 1, 6, 30, 'Khắc phục có kế hoạch', 2),
       ('M3', 'Cao', 6, 12, 7, 'Khắc phục, phòng ngừa và kiểm tra lại', 3),
       ('M4', 'Nghiêm trọng', 12, NULL, 1, 'Lập biên bản, báo cáo lãnh đạo', 4);

INSERT INTO frequency_configs (period_months, effective_from, note)
VALUES (6, CURRENT_DATE, 'Giá trị ví dụ trong tài liệu nghiệp vụ – cần Phòng KSVH xác nhận');

INSERT INTO impact_escalation_rules (threshold_count, step_increase, max_impact, reset_period_months, effective_from, note)
VALUES (3, 1, 5, 6, CURRENT_DATE, 'Giá trị ví dụ trong tài liệu nghiệp vụ – cần Phòng KSVH xác nhận');
