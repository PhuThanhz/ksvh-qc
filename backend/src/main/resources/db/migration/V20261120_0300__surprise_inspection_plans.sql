-- ====================================================================
-- KẾ HOẠCH KIỂM TRA ĐỘT XUẤT
-- Kế hoạch có loại: PERIODIC (định kỳ – mỗi dòng một mẫu phiếu) hoặc SURPRISE (đột xuất – mỗi dòng
-- một hoặc nhiều chuyên đề = nhóm tiêu chí). Duyệt kế hoạch sinh phiếu đúng loại.
-- Kế hoạch cũ đều là định kỳ.
-- ====================================================================

ALTER TABLE inspection_plans
    ADD COLUMN inspection_kind VARCHAR(20) NOT NULL DEFAULT 'PERIODIC'
        CHECK (inspection_kind IN ('PERIODIC', 'SURPRISE'));

COMMENT ON COLUMN inspection_plans.inspection_kind IS
    'Loại kế hoạch: PERIODIC (định kỳ, dòng phân công có mẫu phiếu) | SURPRISE (đột xuất, dòng phân công có chuyên đề)';

-- Dòng phân công đột xuất không có mẫu phiếu (bắt buộc với định kỳ – kiểm tra ở service).
ALTER TABLE inspection_plan_assignments ALTER COLUMN template_id DROP NOT NULL;

CREATE TABLE inspection_plan_assignment_topics
(
    plan_assignment_id BIGINT NOT NULL REFERENCES inspection_plan_assignments (id) ON DELETE CASCADE,
    criterion_group_id BIGINT NOT NULL REFERENCES criterion_groups (id),
    PRIMARY KEY (plan_assignment_id, criterion_group_id)
);

CREATE INDEX idx_plan_assignment_topics_group_id ON inspection_plan_assignment_topics (criterion_group_id);

COMMENT ON TABLE inspection_plan_assignment_topics IS
    'Chuyên đề (nhóm tiêu chí) của dòng phân công trong kế hoạch đột xuất';
