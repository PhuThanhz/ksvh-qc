#!/usr/bin/env python3
"""
Tạo các phiếu kiểm tra, lỗi vi phạm, khiếu nại và kết quả nghiệm thu thực tế
cho tháng 11/2026.
"""

import subprocess

sql_content = """
DO $$
DECLARE
    v_inspector_id BIGINT;
    v_lead_id BIGINT;
    v_manager_id BIGINT;
    v_store_id BIGINT;
    v_obm_id BIGINT;
    v_tpl_id BIGINT;
    v_plan_id BIGINT;
    v_kichi_id BIGINT;
    v_gogi_id BIGINT;
    v_manwah_id BIGINT;
    v_kbbq_id BIGINT;
    
    v_ins1_id BIGINT;
    v_ins2_id BIGINT;
    v_ins3_id BIGINT;
    v_ins4_id BIGINT;

    v_c_exit_id BIGINT;
    v_c_oil_id BIGINT;
    v_c_glove_id BIGINT;
    v_c_food_id BIGINT;
    v_c_wc_id BIGINT;
    v_c_fire_id BIGINT;

    v_item_m4_id BIGINT;
    v_item_oil_id BIGINT;
    v_item_glove_id BIGINT;
    v_item_food_id BIGINT;
    v_item_wc_id BIGINT;
    v_item_fire_id BIGINT;

    v_fnd_m4_id BIGINT;
    v_fnd_oil_id BIGINT;
    v_fnd_glove_id BIGINT;
    v_fnd_food_id BIGINT;
    v_fnd_wc_id BIGINT;
    v_fnd_fire_id BIGINT;
BEGIN
    SELECT id INTO v_inspector_id FROM users WHERE username = 'inspector' LIMIT 1;
    SELECT id INTO v_lead_id FROM users WHERE username = 'lead' LIMIT 1;
    SELECT id INTO v_manager_id FROM users WHERE username = 'manager' LIMIT 1;
    SELECT id INTO v_store_id FROM users WHERE username = 'store' LIMIT 1;
    SELECT id INTO v_obm_id FROM users WHERE username = 'obm' LIMIT 1;

    SELECT id INTO v_tpl_id FROM inspection_templates WHERE lower(code) = 'mp-ksvh-70' LIMIT 1;
    SELECT id INTO v_plan_id FROM inspection_plans WHERE lower(plan_code) = 'kh-202611-001' LIMIT 1;

    SELECT id INTO v_kichi_id FROM org_units WHERE lower(code) = 'kichi-01' LIMIT 1;
    SELECT id INTO v_gogi_id FROM org_units WHERE lower(code) = 'gogi-01' LIMIT 1;
    SELECT id INTO v_manwah_id FROM org_units WHERE lower(code) = 'manwah-01' LIMIT 1;
    SELECT id INTO v_kbbq_id FROM org_units WHERE lower(code) = 'kbbq-01' LIMIT 1;

    SELECT id INTO v_c_exit_id FROM criteria WHERE lower(code) = 'tc-vc-04' LIMIT 1;
    SELECT id INTO v_c_oil_id FROM criteria WHERE lower(code) = 'tc-vs-04' LIMIT 1;
    SELECT id INTO v_c_glove_id FROM criteria WHERE lower(code) = 'tc-bp-01' LIMIT 1;
    SELECT id INTO v_c_food_id FROM criteria WHERE lower(code) = 'tc-vs-01' LIMIT 1;
    SELECT id INTO v_c_wc_id FROM criteria WHERE lower(code) = 'tc-vc-09' LIMIT 1;
    SELECT id INTO v_c_fire_id FROM criteria WHERE lower(code) = 'tc-vc-03' LIMIT 1;

    -- 1. Phiếu Kichi-Kichi: PER-2611-KICHI01-01 (Có lỗi M4 khẩn cấp)
    INSERT INTO inspections (code, plan_id, restaurant_id, template_id, inspector_id, inspection_type, inspection_mode,
                             status, location_status, checkin_lat, checkin_lng, checkin_distance_m, checkin_at, submitted_at, completed_at, notes)
    VALUES ('PER-2611-KICHI01-01', v_plan_id, v_kichi_id, v_tpl_id, v_inspector_id, 'PERIODIC', 'ON_SITE',
            'COMPLETED', 'VERIFIED', 10.7774, 106.7022, 12.5, '2026-11-10 09:15:00+07', '2026-11-10 11:45:00+07', '2026-11-10 11:50:00+07',
            'Kiểm tra định kỳ tháng 11 tại Kichi-Kichi Đồng Khởi. Phát hiện 1 lỗi khẩn cấp M4 về lối thoát hiểm.')
    ON CONFLICT (lower(code)) DO UPDATE SET status = 'COMPLETED'
    RETURNING id INTO v_ins1_id;

    -- Gán inspection_id vào bảng phân công
    UPDATE inspection_plan_assignments SET inspection_id = v_ins1_id WHERE plan_id = v_plan_id AND restaurant_id = v_kichi_id;

    -- Nạp items cho phiếu 1: 70 tiêu chí (phần lớn PASS, 3 FAIL)
    INSERT INTO inspection_items (inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order)
    SELECT v_ins1_id, c.id, c.code, c.name, g.name, c.base_impact,
           CASE
               WHEN c.id IN (v_c_exit_id, v_c_oil_id, v_c_glove_id) THEN 'FAIL'
               ELSE 'PASS'
           END,
           c.sort_order
    FROM criteria c
    JOIN criterion_groups g ON g.id = c.group_id
    WHERE NOT EXISTS (SELECT 1 FROM inspection_items WHERE inspection_id = v_ins1_id AND criterion_id = c.id);

    SELECT id INTO v_item_m4_id FROM inspection_items WHERE inspection_id = v_ins1_id AND criterion_id = v_c_exit_id LIMIT 1;
    SELECT id INTO v_item_oil_id FROM inspection_items WHERE inspection_id = v_ins1_id AND criterion_id = v_c_oil_id LIMIT 1;
    SELECT id INTO v_item_glove_id FROM inspection_items WHERE inspection_id = v_ins1_id AND criterion_id = v_c_glove_id LIMIT 1;

    -- Tạo Lỗi M4 Khẩn cấp
    INSERT INTO findings (inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact,
                         violation_count, calculated_score, risk_level_code, risk_level_name, remediation_days, deadline_date,
                         status, description, evidence_urls)
    VALUES (v_ins1_id, v_item_m4_id, v_kichi_id, v_c_exit_id, 4, 4,
            1, 20, 'M4', 'Cực kỳ nghiêm trọng (M4)', 1, '2026-11-11',
            'CONFIRMED', 'Cửa thoát hiểm phía sau kho bị chốt khoá bằng ổ khoá phụ và xếp chồng 4 thùng carton chắn hoàn toàn lối đi. Đèn Exit mất nguồn không sáng.',
            'https://storage.ksvh.vn/evidence/kichi_exit_door_blocked.jpg')
    RETURNING id INTO v_fnd_m4_id;

    UPDATE inspection_items SET finding_id = v_fnd_m4_id WHERE id = v_item_m4_id;

    INSERT INTO finding_occurrences (restaurant_id, criterion_id, finding_id, source, occurred_at)
    VALUES (v_kichi_id, v_c_exit_id, v_fnd_m4_id, 'CONFIRMED', '2026-11-10 11:45:00+07');

    INSERT INTO finding_events (finding_id, action, from_status, to_status, actor_id, note)
    VALUES (v_fnd_m4_id, 'CREATED', 'OPEN', 'OPEN', v_inspector_id, 'Chuyên viên ghi nhận lỗi M4 hiện trường'),
           (v_fnd_m4_id, 'CONFIRMED', 'OPEN', 'CONFIRMED', v_store_id, 'Cửa hàng trưởng xác nhận lỗi và cam kết khắc phục ngay');

    -- Tạo Lỗi dầu chiên (REMEDIATING)
    INSERT INTO findings (inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact,
                         violation_count, calculated_score, risk_level_code, risk_level_name, remediation_days, deadline_date,
                         status, description, remediation_plan, remediation_evidence_urls, remediation_submitted_at)
    VALUES (v_ins1_id, v_item_oil_id, v_kichi_id, v_c_oil_id, 2, 2,
            2, 6, 'M2', 'Trung bình (M2)', 5, '2026-11-15',
            'REMEDIATING', 'Chỉ số phân cực TPM của dầu chiên bếp nóng đạt 27.5% (vượt ngưỡng cho phép < 24%). Dầu sẫm màu.',
            'Đã huỷ bỏ toàn bộ 15 lít dầu cũ và thay dầu mới 100%, đồng thời vệ sinh lòng chảo chiên.',
            'https://storage.ksvh.vn/evidence/kichi_new_oil_testo.jpg', '2026-11-12 14:00:00+07')
    RETURNING id INTO v_fnd_oil_id;

    UPDATE inspection_items SET finding_id = v_fnd_oil_id WHERE id = v_item_oil_id;

    INSERT INTO finding_occurrences (restaurant_id, criterion_id, finding_id, source, occurred_at)
    VALUES (v_kichi_id, v_c_oil_id, v_fnd_oil_id, 'CONFIRMED', '2026-11-10 11:45:00+07');

    -- Tạo Lỗi găng tay (APPEALED - Đang khiếu nại hội đồng)
    INSERT INTO findings (inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact,
                         violation_count, calculated_score, risk_level_code, risk_level_name, remediation_days, deadline_date,
                         status, description, appeal_reason, appeal_submitted_at)
    VALUES (v_ins1_id, v_item_glove_id, v_kichi_id, v_c_glove_id, 2, 2,
            1, 2, 'M1', 'Thấp (M1)', 7, '2026-11-17',
            'APPEALED', 'Nhân viên sơ chế không đeo găng tay khi xử lý thanh cua.',
            'Thời điểm chuyên viên chụp ảnh nhân viên vừa tháo găng tay để chuẩn bị đổi ca và chưa chạm vào thực phẩm.',
            '2026-11-11 10:00:00+07')
    RETURNING id INTO v_fnd_glove_id;

    UPDATE inspection_items SET finding_id = v_fnd_glove_id WHERE id = v_item_glove_id;

    -- Thẩm định khiếu nại của hội đồng
    INSERT INTO appeal_reviews (finding_id, appeal_round, reviewer_id, is_ksvh_rep, verdict, comment, reviewed_at)
    VALUES (v_fnd_glove_id, 1, v_manager_id, true, 'FINDING_VALID', 'Hình ảnh camera cho thấy nhân viên đang đứng tại bàn ra món, vẫn cần đeo găng tay.', '2026-11-11 15:30:00+07'),
           (v_fnd_glove_id, 1, v_obm_id, false, 'FINDING_INVALID', 'Đồng ý với giải trình của CHT, cần xem xét bối cảnh đổi ca.', '2026-11-11 16:00:00+07');

    -- 2. Phiếu Gogi House: PER-2611-GOGI01-01 (Có lỗi đã nghiệm thu thành công)
    INSERT INTO inspections (code, plan_id, restaurant_id, template_id, inspector_id, inspection_type, inspection_mode,
                             status, location_status, checkin_lat, checkin_lng, checkin_distance_m, checkin_at, submitted_at, completed_at, notes)
    VALUES ('PER-2611-GOGI01-01', v_plan_id, v_gogi_id, v_tpl_id, v_inspector_id, 'PERIODIC', 'ON_SITE',
            'COMPLETED', 'VERIFIED', 10.7381, 106.7115, 20.0, '2026-11-08 14:00:00+07', '2026-11-08 16:30:00+07', '2026-11-08 16:40:00+07',
            'Kiểm tra định kỳ Gogi House Nguyễn Thị Thập. Cơ sở vật chất tốt, cần lưu ý tem date.')
    ON CONFLICT (lower(code)) DO UPDATE SET status = 'COMPLETED'
    RETURNING id INTO v_ins2_id;

    UPDATE inspection_plan_assignments SET inspection_id = v_ins2_id WHERE plan_id = v_plan_id AND restaurant_id = v_gogi_id;

    INSERT INTO inspection_items (inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order)
    SELECT v_ins2_id, c.id, c.code, c.name, g.name, c.base_impact,
           CASE
               WHEN c.id = v_c_food_id THEN 'FAIL'
               ELSE 'PASS'
           END,
           c.sort_order
    FROM criteria c
    JOIN criterion_groups g ON g.id = c.group_id
    WHERE NOT EXISTS (SELECT 1 FROM inspection_items WHERE inspection_id = v_ins2_id AND criterion_id = c.id);

    SELECT id INTO v_item_food_id FROM inspection_items WHERE inspection_id = v_ins2_id AND criterion_id = v_c_food_id LIMIT 1;

    -- Lỗi thực phẩm đã được đóng sau khi nghiệm thu
    INSERT INTO findings (inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact,
                         violation_count, calculated_score, risk_level_code, risk_level_name, remediation_days, deadline_date,
                         status, description, remediation_plan, remediation_evidence_urls, verified_by, verified_at, verification_comment)
    VALUES (v_ins2_id, v_item_food_id, v_gogi_id, v_c_food_id, 3, 3,
            1, 6, 'M3', 'Nghiêm trọng (M3)', 3, '2026-11-11',
            'CLOSED', 'Khay thịt ba chỉ bò ướp sốt trong tủ mát không dán nhãn hạn sử dụng và giờ xuất kho.',
            'Đã dán lại toàn bộ tem date theo ca chuẩn SOP và đào tạo lại nhân viên phụ trách kho lạnh.',
            'https://storage.ksvh.vn/evidence/gogi_date_labels_fixed.jpg',
            v_inspector_id, '2026-11-12 10:00:00+07', 'Chuyên viên kiểm tra lại đạt yêu cầu, tem date dán rõ ràng đúng quy cách.')
    RETURNING id INTO v_fnd_food_id;

    UPDATE inspection_items SET finding_id = v_fnd_food_id WHERE id = v_item_food_id;

    INSERT INTO finding_occurrences (restaurant_id, criterion_id, finding_id, source, occurred_at)
    VALUES (v_gogi_id, v_c_food_id, v_fnd_food_id, 'CONFIRMED', '2026-11-08 16:30:00+07');

    -- 3. Phiếu Manwah Tân Phú: PER-2611-MANWAH01-01 (100% ĐẠT - Không có lỗi vi phạm)
    INSERT INTO inspections (code, plan_id, restaurant_id, template_id, inspector_id, inspection_type, inspection_mode,
                             status, location_status, checkin_lat, checkin_lng, checkin_distance_m, checkin_at, submitted_at, completed_at,
                             acknowledged_by, acknowledged_at, notes)
    VALUES ('PER-2611-MANWAH01-01', v_plan_id, v_manwah_id, v_tpl_id, v_inspector_id, 'PERIODIC', 'ON_SITE',
            'COMPLETED', 'VERIFIED', 10.8009, 106.6156, 18.0, '2026-11-12 10:00:00+07', '2026-11-12 12:30:00+07', '2026-11-12 12:45:00+07',
            v_store_id, '2026-11-12 12:40:00+07',
            'Nhà hàng duy trì tiêu chuẩn rất tốt. 100% tiêu chí đạt chuẩn, không ghi nhận lỗi vi phạm.')
    ON CONFLICT (lower(code)) DO UPDATE SET status = 'COMPLETED'
    RETURNING id INTO v_ins3_id;

    UPDATE inspection_plan_assignments SET inspection_id = v_ins3_id WHERE plan_id = v_plan_id AND restaurant_id = v_manwah_id;

    INSERT INTO inspection_items (inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order)
    SELECT v_ins3_id, c.id, c.code, c.name, g.name, c.base_impact, 'PASS', c.sort_order
    FROM criteria c
    JOIN criterion_groups g ON g.id = c.group_id
    WHERE NOT EXISTS (SELECT 1 FROM inspection_items WHERE inspection_id = v_ins3_id AND criterion_id = c.id);

    -- 4. Phiếu King BBQ Diamond Plaza: PER-2611-KBBQ01-01
    INSERT INTO inspections (code, plan_id, restaurant_id, template_id, inspector_id, inspection_type, inspection_mode,
                             status, location_status, checkin_lat, checkin_lng, checkin_distance_m, checkin_at, submitted_at, completed_at, notes)
    VALUES ('PER-2611-KBBQ01-01', v_plan_id, v_kbbq_id, v_tpl_id, v_inspector_id, 'PERIODIC', 'ON_SITE',
            'COMPLETED', 'VERIFIED', 10.7801, 106.6994, 15.0, '2026-11-14 09:00:00+07', '2026-11-14 11:15:00+07', '2026-11-14 11:30:00+07',
            'Kiểm tra định kỳ King BBQ Diamond Plaza.')
    ON CONFLICT (lower(code)) DO UPDATE SET status = 'COMPLETED'
    RETURNING id INTO v_ins4_id;

    UPDATE inspection_plan_assignments SET inspection_id = v_ins4_id WHERE plan_id = v_plan_id AND restaurant_id = v_kbbq_id;

    INSERT INTO inspection_items (inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order)
    SELECT v_ins4_id, c.id, c.code, c.name, g.name, c.base_impact,
           CASE
               WHEN c.id = v_c_fire_id THEN 'FAIL'
               ELSE 'PASS'
           END,
           c.sort_order
    FROM criteria c
    JOIN criterion_groups g ON g.id = c.group_id
    WHERE NOT EXISTS (SELECT 1 FROM inspection_items WHERE inspection_id = v_ins4_id AND criterion_id = c.id);

    SELECT id INTO v_item_fire_id FROM inspection_items WHERE inspection_id = v_ins4_id AND criterion_id = v_c_fire_id LIMIT 1;

    INSERT INTO findings (inspection_id, inspection_item_id, restaurant_id, criterion_id, base_impact, effective_impact,
                         violation_count, calculated_score, risk_level_code, risk_level_name, remediation_days, deadline_date,
                         status, description)
    VALUES (v_ins4_id, v_item_fire_id, v_kbbq_id, v_c_fire_id, 3, 3,
            1, 6, 'M3', 'Nghiêm trọng (M3)', 3, '2026-11-17',
            'CONFIRMED', '2 bình chữa cháy bột tại khu vực quầy thu ngân và cửa sau kim đồng hồ đo áp suất nằm ở vạch đỏ (mất áp).')
    RETURNING id INTO v_fnd_fire_id;

    UPDATE inspection_items SET finding_id = v_fnd_fire_id WHERE id = v_item_fire_id;

    INSERT INTO finding_occurrences (restaurant_id, criterion_id, finding_id, source, occurred_at)
    VALUES (v_kbbq_id, v_c_fire_id, v_fnd_fire_id, 'CONFIRMED', '2026-11-14 11:15:00+07');

END $$;
"""

res = subprocess.run(["psql", "-U", "postgres", "-d", "ksvh_qc", "-c", sql_content], capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print("Stderr:", res.stderr)
