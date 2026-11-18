-- ====================================================================
-- DỮ LIỆU THỰC TẾ: TẬP ĐOÀN LOTUS GROUP (V-LOTUS HOLDINGS) VÀ CÁC CHUỖI F&B NHẬT BẢN
-- Bao gồm: Marukame Udon, CoCo Ichibanya, Yoshinoya, Chiyoda Sushi, Ussina, Tenku, Ushi Mania, Conservo
-- ====================================================================

-- 1. Thêm Công ty Cổ phần V-Lotus Holdings
INSERT INTO companies (code, name, active)
VALUES ('LOTUS', 'CÔNG TY CP TẬP ĐOÀN LOTUS (V-Lotus Holdings F&B)', true)
ON CONFLICT DO NOTHING;

-- 2. Thêm Phòng ban & 25 Nhà hàng chuẩn của Lotus Group
INSERT INTO org_units (company_id, unit_type, code, name, address, latitude, longitude, checkin_radius_m, store_manager_user_id, obm_user_id, active)
SELECT c.id, v.unit_type, v.code, v.name, v.address, v.lat, v.lng, v.radius,
       CASE WHEN v.unit_type = 'RESTAURANT' THEN (SELECT id FROM users WHERE username = 'store') END,
       CASE WHEN v.unit_type = 'RESTAURANT' THEN (SELECT id FROM users WHERE username = 'obm') END,
       true
FROM (VALUES
    -- Khối Văn phòng & Phòng ban
    ('DEPARTMENT', 'LOTUS-HQ',   'Trụ sở Tập đoàn V-Lotus Holdings', '9-9A Nơ Trang Long, Phường 7, Quận Bình Thạnh, TP.HCM', NULL, NULL, NULL),
    ('DEPARTMENT', 'LOTUS-QC',   'Phòng Đảm bảo Chất lượng & KSVH V-Lotus', 'Tầng 5, 9-9A Nơ Trang Long, Phường 7, Bình Thạnh, TP.HCM', NULL, NULL, NULL),

    -- Chuỗi Marukame Udon (Mì Udon & Tempura Nhật Bản)
    ('RESTAURANT', 'MK-BT',      'Marukame Udon Bến Thành', '215-217 Lý Tự Trọng, Phường Bến Thành, Quận 1, TP.HCM', 10.7724, 106.6961, 100),
    ('RESTAURANT', 'MK-TD',      'Marukame Udon Thảo Điền', '27 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP.HCM', 10.8038, 106.7335, 100),
    ('RESTAURANT', 'MK-VHM',     'Marukame Udon Vạn Hạnh Mall', 'Tầng 6 Vạn Hạnh Mall, 11 Sư Vạn Hạnh, Quận 10, TP.HCM', 10.7699, 106.6687, 100),
    ('RESTAURANT', 'MK-VIVO',    'Marukame Udon SC VivoCity', 'Tầng 2 SC VivoCity, 1058 Nguyễn Văn Linh, Quận 7, TP.HCM', 10.7303, 106.7032, 100),
    ('RESTAURANT', 'MK-VCC',     'Marukame Udon Vincom Center Đồng Khởi', 'Tầng B3-15 Vincom Center, 72 Lê Thánh Tôn, Quận 1, TP.HCM', 10.7774, 106.7022, 100),
    ('RESTAURANT', 'MK-AON',     'Marukame Udon Aeon Mall Bình Tân', 'Tầng 3 Aeon Mall, 1 Đường số 17A, Bình Tân, TP.HCM', 10.7431, 106.6118, 120),
    ('RESTAURANT', 'MK-CRM',     'Marukame Udon Crescent Mall', 'Tầng 5 Crescent Mall, 101 Tôn Dật Tiên, Quận 7, TP.HCM', 10.7291, 106.7214, 100),
    ('RESTAURANT', 'MK-HN01',    'Marukame Udon Vincom Metropolis Liễu Giai', 'Tầng 3 Vincom Center Metropolis, 29 Liễu Giai, Ba Đình, Hà Nội', 21.0331, 105.8142, 100),

    -- Chuỗi CoCo Ichibanya (Cà ri Nhật Bản)
    ('RESTAURANT', 'COCO-LM81',  'CoCo Ichibanya Landmark 81', 'Tầng B1-09 Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM', 10.7951, 106.7218, 100),
    ('RESTAURANT', 'COCO-LTT',   'CoCo Ichibanya Lý Tự Trọng', '13 Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM', 10.7797, 106.7039, 100),
    ('RESTAURANT', 'COCO-VCDK',  'CoCo Ichibanya Vincom Center Đồng Khởi', 'Tầng B3 Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, Quận 1, TP.HCM', 10.7774, 106.7022, 100),
    ('RESTAURANT', 'COCO-TD',    'CoCo Ichibanya Vincom Mega Mall Thảo Điền', 'Tầng 5 Vincom Mega Mall, 161 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM', 10.8016, 106.7388, 100),
    ('RESTAURANT', 'COCO-CRM',   'CoCo Ichibanya Crescent Mall', 'Tầng B1 Crescent Mall, 101 Tôn Dật Tiên, Tân Phú, Quận 7, TP.HCM', 10.7291, 106.7214, 100),
    ('RESTAURANT', 'COCO-HN01',  'CoCo Ichibanya Vincom Metropolis Hà Nội', 'Tầng 2 Vincom Metropolis, 29 Liễu Giai, Ba Đình, Hà Nội', 21.0331, 105.8142, 100),

    -- Chuỗi Yoshinoya (Cơm bò Gyudon Nhật Bản)
    ('RESTAURANT', 'YSH-LTT',    'Yoshinoya Lý Tự Trọng', '13 Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM', 10.7797, 106.7039, 100),
    ('RESTAURANT', 'YSH-DMP',    'Yoshinoya Diamond Plaza', 'Tầng 4 Diamond Plaza, 34 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM', 10.7801, 106.6994, 100),
    ('RESTAURANT', 'YSH-VHM',    'Yoshinoya Vạn Hạnh Mall', 'Tầng 5 Vạn Hạnh Mall, 11 Sư Vạn Hạnh, Quận 10, TP.HCM', 10.7699, 106.6687, 100),
    ('RESTAURANT', 'YSH-VIVO',   'Yoshinoya SC VivoCity', 'Tầng 3 SC VivoCity, 1058 Nguyễn Văn Linh, Quận 7, TP.HCM', 10.7303, 106.7032, 100),

    -- Chuỗi Chiyoda Sushi (Sushi truyền thống Nhật Bản)
    ('RESTAURANT', 'CS-PST',     'Chiyoda Sushi Pasteur', '178 Pasteur, Phường Bến Nghé, Quận 1, TP.HCM', 10.7824, 106.6968, 100),
    ('RESTAURANT', 'CS-SGC',     'Chiyoda Sushi Saigon Centre', 'Tầng 5 Saigon Centre, 65 Lê Lợi, Quận 1, TP.HCM', 10.7738, 106.7011, 100),
    ('RESTAURANT', 'CS-TD',      'Chiyoda Sushi Thảo Điền Vista', 'Somerset Vista, 628C Xa Lộ Hà Nội, An Phú, TP. Thủ Đức, TP.HCM', 10.8042, 106.7461, 100),

    -- Chuỗi Steak cao cấp & Fine Dining
    ('RESTAURANT', 'USS-LM81',   'Ussina Aging Beef & Bar Landmark 81', 'Tầng 77 Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM', 10.7951, 106.7218, 100),
    ('RESTAURANT', 'TNK-LM81',   'Tenku Modern Kaiseki & Sky Bar Landmark 81', 'Tầng 67 Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM', 10.7951, 106.7218, 100),

    -- Chuỗi Ushi Mania (Japanese Aging Beef Bar)
    ('RESTAURANT', 'UM-VHM',     'Ushi Mania Vạn Hạnh Mall', 'Tầng 6 Vạn Hạnh Mall, 11 Sư Vạn Hạnh, Quận 10, TP.HCM', 10.7699, 106.6687, 100),
    ('RESTAURANT', 'UM-CRM',     'Ushi Mania Crescent Mall', 'Tầng 3 Crescent Mall, 101 Tôn Dật Tiên, Quận 7, TP.HCM', 10.7291, 106.7214, 100),

    -- Chuỗi Conservo Japanese Bakery & Cafe
    ('RESTAURANT', 'CSV-LTT',    'Conservo Bakery Cafe Lý Tự Trọng', '13 Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM', 10.7797, 106.7039, 100),
    ('RESTAURANT', 'CSV-TD',     'Conservo Bakery Cafe Thảo Điền', '27 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP.HCM', 10.8038, 106.7335, 100)
) AS v(unit_type, code, name, address, lat, lng, radius)
CROSS JOIN (SELECT id FROM companies WHERE lower(code) = 'lotus') c
ON CONFLICT (lower(code)) DO UPDATE
SET name = EXCLUDED.name,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    checkin_radius_m = EXCLUDED.checkin_radius_m,
    active = true;

-- 3. Tạo Mẫu phiếu chấm chuyên biệt cho V-Lotus Holdings
INSERT INTO inspection_templates (code, name, inspection_type, description, company_id, active)
SELECT 'TMPL-LOTUS-JP', 'Mẫu kiểm soát định kỳ Chuỗi Nhà hàng Nhật Bản (V-Lotus Holdings)', 'PERIODIC',
       'Bộ tiêu chuẩn vận hành toàn diện áp dụng cho chuỗi nhà hàng Marukame Udon, CoCo Ichibanya, Yoshinoya, Chiyoda Sushi thuộc V-Lotus',
       c.id, true
FROM companies c WHERE lower(c.code) = 'lotus'
ON CONFLICT (lower(code)) DO NOTHING;

-- 4. Gán tất cả tiêu chí mẫu hiện hành vào Mẫu phiếu của V-Lotus
INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (ORDER BY g.sort_order, c.sort_order)
FROM inspection_templates t
CROSS JOIN criteria c
JOIN criterion_groups g ON g.id = c.group_id
WHERE lower(t.code) = 'tmpl-lotus-jp'
ON CONFLICT (template_id, criterion_id) DO NOTHING;
