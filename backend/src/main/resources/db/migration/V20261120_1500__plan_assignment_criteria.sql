-- ====================================================================
-- TIÊU CHÍ CỤ THỂ CỦA DÒNG PHÂN CÔNG ĐỘT XUẤT
-- Kế hoạch đột xuất: mỗi dòng chọn chuyên đề (nhóm tiêu chí) và có thể tick riêng từng tiêu chí
-- trong các nhóm đó. Không tick tiêu chí nào = lấy toàn bộ tiêu chí đang hoạt động của các nhóm.
-- Duyệt kế hoạch sinh phiếu đột xuất chỉ gồm các tiêu chí đã chọn.
-- ====================================================================

CREATE TABLE inspection_plan_assignment_criteria
(
    plan_assignment_id BIGINT NOT NULL REFERENCES inspection_plan_assignments (id) ON DELETE CASCADE,
    criterion_id       BIGINT NOT NULL REFERENCES criteria (id),
    PRIMARY KEY (plan_assignment_id, criterion_id)
);

CREATE INDEX idx_plan_assignment_criteria_criterion_id ON inspection_plan_assignment_criteria (criterion_id);

COMMENT ON TABLE inspection_plan_assignment_criteria IS
    'Tiêu chí cụ thể được chọn cho dòng phân công đột xuất (rỗng = toàn bộ tiêu chí của các chuyên đề)';
