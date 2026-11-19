-- ====================================================================
-- QUY TẮC NÂNG / HẠ MỨC THEO CHÍNH SÁCH RỦI RO CỦA NHÀ HÀNG
-- Thay cho cấu hình kỳ đếm / ngưỡng trên từng mẫu phiếu (V20261119_1400):
--  * Kỳ đếm tần suất chỉ khai báo một nơi: frequency_configs (theo ngày hiệu lực).
--  * Ngưỡng nâng mức / kỳ hạ mức khai báo theo chính sách (STANDARD / STRICT),
--    mỗi chính sách có phiên bản theo ngày hiệu lực riêng; nhà hàng chọn chính sách.
-- ====================================================================

-- 1. Gắn chính sách cho từng phiên bản quy tắc nâng mức
ALTER TABLE impact_escalation_rules
    ADD COLUMN risk_policy VARCHAR(20) NOT NULL DEFAULT 'STANDARD'
        CHECK (risk_policy IN ('STANDARD', 'STRICT'));

ALTER TABLE impact_escalation_rules DROP CONSTRAINT impact_escalation_rules_effective_from_key;
ALTER TABLE impact_escalation_rules
    ADD CONSTRAINT uq_impact_escalation_rules_policy_date UNIQUE (risk_policy, effective_from);

COMMENT ON COLUMN impact_escalation_rules.risk_policy IS
    'Chính sách rủi ro áp dụng: STANDARD (Tiêu chuẩn) hoặc STRICT (Khắt khe – fine dining). Nhà hàng chọn qua org_units.risk_policy';

-- 2. Tạo sẵn phiên bản Khắt khe, giữ đúng cách tính đang chạy (ngưỡng 2 lần, các thông số khác như Tiêu chuẩn)
INSERT INTO impact_escalation_rules
    (risk_policy, threshold_count, step_increase, max_impact, reset_period_months, effective_from, note)
SELECT 'STRICT', 2, step_increase, max_impact, reset_period_months, effective_from,
       'Chính sách Khắt khe (fine dining) – giá trị khởi tạo, cần Phòng KSVH xác nhận'
FROM impact_escalation_rules
WHERE risk_policy = 'STANDARD'
ORDER BY effective_from
LIMIT 1;

-- 3. Bỏ cấu hình kỳ đếm / ngưỡng trên mẫu phiếu (chưa có dữ liệu riêng, toàn giá trị mặc định 6/3/6)
ALTER TABLE inspection_templates
    DROP COLUMN frequency_period_months,
    DROP COLUMN escalation_threshold_count,
    DROP COLUMN reset_period_months;
