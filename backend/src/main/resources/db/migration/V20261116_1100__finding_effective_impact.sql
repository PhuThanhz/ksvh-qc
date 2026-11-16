-- Mức ảnh hưởng hiệu lực (sau khi áp dụng nâng mức, DOMAIN_SPEC §6.4) dùng để tính điểm.
-- base_impact giữ mức gốc của tiêu chí; điểm = effective_impact × violation_count.
ALTER TABLE findings ADD COLUMN effective_impact SMALLINT;
UPDATE findings SET effective_impact = base_impact;
ALTER TABLE findings ALTER COLUMN effective_impact SET NOT NULL;
ALTER TABLE findings ADD CONSTRAINT ck_findings_effective_impact CHECK (effective_impact BETWEEN 1 AND 5);
COMMENT ON COLUMN findings.effective_impact IS 'Mức ảnh hưởng sau nâng mức tại thời điểm tính điểm';
