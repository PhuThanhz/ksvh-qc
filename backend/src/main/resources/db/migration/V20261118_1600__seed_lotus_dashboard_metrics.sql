-- Clean existing historical sample inspections before re-inserting
DELETE FROM findings WHERE description LIKE '%tiêu chuẩn%' OR description LIKE '%PCCC%' OR description LIKE '%Katsu%' OR description LIKE '%nhãn date%';
DELETE FROM inspection_items WHERE inspection_id IN (SELECT id FROM inspections WHERE code LIKE 'PER-26%');
DELETE FROM inspections WHERE code LIKE 'PER-26%';

DO $$
DECLARE
    v_inspector_id BIGINT;
    v_tmpl_id BIGINT;
    v_ins_id BIGINT;
    v_item_id BIGINT;
    v_rest_record RECORD;
BEGIN
    SELECT id INTO v_inspector_id FROM users WHERE username = 'inspector' LIMIT 1;
    SELECT id INTO v_tmpl_id FROM inspection_templates WHERE code = 'TMPL-LOTUS-JP' LIMIT 1;

    -- 1. Tháng 9/2026: 5 đợt kiểm tra hoàn thành
    FOR v_rest_record IN 
        SELECT id, code, name FROM org_units WHERE code IN ('MK-BT', 'MK-TD', 'COCO-LM81', 'YSH-LTT', 'CS-PST')
    LOOP
        INSERT INTO inspections (code, restaurant_id, template_id, inspector_id, inspection_type, status, inspection_mode,
                                checkin_at, submitted_at, completed_at, created_at, updated_at, version)
        VALUES ('PER-2609-' || v_rest_record.code, v_rest_record.id, v_tmpl_id, v_inspector_id, 'PERIODIC', 'COMPLETED', 'ON_SITE',
                '2026-09-15 09:00:00+07', '2026-09-15 11:30:00+07', '2026-09-15 11:30:00+07', '2026-09-15 08:00:00+07', '2026-09-15 11:30:00+07', 1)
        RETURNING id INTO v_ins_id;

        INSERT INTO inspection_items (inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order, evaluated_at)
        SELECT v_ins_id, c.id, c.code, c.name, 'Vệ sinh & An toàn Vận hành', c.base_impact,
               CASE WHEN c.code = 'TC-VS-02' AND v_rest_record.code = 'COCO-LM81' THEN 'FAIL' ELSE 'PASS' END,
               c.sort_order, '2026-09-15 10:00:00+07'
        FROM criteria c;
    END LOOP;

    -- 2. Tháng 10/2026: 6 đợt kiểm tra hoàn thành
    FOR v_rest_record IN 
        SELECT id, code, name FROM org_units WHERE code IN ('MK-VHM', 'MK-VIVO', 'COCO-LTT', 'TNK-LM81', 'UM-VHM', 'CSV-LTT')
    LOOP
        INSERT INTO inspections (code, restaurant_id, template_id, inspector_id, inspection_type, status, inspection_mode,
                                checkin_at, submitted_at, completed_at, created_at, updated_at, version)
        VALUES ('PER-2610-' || v_rest_record.code, v_rest_record.id, v_tmpl_id, v_inspector_id, 'PERIODIC', 'COMPLETED', 'ON_SITE',
                '2026-10-16 09:00:00+07', '2026-10-16 11:30:00+07', '2026-10-16 11:30:00+07', '2026-10-16 08:00:00+07', '2026-10-16 11:30:00+07', 1)
        RETURNING id INTO v_ins_id;

        INSERT INTO inspection_items (inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order, evaluated_at)
        SELECT v_ins_id, c.id, c.code, c.name, 'Vệ sinh & An toàn Vận hành', c.base_impact,
               CASE WHEN c.code = 'TC-VC-01' AND v_rest_record.code = 'UM-VHM' THEN 'FAIL' ELSE 'PASS' END,
               c.sort_order, '2026-10-16 10:00:00+07'
        FROM criteria c;
    END LOOP;

    -- 3. Tháng 11/2026: 6 đợt kiểm tra hoàn thành / gửi kết quả
    FOR v_rest_record IN 
        SELECT id, code, name FROM org_units WHERE code IN ('MK-BT', 'MK-VCC', 'COCO-VCDK', 'CS-SGC', 'USS-LM81', 'CSV-TD')
    LOOP
        INSERT INTO inspections (code, restaurant_id, template_id, inspector_id, inspection_type, status, inspection_mode,
                                checkin_at, submitted_at, completed_at, created_at, updated_at, version)
        VALUES ('PER-2611-' || v_rest_record.code || '-HIST', v_rest_record.id, v_tmpl_id, v_inspector_id, 'PERIODIC', 'AWAITING_ACK', 'ON_SITE',
                '2026-11-10 09:00:00+07', '2026-11-10 11:30:00+07', '2026-11-10 11:30:00+07', '2026-11-10 08:00:00+07', '2026-11-10 11:30:00+07', 1)
        RETURNING id INTO v_ins_id;

        INSERT INTO inspection_items (inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order, evaluated_at)
        SELECT v_ins_id, c.id, c.code, c.name, 'Vệ sinh & An toàn Vận hành', c.base_impact,
               CASE WHEN c.code = 'TC-VS-02' AND v_rest_record.code = 'MK-BT' THEN 'FAIL'
                    WHEN c.code = 'TC-VC-03' AND v_rest_record.code = 'USS-LM81' THEN 'FAIL'
                    ELSE 'PASS' END,
               c.sort_order, '2026-11-10 10:00:00+07'
        FROM criteria c;
    END LOOP;
END $$;

-- 4. Seed findings để các biểu đồ rủi ro M1-M4 và lỗi đang mở hiển thị sinh động
INSERT INTO findings (inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact,
                      violation_count, calculated_score, risk_level_code, risk_level_name, remediation_days, deadline_date,
                      status, description, created_at, updated_at, version)
SELECT i.id, ii.id, i.restaurant_id, ii.criterion_id, ii.base_impact, ii.base_impact,
       1, 15, 'M2', 'Mức 2 - Nghiêm trọng', 14, CURRENT_DATE + INTERVAL '10 days',
       'OPEN', 'Nhiệt độ tủ đông -14°C chưa đạt tiêu chuẩn (-18°C đến -22°C)', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE, 1
FROM inspections i
JOIN inspection_items ii ON ii.inspection_id = i.id AND ii.result = 'FAIL'
WHERE i.code LIKE 'PER-2611-MK-BT%'
LIMIT 1;

INSERT INTO findings (inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact,
                      violation_count, calculated_score, risk_level_code, risk_level_name, remediation_days, deadline_date,
                      status, description, created_at, updated_at, version)
SELECT i.id, ii.id, i.restaurant_id, ii.criterion_id, ii.base_impact, ii.base_impact,
       2, 28, 'M3', 'Mức 3 - Rất nghiêm trọng', 7, CURRENT_DATE + INTERVAL '4 days',
       'REMEDIATING', 'Bình PCCC tại sảnh Landmark 81 hết hạn kiểm định cần thay thế khẩn cấp', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE, 1
FROM inspections i
JOIN inspection_items ii ON ii.inspection_id = i.id AND ii.result = 'FAIL'
WHERE i.code LIKE 'PER-2611-USS%'
LIMIT 1;

INSERT INTO findings (inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact,
                      violation_count, calculated_score, risk_level_code, risk_level_name, remediation_days, deadline_date,
                      status, description, created_at, updated_at, version, verified_at)
SELECT i.id, ii.id, i.restaurant_id, ii.criterion_id, ii.base_impact, ii.base_impact,
       1, 8, 'M1', 'Mức 1 - Nhẹ', 30, '2026-10-30',
       'CLOSED', 'Đã vệ sinh chụp hút và bảo trì quạt thông gió khu bếp', '2026-10-16 11:30:00+07', '2026-10-25 15:00:00+07', 1, '2026-10-25 15:00:00+07'
FROM inspections i
JOIN inspection_items ii ON ii.inspection_id = i.id AND ii.result = 'FAIL'
WHERE i.code LIKE 'PER-2610-UM%'
LIMIT 1;
