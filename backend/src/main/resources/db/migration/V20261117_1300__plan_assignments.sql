-- Bước 1 – Phân công & phê duyệt (DOMAIN_SPEC §4, PDF s.9):
-- Kế hoạch chứa danh sách phân công (nhà hàng × chuyên viên × mẫu phiếu × ngày dự kiến).
-- Quản lý KSVH duyệt → phần mềm tự tạo phiếu chấm cho từng dòng và ghi lại inspection_id.
CREATE TABLE inspection_plan_assignments
(
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_id        BIGINT      NOT NULL REFERENCES inspection_plans (id) ON DELETE CASCADE,
    restaurant_id  BIGINT      NOT NULL REFERENCES org_units (id),
    inspector_id   BIGINT      NOT NULL REFERENCES users (id),
    template_id    BIGINT      NOT NULL REFERENCES inspection_templates (id),
    scheduled_date DATE        NOT NULL,
    sort_order     INTEGER     NOT NULL DEFAULT 0,
    inspection_id  BIGINT REFERENCES inspections (id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Kiểm tra định kỳ: mỗi nhà hàng một lần trong một kế hoạch
    CONSTRAINT uq_plan_assignments_restaurant UNIQUE (plan_id, restaurant_id)
);

CREATE INDEX idx_plan_assignments_plan ON inspection_plan_assignments (plan_id);
CREATE INDEX idx_plan_assignments_restaurant ON inspection_plan_assignments (restaurant_id);
CREATE INDEX idx_plan_assignments_inspector ON inspection_plan_assignments (inspector_id);
CREATE INDEX idx_plan_assignments_template ON inspection_plan_assignments (template_id);
CREATE INDEX idx_plan_assignments_inspection ON inspection_plan_assignments (inspection_id);

COMMENT ON TABLE inspection_plan_assignments IS
    'Phân công trong kế hoạch kiểm tra: nhà hàng, chuyên viên, mẫu phiếu, ngày dự kiến; inspection_id = phiếu tạo khi duyệt';
