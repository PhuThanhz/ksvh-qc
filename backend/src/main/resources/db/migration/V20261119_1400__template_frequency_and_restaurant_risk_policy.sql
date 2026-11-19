-- ====================================================================
-- KỲ ĐẾM TẦN SUẤT & NGƯỠNG NÂNG MỨC RỦI RO THEO MẪU PHIẾU
-- VÀ CHÍNH SÁCH KIỂM SOÁT RỦI RO THEO NHÀ HÀNG (FINE DINING / TIÊU CHUẨN)
-- ====================================================================

-- 1. Thêm cấu hình kỳ đếm và ngưỡng nâng mức rủi ro vào mẫu phiếu chấm (inspection_templates)
ALTER TABLE inspection_templates
    ADD COLUMN IF NOT EXISTS frequency_period_months INTEGER DEFAULT 6 CHECK (frequency_period_months BETWEEN 1 AND 24),
    ADD COLUMN IF NOT EXISTS escalation_threshold_count INTEGER DEFAULT 3 CHECK (escalation_threshold_count BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS reset_period_months INTEGER DEFAULT 6 CHECK (reset_period_months BETWEEN 1 AND 24);

COMMENT ON COLUMN inspection_templates.frequency_period_months IS 'Kỳ đếm cuốn tính tần suất lỗi (tháng, mặc định 6, 1-24)';
COMMENT ON COLUMN inspection_templates.escalation_threshold_count IS 'Số lần tái phạm trong kỳ để kích hoạt nâng mức rủi ro (mặc định 3, 1-10)';
COMMENT ON COLUMN inspection_templates.reset_period_months IS 'Số tháng liên tục sạch lỗi để hạ về mức rủi ro gốc (mặc định 6, 1-24)';

-- 2. Thêm chính sách rủi ro vào nhà hàng / đơn vị (org_units)
ALTER TABLE org_units
    ADD COLUMN IF NOT EXISTS risk_policy VARCHAR(20) NOT NULL DEFAULT 'STANDARD' CHECK (risk_policy IN ('STANDARD', 'STRICT'));

COMMENT ON COLUMN org_units.risk_policy IS 'Chính sách kiểm soát rủi ro: STANDARD (Tiêu chuẩn), STRICT (Khắt khe - áp dụng Fine Dining như Tenku, Ussina)';

-- 3. Cập nhật chính sách STRICT cho các nhà hàng Fine Dining thuộc Lotus Group
UPDATE org_units
SET risk_policy = 'STRICT'
WHERE code IN ('USS-LM81', 'TNK-LM81');
