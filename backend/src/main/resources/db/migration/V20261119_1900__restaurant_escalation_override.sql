-- ====================================================================
-- NGƯỠNG NÂNG / HẠ MỨC RIÊNG THEO NHÀ HÀNG
-- Thay cho chính sách rủi ro STANDARD / STRICT (V20261119_1400, V20261119_1700):
--  * impact_escalation_rules trở lại một chuỗi phiên bản chung cho cả chuỗi.
--  * Nhà hàng cần khác (vd fine dining) khai báo ngưỡng / kỳ hạ mức riêng; để trống = theo quy tắc chung.
-- ====================================================================

-- 1. Ngưỡng riêng trên nhà hàng
ALTER TABLE org_units
    ADD COLUMN escalation_threshold SMALLINT CHECK (escalation_threshold BETWEEN 2 AND 50),
    ADD COLUMN escalation_reset_months SMALLINT CHECK (escalation_reset_months BETWEEN 1 AND 24);

COMMENT ON COLUMN org_units.escalation_threshold IS
    'Ngưỡng nâng mức riêng của nhà hàng (số lần lỗi trong kỳ đếm); NULL = theo quy tắc nâng mức chung';
COMMENT ON COLUMN org_units.escalation_reset_months IS
    'Số tháng liên tục không lỗi để hạ về mức gốc, riêng của nhà hàng; NULL = theo quy tắc nâng mức chung';

-- 2. Giữ đúng cách tính đang chạy: nhà hàng Khắt khe → ngưỡng riêng 2 lần
UPDATE org_units SET escalation_threshold = 2 WHERE risk_policy = 'STRICT';

ALTER TABLE org_units DROP COLUMN risk_policy;

-- 3. Quy tắc nâng mức trở lại một chuỗi phiên bản chung
DELETE FROM impact_escalation_rules WHERE risk_policy <> 'STANDARD';
ALTER TABLE impact_escalation_rules DROP CONSTRAINT uq_impact_escalation_rules_policy_date;
ALTER TABLE impact_escalation_rules DROP COLUMN risk_policy;
ALTER TABLE impact_escalation_rules
    ADD CONSTRAINT impact_escalation_rules_effective_from_key UNIQUE (effective_from);
