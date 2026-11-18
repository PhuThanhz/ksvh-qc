-- Kỳ đếm tần suất: bỏ giới hạn cứng 3 hoặc 6 tháng, cho phép số tháng bất kỳ từ 1 đến 24
-- (cùng giới hạn với kỳ hạ mức ở escalation_rules). Phòng KSVH tự quyết kỳ đếm theo từng phiên bản.
ALTER TABLE frequency_configs DROP CONSTRAINT frequency_configs_period_months_check;
ALTER TABLE frequency_configs ADD CONSTRAINT ck_frequency_configs_period_months CHECK (period_months BETWEEN 1 AND 24);
COMMENT ON TABLE frequency_configs IS 'Kỳ đếm tần suất lỗi (1–24 tháng, PDF gợi ý 3 hoặc 6) theo ngày hiệu lực';
