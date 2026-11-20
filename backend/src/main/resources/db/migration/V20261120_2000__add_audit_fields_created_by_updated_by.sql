-- Bổ sung đầy đủ 4 trường audit (created_at, created_by, updated_at, updated_by)
-- cho toàn bộ các bảng nghiệp vụ kế thừa BaseEntity

-- 1. users: đã có updated_by, bổ sung created_by
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users (created_by);
COMMENT ON COLUMN users.created_by IS 'Người tạo tài khoản';

-- 2. roles: đã có updated_by, bổ sung created_by
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_roles_created_by ON roles (created_by);
COMMENT ON COLUMN roles.created_by IS 'Người tạo vai trò';

-- 3. employees: đã có updated_by, bổ sung created_by
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees (created_by);
COMMENT ON COLUMN employees.created_by IS 'Người tạo nhân viên';

-- 4. companies: bổ sung cả created_by và updated_by
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies (created_by);
CREATE INDEX IF NOT EXISTS idx_companies_updated_by ON companies (updated_by);
COMMENT ON COLUMN companies.created_by IS 'Người tạo công ty';
COMMENT ON COLUMN companies.updated_by IS 'Người cập nhật công ty lần cuối';

-- 5. org_units (nhà hàng / chi nhánh / phòng ban): bổ sung cả created_by và updated_by
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_org_units_created_by ON org_units (created_by);
CREATE INDEX IF NOT EXISTS idx_org_units_updated_by ON org_units (updated_by);
COMMENT ON COLUMN org_units.created_by IS 'Người tạo đơn vị / nhà hàng';
COMMENT ON COLUMN org_units.updated_by IS 'Người cập nhật đơn vị / nhà hàng lần cuối';

-- 6. criterion_groups: đã có updated_by, bổ sung created_by
ALTER TABLE criterion_groups ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_criterion_groups_created_by ON criterion_groups (created_by);
COMMENT ON COLUMN criterion_groups.created_by IS 'Người tạo nhóm tiêu chí';

-- 7. criteria: đã có updated_by, bổ sung created_by
ALTER TABLE criteria ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_criteria_created_by ON criteria (created_by);
COMMENT ON COLUMN criteria.created_by IS 'Người tạo tiêu chí';

-- 8. inspection_templates: đã có updated_by, bổ sung created_by
ALTER TABLE inspection_templates ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inspection_templates_created_by ON inspection_templates (created_by);
COMMENT ON COLUMN inspection_templates.created_by IS 'Người tạo mẫu phiếu kiểm tra';

-- 9. risk_levels: đã có updated_by, bổ sung created_by
ALTER TABLE risk_levels ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_risk_levels_created_by ON risk_levels (created_by);
COMMENT ON COLUMN risk_levels.created_by IS 'Người tạo mức rủi ro';

-- 10. inspection_plans: đã có created_by, bổ sung updated_by
ALTER TABLE inspection_plans ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inspection_plans_updated_by ON inspection_plans (updated_by);
COMMENT ON COLUMN inspection_plans.updated_by IS 'Người cập nhật kế hoạch kiểm tra lần cuối';

-- 11. inspections: đã có created_by, bổ sung updated_by
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inspections_updated_by ON inspections (updated_by);
COMMENT ON COLUMN inspections.updated_by IS 'Người cập nhật phiếu kiểm tra lần cuối';

-- 12. findings: bổ sung cả created_by và updated_by
ALTER TABLE findings ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_findings_created_by ON findings (created_by);
CREATE INDEX IF NOT EXISTS idx_findings_updated_by ON findings (updated_by);
COMMENT ON COLUMN findings.created_by IS 'Người phát hiện / tạo lỗi vi phạm';
COMMENT ON COLUMN findings.updated_by IS 'Người cập nhật lỗi vi phạm lần cuối';

-- Backfill created_by cho findings từ inspector_id của phiếu kiểm tra tương ứng
UPDATE findings f
SET created_by = i.inspector_id
FROM inspections i
WHERE f.inspection_id = i.id AND f.created_by IS NULL;

-- 13. inspection_plan_assignments: bổ sung cả created_by và updated_by
ALTER TABLE inspection_plan_assignments ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE inspection_plan_assignments ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_plan_assignments_created_by ON inspection_plan_assignments (created_by);
CREATE INDEX IF NOT EXISTS idx_plan_assignments_updated_by ON inspection_plan_assignments (updated_by);
COMMENT ON COLUMN inspection_plan_assignments.created_by IS 'Người tạo phân công kiểm tra';
COMMENT ON COLUMN inspection_plan_assignments.updated_by IS 'Người cập nhật phân công kiểm tra lần cuối';

-- Backfill created_by cho assignments từ created_by của plan tương ứng
UPDATE inspection_plan_assignments a
SET created_by = p.created_by
FROM inspection_plans p
WHERE a.plan_id = p.id AND a.created_by IS NULL;

-- 14. appeal_reviews: bổ sung cả created_by và updated_by
ALTER TABLE appeal_reviews ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE appeal_reviews ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_appeal_reviews_created_by ON appeal_reviews (created_by);
CREATE INDEX IF NOT EXISTS idx_appeal_reviews_updated_by ON appeal_reviews (updated_by);
COMMENT ON COLUMN appeal_reviews.created_by IS 'Người tạo thẩm định khiếu nại';
COMMENT ON COLUMN appeal_reviews.updated_by IS 'Người cập nhật thẩm định khiếu nại lần cuối';

-- 15. user_notification_preferences: bổ sung created_by và updated_by
ALTER TABLE user_notification_preferences ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE user_notification_preferences ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_user_notif_pref_created_by ON user_notification_preferences (created_by);
CREATE INDEX IF NOT EXISTS idx_user_notif_pref_updated_by ON user_notification_preferences (updated_by);

-- 16. notification_dispatches: bổ sung created_by và updated_by
ALTER TABLE notification_dispatches ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE notification_dispatches ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_notif_dispatches_created_by ON notification_dispatches (created_by);
CREATE INDEX IF NOT EXISTS idx_notif_dispatches_updated_by ON notification_dispatches (updated_by);
