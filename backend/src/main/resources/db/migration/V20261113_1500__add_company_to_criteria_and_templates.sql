-- Thêm cột company_id vào criterion_groups và inspection_templates
-- Cho phép gán nhóm tiêu chí / mẫu phiếu cho một công ty cụ thể, hoặc để NULL = Dùng chung cho toàn hệ thống.

ALTER TABLE criterion_groups ADD COLUMN company_id BIGINT REFERENCES companies (id) ON DELETE SET NULL;
CREATE INDEX idx_criterion_groups_company_id ON criterion_groups (company_id);
COMMENT ON COLUMN criterion_groups.company_id IS 'Công ty áp dụng nhóm tiêu chí (NULL = dùng chung toàn hệ thống)';

ALTER TABLE inspection_templates ADD COLUMN company_id BIGINT REFERENCES companies (id) ON DELETE SET NULL;
CREATE INDEX idx_inspection_templates_company_id ON inspection_templates (company_id);
COMMENT ON COLUMN inspection_templates.company_id IS 'Công ty áp dụng mẫu phiếu (NULL = dùng chung toàn hệ thống)';
