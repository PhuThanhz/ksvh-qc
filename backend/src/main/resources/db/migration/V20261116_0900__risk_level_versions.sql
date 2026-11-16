-- Danh mục 7 (phân loại rủi ro) có phiên bản theo ngày hiệu lực như danh mục 8, 9 (DOMAIN_SPEC §3).
-- Mỗi phiên bản là một bộ mức (M1–M4…) cùng effective_from. Không sửa phiên bản đã có hiệu lực.
ALTER TABLE risk_levels ADD COLUMN effective_from DATE;
UPDATE risk_levels SET effective_from = (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
ALTER TABLE risk_levels ALTER COLUMN effective_from SET NOT NULL;

ALTER TABLE risk_levels DROP CONSTRAINT risk_levels_code_key;
ALTER TABLE risk_levels ADD CONSTRAINT uq_risk_levels_code_effective_from UNIQUE (code, effective_from);
CREATE INDEX idx_risk_levels_effective_from ON risk_levels (effective_from);
COMMENT ON COLUMN risk_levels.effective_from IS 'Ngày bắt đầu áp dụng bộ mức rủi ro này';
