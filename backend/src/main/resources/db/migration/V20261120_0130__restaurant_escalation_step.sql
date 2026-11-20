-- ====================================================================
-- SỐ BẬC NÂNG RIÊNG THEO NHÀ HÀNG
-- Bổ sung cho V20261119_1900: ngoài ngưỡng và số tháng hạ mức, nhà hàng có thể khai báo
-- số bậc nâng mức ảnh hưởng riêng (+1..+4) khi chạm ngưỡng. NULL = theo quy tắc nâng mức chung.
-- Mức trần (max_impact) vẫn luôn theo quy tắc chung.
-- ====================================================================

ALTER TABLE org_units
    ADD COLUMN escalation_step SMALLINT CHECK (escalation_step BETWEEN 1 AND 4);

COMMENT ON COLUMN org_units.escalation_step IS
    'Số bậc nâng mức ảnh hưởng riêng của nhà hàng khi chạm ngưỡng (1–4); NULL = theo quy tắc nâng mức chung';
