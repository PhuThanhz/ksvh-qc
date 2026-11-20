-- ============================================================================
-- V20261120_0230__seed_massive_enterprise_data.sql
-- BỘ DỮ LIỆU DOANH NGHIỆP QUY MÔ LỚN (MASSIVE SEED) CHO KSVH QC
-- ============================================================================

-- 1. THÊM 5 CÔNG TY THÀNH VIÊN MỚI (TỔNG 10 CÔNG TY)
DELETE FROM frequency_configs WHERE effective_from >= '2026-11-18' AND period_months = 12;

INSERT INTO companies (code, name, active) VALUES
    ('LOTUS-CENTRAL', 'CÔNG TY TNHH ẨM THỰC V-LOTUS MIỀN TRUNG (Đà Nẵng, Huế & Nha Trang)', true),
    ('LOTUS-LOG',     'CÔNG TY CP CHUỖI CUNG ỨNG LẠNH & LOGISTICS V-LOTUS (Cold Chain)', true),
    ('LOTUS-FOODS',   'CÔNG TY TNHH CHẾ BIẾN THỰC PHẨM & BẾP TRUNG TÂM V-LOTUS', true),
    ('LOTUS-CAFE',    'CÔNG TY CP ĐỒ UỐNG & TRÀ NHẬT BẢN MATCHA V-LOTUS', true),
    ('LOTUS-RETAIL',  'CÔNG TY TNHH BÁN LẺ THỰC PHẨM NHẬP KHẨU NHẬT BẢN ICHIBAN', true)
ON CONFLICT (lower(code)) DO UPDATE SET name = EXCLUDED.name, active = true;

-- 2. THÊM 25 TÀI KHOẢN NGƯỜI DÙNG MỚI (TỔNG ~47 USERS)
DO $$
DECLARE
    v_pw_hash TEXT;
BEGIN
    SELECT password_hash INTO v_pw_hash FROM users WHERE username = 'inspector' LIMIT 1;
    IF v_pw_hash IS NULL THEN
        v_pw_hash := '{bcrypt}$2a$10$fzRhc28Ul9IDpVqLzc/rROmDGdu2YNLWamSqs8jkrDFZ./19M41qe';
    END IF;

    INSERT INTO users (username, password_hash, full_name, active) VALUES
        ('inspector6',  v_pw_hash, 'Lê Hoàng Bảo (Chuyên viên KSVH Khu vực Miền Trung)', true),
        ('inspector7',  v_pw_hash, 'Nguyễn Tuấn Kiệt (Chuyên viên KSVH Khu vực Đông Nam Bộ)', true),
        ('inspector8',  v_pw_hash, 'Phạm Thảo Vy (Chuyên viên KSVH Chuỗi Cafe & Bakery)', true),
        ('inspector9',  v_pw_hash, 'Đặng Quốc Khánh (Chuyên viên KSVH Chuỗi Cung ứng Lạnh)', true),
        ('inspector10', v_pw_hash, 'Hoàng Minh Triết (Chuyên viên KSVH Đặc nhiệm Đột xuất)', true),
        ('inspector11', v_pw_hash, 'Vũ Ngọc Ánh (Chuyên viên KSVH Khu vực Hà Nội 2)', true),
        ('inspector12', v_pw_hash, 'Trần Đình Trọng (Chuyên viên KSVH Hậu kiểm & Nghiệm thu)', true),
        ('obm4',        v_pw_hash, 'Phan Thanh Bình (Giám sát Vận hành OBM Khu vực Miền Trung)', true),
        ('obm5',        v_pw_hash, 'Lê Công Vinh (Giám sát Vận hành OBM Khu vực Hà Nội & Hải Phòng)', true),
        ('obm6',        v_pw_hash, 'Nguyễn Quang Hải (Giám sát Vận hành OBM Chuỗi Ushi Mania & Bakery)', true),
        ('store_dn',    v_pw_hash, 'Đoàn Văn Hậu (Cửa hàng trưởng Cụm Đà Nẵng & Nha Trang)', true),
        ('store_hp',    v_pw_hash, 'Bùi Tiến Dũng (Cửa hàng trưởng Cụm Hải Phòng & Quảng Ninh)', true),
        ('store_um',    v_pw_hash, 'Nguyễn Tiến Linh (Cửa hàng trưởng Cụm Ushi Mania)', true),
        ('store_csv',   v_pw_hash, 'Quế Ngọc Hải (Cửa hàng trưởng Cụm Conservo Bakery)', true),
        ('store_q7',    v_pw_hash, 'Nguyễn Văn Toàn (Cửa hàng trưởng Cụm Quận 7 & Phú Mỹ Hưng)', true),
        ('store_td',    v_pw_hash, 'Vũ Văn Thanh (Cửa hàng trưởng Cụm Thảo Điền & Thủ Đức)', true),
        ('store_bt',    v_pw_hash, 'Nguyễn Phong Hồng Duy (Cửa hàng trưởng Cụm Bình Thạnh & Landmark)', true),
        ('store_bd',    v_pw_hash, 'Hồ Tấn Tài (Cửa hàng trưởng Cụm Bình Dương & Đồng Nai)', true),
        ('lead3',       v_pw_hash, 'Đỗ Hùng Dũng (Trưởng nhóm KSVH Khu vực Miền Trung)', true),
        ('lead4',       v_pw_hash, 'Nguyễn Hoàng Đức (Trưởng nhóm KSVH Chuyên đề VSATTP & Cold Chain)', true),
        ('manager2',    v_pw_hash, 'Lương Xuân Trường (Phó Trưởng phòng KSVH Toàn quốc)', true),
        ('bizadmin2',   v_pw_hash, 'Nguyễn Công Phượng (Chuyên gia Thiết lập Tiêu chuẩn ISO/HACCP)', true),
        ('exec_north',  v_pw_hash, 'Phạm Tuấn Hải (Giám đốc Điều hành V-Lotus Miền Bắc)', true),
        ('exec_south',  v_pw_hash, 'Nguyễn Tuấn Anh (Giám đốc Điều hành V-Lotus Miền Nam)', true),
        ('exec_fine',   v_pw_hash, 'Đặng Văn Lâm (Giám đốc Khối Fine Dining & Hospitality)', true)
    ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name, active = true;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'KSVH_INSPECTOR'
    WHERE u.username IN ('inspector6', 'inspector7', 'inspector8', 'inspector9', 'inspector10', 'inspector11', 'inspector12')
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'OBM'
    WHERE u.username IN ('obm4', 'obm5', 'obm6')
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'STORE_MANAGER'
    WHERE u.username IN ('store_dn', 'store_hp', 'store_um', 'store_csv', 'store_q7', 'store_td', 'store_bt', 'store_bd')
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'KSVH_LEAD'
    WHERE u.username IN ('lead3', 'lead4')
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'KSVH_MANAGER'
    WHERE u.username IN ('manager2')
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'BUSINESS_ADMIN'
    WHERE u.username IN ('bizadmin2')
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'EXECUTIVE'
    WHERE u.username IN ('exec_north', 'exec_south', 'exec_fine')
    ON CONFLICT DO NOTHING;
END $$;

-- 3. THÊM 35 ĐƠN VỊ & NHÀ HÀNG MỚI TRÊN TOÀN QUỐC (TỔNG ~78 ORG UNITS)
INSERT INTO org_units (company_id, unit_type, code, name, address, latitude, longitude, checkin_radius_m, store_manager_user_id, obm_user_id, active, escalation_threshold, escalation_reset_months, escalation_step)
SELECT c.id, v.unit_type, v.code, v.name, v.address, v.lat, v.lng, v.radius,
       (SELECT id FROM users WHERE username = v.store_user),
       (SELECT id FROM users WHERE username = v.obm_user),
       true, v.esc_threshold, v.esc_reset, v.esc_step
FROM (VALUES
    -- Phòng ban & Trung tâm Logistics / Chế biến
    ('LOTUS-CENTRAL', 'DEPARTMENT', 'LOTUS-DN-HQ',  'Văn phòng Điều hành V-Lotus Khu vực Miền Trung', 'Tầng 9 Indochina Riverside, 74 Bạch Đằng, Hải Châu, Đà Nẵng', 16.0681, 108.2245, 150, NULL, NULL, NULL::smallint, NULL::smallint, NULL::smallint),
    ('LOTUS-LOG',     'DEPARTMENT', 'LOTUS-COLD-S', 'Tổng Kho Lạnh Trung Tâm Miền Nam (KCN Hiệp Phước)', 'Lô B12 KCN Hiệp Phước, Nhà Bè, TP.HCM', 10.6412, 106.7518, 250, NULL, NULL, NULL, NULL, NULL),
    ('LOTUS-LOG',     'DEPARTMENT', 'LOTUS-COLD-N', 'Tổng Kho Lạnh Trung Tâm Miền Bắc (KCN Tiên Sơn)', 'Lô C4 KCN Tiên Sơn, Từ Sơn, Bắc Ninh', 21.1145, 105.9612, 250, NULL, NULL, NULL, NULL, NULL),
    ('LOTUS-FOODS',   'DEPARTMENT', 'LOTUS-CK-HN',  'Nhà máy Chế biến Sốt & Mì Tươi V-Lotus Miền Bắc', 'KCN Quang Minh, Mê Linh, Hà Nội', 21.1842, 105.7721, 200, NULL, NULL, NULL, NULL, NULL),
    ('LOTUS-CAFE',    'DEPARTMENT', 'LOTUS-ROAST',  'Xưởng Rang Xay Cafe & Phối trộn Trà Matcha V-Lotus', 'Khu Công Nghệ Cao Quận 9, TP. Thủ Đức, TP.HCM', 10.8411, 106.7925, 200, NULL, NULL, NULL, NULL, NULL),

    -- Cụm Nhà hàng Miền Trung (Đà Nẵng, Huế, Nha Trang)
    ('LOTUS-CENTRAL', 'RESTAURANT', 'MK-DN01',      'Marukame Udon Vincom Plaza Đà Nẵng', 'Tầng 4 Vincom Plaza Ngô Quyền, Sơn Trà, Đà Nẵng', 16.0718, 108.2301, 120, 'store_dn', 'obm4', NULL, NULL, NULL),
    ('LOTUS-CENTRAL', 'RESTAURANT', 'MK-DN02',      'Marukame Udon Indochina Bạch Đằng Đà Nẵng', '74 Bạch Đằng, Quận Hải Châu, Đà Nẵng', 16.0681, 108.2245, 100, 'store_dn', 'obm4', NULL, NULL, NULL),
    ('LOTUS-CENTRAL', 'RESTAURANT', 'COCO-DN01',    'CoCo Ichibanya Cầu Rồng Đà Nẵng', 'Lô A2 Võ Văn Kiệt, Sơn Trà, Đà Nẵng', 16.0612, 108.2354, 100, 'store_dn', 'obm4', NULL, NULL, NULL),
    ('LOTUS-CENTRAL', 'RESTAURANT', 'YSH-DN01',     'Yoshinoya Nguyễn Văn Linh Đà Nẵng', '112 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', 16.0601, 108.2145, 100, 'store_dn', 'obm4', NULL, NULL, NULL),
    ('LOTUS-CENTRAL', 'RESTAURANT', 'MK-HUE01',     'Marukame Udon Aeon Mall Huế', 'Tầng 3 Aeon Mall Huế, Võ Nguyên Giáp, TP. Huế', 16.4589, 107.6051, 120, 'store_dn', 'obm4', NULL, NULL, NULL),
    ('LOTUS-CENTRAL', 'RESTAURANT', 'MK-NT01',      'Marukame Udon Gold Coast Nha Trang', 'Tầng 4 Gold Coast, 01 Trần Hưng Đạo, TP. Nha Trang', 12.2481, 109.1948, 120, 'store_dn', 'obm4', NULL, NULL, NULL),
    ('LOTUS-CENTRAL', 'RESTAURANT', 'COCO-NT01',    'CoCo Ichibanya Trần Phú Nha Trang', '66 Trần Phú, Lộc Thọ, TP. Nha Trang', 12.2389, 109.1965, 100, 'store_dn', 'obm4', NULL, NULL, NULL),

    -- Cụm Nhà hàng Miền Bắc mở rộng (Hà Nội, Hải Phòng, Quảng Ninh)
    ('LOTUS-NORTH',   'RESTAURANT', 'MK-HN04',      'Marukame Udon Royal City Nguyễn Trãi', 'Tầng B2 Royal City, 72A Nguyễn Trãi, Thanh Xuân, Hà Nội', 21.0031, 105.8148, 120, 'store_mk', 'obm5', NULL, NULL, NULL),
    ('LOTUS-NORTH',   'RESTAURANT', 'MK-HN05',      'Marukame Udon Times City Minh Khai', 'Tầng B1 Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội', 20.9951, 105.8682, 120, 'store_mk', 'obm5', NULL, NULL, NULL),
    ('LOTUS-NORTH',   'RESTAURANT', 'MK-HN06',      'Marukame Udon Aeon Mall Hà Đông', 'Tầng 2 Aeon Mall Hà Đông, Dương Nội, Hà Đông, Hà Nội', 20.9891, 105.7512, 120, 'store_mk', 'obm5', NULL, NULL, NULL),
    ('LOTUS-NORTH',   'RESTAURANT', 'COCO-HN03',    'CoCo Ichibanya Vincom Bà Triệu', 'Tầng 5 Vincom Center Bà Triệu, 191 Bà Triệu, Hà Nội', 21.0115, 105.8495, 100, 'store_coco', 'obm5', NULL, NULL, NULL),
    ('LOTUS-NORTH',   'RESTAURANT', 'COCO-HN04',    'CoCo Ichibanya Lotte Mall West Lake Tây Hồ', 'Tầng 3 Lotte Mall Tây Hồ, 272 Võ Chí Công, Hà Nội', 21.0765, 105.8112, 120, 'store_coco', 'obm5', NULL, NULL, NULL),
    ('LOTUS-NORTH',   'RESTAURANT', 'YSH-HN01',     'Yoshinoya Tràng Tiền Plaza Hoàn Kiếm', 'Tầng 5 Tràng Tiền Plaza, 24 Hai Bà Trưng, Hoàn Kiếm, Hà Nội', 21.0245, 105.8531, 100, 'store_ysh', 'obm5', NULL, NULL, NULL),
    ('LOTUS-NORTH',   'RESTAURANT', 'CS-HN01',      'Chiyoda Sushi Kim Mã Ba Đình', '521 Kim Mã, Phường Ngọc Khánh, Quận Ba Đình, Hà Nội', 21.0298, 105.8115, 100, 'store_cs', 'obm5', 2::smallint, 6::smallint, 1::smallint),
    ('LOTUS-NORTH',   'RESTAURANT', 'MK-HP01',      'Marukame Udon Aeon Mall Hải Phòng Lê Chân', 'Tầng 2 Aeon Mall Hải Phòng, Võ Nguyên Giáp, Lê Chân, Hải Phòng', 20.8312, 106.6815, 120, 'store_hp', 'obm5', NULL, NULL, NULL),
    ('LOTUS-NORTH',   'RESTAURANT', 'COCO-HP01',    'CoCo Ichibanya Aeon Mall Hải Phòng', 'Tầng 3 Aeon Mall Hải Phòng, Lê Chân, Hải Phòng', 20.8312, 106.6815, 120, 'store_hp', 'obm5', NULL, NULL, NULL),
    ('LOTUS-NORTH',   'RESTAURANT', 'MK-QN01',      'Marukame Udon Vincom Plaza Hạ Long', 'Tầng 3 Vincom Plaza Hạ Long, Khu Cột Đồng Hồ, Quảng Ninh', 20.9512, 107.0825, 120, 'store_hp', 'obm5', NULL, NULL, NULL),

    -- Cụm Nhà hàng Miền Nam mở rộng (TP.HCM, Bình Dương, Đồng Nai, Vũng Tàu)
    ('LOTUS-SOUTH',   'RESTAURANT', 'MK-TP',        'Marukame Udon Aeon Mall Tân Phú Celadon', 'Tầng 2 Aeon Mall Tân Phú, 30 Tân Thắng, Tân Phú, TP.HCM', 10.8012, 106.6181, 120, 'store_mk', 'obm', NULL, NULL, NULL),
    ('LOTUS-SOUTH',   'RESTAURANT', 'MK-GV',        'Marukame Udon Vincom Plaza Phan Văn Trị Gò Vấp', 'Tầng 4 Vincom Plaza, 12 Phan Văn Trị, Gò Vấp, TP.HCM', 10.8265, 106.6891, 100, 'store_mk', 'obm', NULL, NULL, NULL),
    ('LOTUS-SOUTH',   'RESTAURANT', 'MK-TD02',      'Marukame Udon Gigamall Phạm Văn Đồng', 'Tầng 5 Gigamall, 240 Phạm Văn Đồng, TP. Thủ Đức, TP.HCM', 10.8281, 106.7215, 120, 'store_td', 'obm', NULL, NULL, NULL),
    ('LOTUS-SOUTH',   'RESTAURANT', 'COCO-TP',      'CoCo Ichibanya Aeon Mall Tân Phú Celadon', 'Tầng 3 Aeon Mall Tân Phú, 30 Tân Thắng, Tân Phú, TP.HCM', 10.8012, 106.6181, 120, 'store_coco', 'obm2', NULL, NULL, NULL),
    ('LOTUS-SOUTH',   'RESTAURANT', 'COCO-VIVO',    'CoCo Ichibanya SC VivoCity Quận 7', 'Tầng 4 SC VivoCity, 1058 Nguyễn Văn Linh, Quận 7, TP.HCM', 10.7303, 106.7032, 100, 'store_q7', 'obm2', NULL, NULL, NULL),
    ('LOTUS-SOUTH',   'RESTAURANT', 'YSH-TD',       'Yoshinoya Estella Place An Phú Thủ Đức', 'Tầng 3 Estella Place, 88 Song Hành, An Phú, TP. Thủ Đức', 10.8019, 106.7481, 100, 'store_td', 'obm2', NULL, NULL, NULL),
    ('LOTUS-SOUTH',   'RESTAURANT', 'YSH-BD01',     'Yoshinoya Sora Gardens Thành phố Mới Bình Dương', 'Tầng 1 Sora Gardens, Đại lộ Hùng Vương, TP. Thủ Dầu Một, Bình Dương', 11.0521, 106.6812, 120, 'store_bd', 'obm2', NULL, NULL, NULL),
    ('LOTUS-SOUTH',   'RESTAURANT', 'MK-BH01',      'Marukame Udon Vincom Plaza Biên Hòa Đồng Nai', 'Tầng 4 Vincom Biên Hòa, 1096 Phạm Văn Thuận, Biên Hòa, Đồng Nai', 10.9581, 106.8421, 120, 'store_bd', 'obm', NULL, NULL, NULL),
    ('LOTUS-SOUTH',   'RESTAURANT', 'MK-VT01',      'Marukame Udon Lotte Mart Vũng Tàu', 'Tầng 2 Lotte Mart Vũng Tàu, Góc đường 3/2 và Thi Sách, TP. Vũng Tàu', 10.3541, 107.0951, 120, 'store_bd', 'obm', NULL, NULL, NULL),

    -- Cụm Fine Dining & Bakery / Cafe mới
    ('LOTUS-FINE',    'RESTAURANT', 'USS-TD',       'Ussina Aging Beef & Wine Villa Thảo Điền', '45 Xuân Thủy, Phường Thảo Điền, TP. Thủ Đức, TP.HCM', 10.8049, 106.7341, 100, 'store_fine', 'obm3', 2::smallint, 9::smallint, 2::smallint),
    ('LOTUS-FINE',    'RESTAURANT', 'TNK-HN01',     'Tenku Modern Kaiseki & Lounge Lotte Center Hà Nội', 'Tầng 65 Lotte Center, 54 Liễu Giai, Ba Đình, Hà Nội', 21.0319, 105.8124, 100, 'store_fine', 'obm3', 2::smallint, 9::smallint, 2::smallint),
    ('LOTUS-FINE',    'RESTAURANT', 'UM-SGC',       'Ushi Mania Japanese Beef Bar Saigon Centre', 'Tầng 5 Saigon Centre, 65 Lê Lợi, Quận 1, TP.HCM', 10.7738, 106.7011, 100, 'store_um', 'obm6', 2::smallint, 6::smallint, 1::smallint),
    ('LOTUS-CAFE',    'RESTAURANT', 'CSV-LM81',     'Conservo Bakery & Matcha Lounge Landmark 81', 'Tầng L1 Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM', 10.7951, 106.7218, 100, 'store_csv', 'obm6', NULL, NULL, NULL)
) AS v(comp_code, unit_type, code, name, address, lat, lng, radius, store_user, obm_user, esc_threshold, esc_reset, esc_step)
JOIN companies c ON lower(c.code) = lower(v.comp_code)
ON CONFLICT (lower(code)) DO UPDATE
SET name = EXCLUDED.name,
    company_id = EXCLUDED.company_id,
    store_manager_user_id = COALESCE(EXCLUDED.store_manager_user_id, org_units.store_manager_user_id),
    obm_user_id = COALESCE(EXCLUDED.obm_user_id, org_units.obm_user_id),
    escalation_threshold = COALESCE(EXCLUDED.escalation_threshold, org_units.escalation_threshold),
    escalation_reset_months = COALESCE(EXCLUDED.escalation_reset_months, org_units.escalation_reset_months),
    escalation_step = COALESCE(EXCLUDED.escalation_step, org_units.escalation_step);

-- Cập nhật escalation_step = 2 cho Ussina & Tenku Landmark 81 để khai thác tính năng mới
UPDATE org_units SET escalation_step = 2 WHERE code IN ('USS-LM81', 'TNK-LM81', 'USS-SGC');
UPDATE org_units SET escalation_step = 1 WHERE code IN ('CS-PST', 'CS-SGC', 'CS-TD', 'CS-PMH');

-- 4. THÊM 35 HỒ SƠ NHÂN SỰ MỚI (TỔNG 68 NHÂN VIÊN)
INSERT INTO employees (employee_code, full_name, job_title, org_unit_id, phone, email, user_id, active)
SELECT v.emp_code, v.full_name, v.job_title,
       (SELECT id FROM org_units WHERE lower(code) = lower(v.unit_code) LIMIT 1),
       v.phone, v.email,
       (SELECT id FROM users WHERE username = v.username LIMIT 1),
       true
FROM (VALUES
    ('NV033', 'Lê Hoàng Bảo',           'Chuyên viên KSVH Khu vực Miền Trung',               'LOTUS-DN-HQ', '0943111222', 'bao.lh@vlotus.vn',      'inspector6'),
    ('NV034', 'Nguyễn Tuấn Kiệt',       'Chuyên viên KSVH Khu vực Đông Nam Bộ',              'LOTUS-QC',    '0943222333', 'kiet.nt@vlotus.vn',     'inspector7'),
    ('NV035', 'Phạm Thảo Vy',           'Chuyên viên KSVH Chuỗi Cafe & Bakery',              'LOTUS-ROAST', '0943333444', 'vy.pt@vlotus.vn',       'inspector8'),
    ('NV036', 'Đặng Quốc Khánh',        'Chuyên viên KSVH Chuỗi Cung ứng Lạnh (Cold Chain)', 'LOTUS-COLD-S','0943444555', 'khanh.dq@vlotus.vn',    'inspector9'),
    ('NV037', 'Hoàng Minh Triết',       'Chuyên viên KSVH Đặc nhiệm Đột xuất',               'LOTUS-QC',    '0943555666', 'triet.hm@vlotus.vn',    'inspector10'),
    ('NV038', 'Vũ Ngọc Ánh',            'Chuyên viên KSVH Khu vực Hà Nội 2',                 'LOTUS-HN-HQ', '0943666777', 'anh.vn@vlotus.vn',      'inspector11'),
    ('NV039', 'Trần Đình Trọng',        'Chuyên viên KSVH Hậu kiểm & Nghiệm thu',            'LOTUS-QC',    '0943777888', 'trong.td@vlotus.vn',    'inspector12'),
    ('NV040', 'Phan Thanh Bình',        'Giám sát Vận hành OBM Khu vực Miền Trung',          'LOTUS-DN-HQ', '0943888999', 'binh.pt@vlotus.vn',     'obm4'),
    ('NV041', 'Lê Công Vinh',           'Giám sát Vận hành OBM Khu vực Hà Nội & Hải Phòng',  'LOTUS-HN-HQ', '0943999000', 'vinh.lc@vlotus.vn',     'obm5'),
    ('NV042', 'Nguyễn Quang Hải',       'Giám sát Vận hành OBM Chuỗi Ushi Mania & Bakery',   'LOTUS-OPS',   '0944111222', 'hai.nq@vlotus.vn',      'obm6'),
    ('NV043', 'Đoàn Văn Hậu',           'Cửa hàng trưởng Cụm Đà Nẵng & Nha Trang',           'MK-DN01',     '0944222333', 'hau.dv@vlotus.vn',      'store_dn'),
    ('NV044', 'Bùi Tiến Dũng',          'Cửa hàng trưởng Cụm Hải Phòng & Quảng Ninh',        'MK-HP01',     '0944333444', 'dung.bt@vlotus.vn',     'store_hp'),
    ('NV045', 'Nguyễn Tiến Linh',       'Cửa hàng trưởng Cụm Ushi Mania',                    'UM-SGC',      '0944444555', 'linh.nt@vlotus.vn',     'store_um'),
    ('NV046', 'Quế Ngọc Hải',           'Cửa hàng trưởng Cụm Conservo Bakery',               'CSV-LM81',    '0944555666', 'hai.qn@vlotus.vn',      'store_csv'),
    ('NV047', 'Nguyễn Văn Toàn',        'Cửa hàng trưởng Cụm Quận 7 & Phú Mỹ Hưng',          'COCO-VIVO',   '0944666777', 'toan.nv@vlotus.vn',     'store_q7'),
    ('NV048', 'Vũ Văn Thanh',           'Cửa hàng trưởng Cụm Thảo Điền & Thủ Đức',           'MK-TD02',     '0944777888', 'thanh.vv@vlotus.vn',    'store_td'),
    ('NV049', 'Nguyễn Phong Hồng Duy',  'Cửa hàng trưởng Cụm Bình Thạnh & Landmark',         'CSV-LM81',    '0944888999', 'duy.nph@vlotus.vn',     'store_bt'),
    ('NV050', 'Hồ Tấn Tài',             'Cửa hàng trưởng Cụm Bình Dương & Đồng Nai',         'MK-BD01',     '0944999000', 'tai.ht@vlotus.vn',      'store_bd'),
    ('NV051', 'Đỗ Hùng Dũng',           'Trưởng nhóm KSVH Khu vực Miền Trung',               'LOTUS-DN-HQ', '0945111222', 'dung.dh@vlotus.vn',     'lead3'),
    ('NV052', 'Nguyễn Hoàng Đức',       'Trưởng nhóm KSVH Chuyên đề VSATTP & Cold Chain',    'LOTUS-COLD-S','0945222333', 'duc.nh@vlotus.vn',      'lead4'),
    ('NV053', 'Lương Xuân Trường',      'Phó Trưởng phòng KSVH Toàn quốc',                   'LOTUS-QC',    '0945333444', 'truong.lx@vlotus.vn',   'manager2'),
    ('NV054', 'Nguyễn Công Phượng',     'Chuyên gia Thiết lập Tiêu chuẩn ISO 22000 & HACCP', 'LOTUS-QC',    '0945444555', 'phuong.nc@vlotus.vn',   'bizadmin2'),
    ('NV055', 'Phạm Tuấn Hải',          'Giám đốc Điều hành V-Lotus Khu vực Miền Bắc',       'LOTUS-HN-HQ', '0945555666', 'hai.pt@vlotus.vn',      'exec_north'),
    ('NV056', 'Nguyễn Tuấn Anh',        'Giám đốc Điều hành V-Lotus Khu vực Miền Nam',       'LOTUS-HQ',    '0945666777', 'anh.nt@vlotus.vn',      'exec_south'),
    ('NV057', 'Đặng Văn Lâm',           'Giám đốc Khối Fine Dining & Hospitality',           'LOTUS-HQ',    '0945777888', 'lam.dv@vlotus.vn',      'exec_fine'),
    ('NV058', 'Trần Nguyên Mạnh',       'Bếp trưởng Điều hành Ussina Villa Thảo Điền',       'USS-TD',      '0945888999', 'manh.tn@vlotus.vn',     NULL),
    ('NV059', 'Nguyễn Thành Chung',     'Bếp trưởng Kaiseki Tenku Lotte Center Hà Nội',      'TNK-HN01',    '0945999000', 'chung.nt@vlotus.vn',    NULL),
    ('NV060', 'Bùi Hoàng Việt Anh',     'Cửa hàng trưởng Marukame Udon Royal City',          'MK-HN04',     '0946111222', 'anh.bhv@vlotus.vn',     NULL),
    ('NV061', 'Nguyễn Thanh Bình',      'Cửa hàng trưởng Marukame Udon Times City',          'MK-HN05',     '0946222333', 'binh.nt@vlotus.vn',     NULL),
    ('NV062', 'Phan Tuấn Tài',          'Cửa hàng trưởng CoCo Ichibanya Cầu Rồng Đà Nẵng',   'COCO-DN01',   '0946333444', 'tai.pt@vlotus.vn',      NULL),
    ('NV063', 'Khuất Văn Khang',        'Cửa hàng trưởng Marukame Udon Gold Coast Nha Trang','MK-NT01',     '0946444555', 'khang.kv@vlotus.vn',    NULL),
    ('NV064', 'Nguyễn Thái Sơn',        'Quản lý Kho Lạnh Trung Tâm Hiệp Phước',             'LOTUS-COLD-S','0946555666', 'son.nt@vlotus.vn',      NULL),
    ('NV065', 'Nguyễn Đình Bắc',        'Quản lý Nhà máy Chế biến Sốt & Mì Tươi Miền Bắc',   'LOTUS-CK-HN', '0946666777', 'bac.nd@vlotus.vn',      NULL),
    ('NV066', 'Võ Hoàng Minh Khoa',     'Cửa hàng trưởng Marukame Udon Aeon Mall Huế',       'MK-HUE01',    '0946777888', 'khoa.vhm@vlotus.vn',    NULL),
    ('NV067', 'Bùi Vĩ Hào',             'Cửa hàng trưởng Yoshinoya Sora Gardens Bình Dương', 'YSH-BD01',    '0946888999', 'hao.bv@vlotus.vn',      NULL),
    ('NV068', 'Châu Ngọc Quang',        'Chuyên viên Giám sát Nhiệt độ IoT Kho Lạnh',        'LOTUS-COLD-N','0946999000', 'quang.cn@vlotus.vn',    NULL)
) AS v(emp_code, full_name, job_title, unit_code, phone, email, username)
ON CONFLICT (lower(employee_code)) DO UPDATE
SET full_name = EXCLUDED.full_name,
    job_title = EXCLUDED.job_title,
    org_unit_id = COALESCE(EXCLUDED.org_unit_id, employees.org_unit_id);

-- 5. THÊM 3 NHÓM TIÊU CHÍ MỚI & 30 TIÊU CHÍ CHUYÊN SÂU (TỔNG 9 NHÓM & 101 TIÊU CHÍ)
DELETE FROM criterion_groups WHERE code = 'DEMO-VS' AND id NOT IN (SELECT group_id FROM criteria WHERE id IN (SELECT criterion_id FROM inspection_items));

INSERT INTO criterion_groups (code, name, sort_order, active) VALUES
    ('GRP-KHO-LANH', 'Quản lý Kho Lạnh, Chuỗi Cung ứng & Truy xuất Nguồn gốc (Cold Chain)', 6, true),
    ('GRP-ATLD-MT',  'An toàn Lao động, Vệ sinh Môi trường & Xử lý Nước thải',               7, true),
    ('GRP-THUONGHIEU','Tiêu chuẩn Hình ảnh Thương hiệu, Marketing & Trải nghiệm Nhật Bản',   8, true)
ON CONFLICT (lower(code)) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, active = true;

INSERT INTO criteria (group_id, code, name, check_method, evidence_required, base_impact, sort_order, active)
SELECT g.id, v.code, v.name, v.check_method, v.evidence, v.impact, v.sort_order, true
FROM (VALUES
    -- Nhóm 6: Kho lạnh & Chuỗi cung ứng (10 tiêu chí)
    ('GRP-KHO-LANH', 'TC-KL-01', 'Xe tải lạnh giao hàng duy trì nhiệt độ thùng xe đạt chuẩn (-18°C với hàng đông, 0-4°C với hàng mát)', 'Kiểm tra nhiệt kế tự ghi (Data Logger) trên xe giao hàng khi nhập kho', 'Chụp ảnh phiếu in Data Logger và nhiệt kế thùng xe', 3, 1),
    ('GRP-KHO-LANH', 'TC-KL-02', 'Thực phẩm nhập kho có đầy đủ chứng nhận CO/CQ, kiểm dịch thú y và hóa đơn lô hàng', 'Đối chiếu hồ sơ nhập hàng với thực tế lô hàng giao ca sáng', 'Chụp ảnh bộ chứng từ nhập kho và tem lô hàng', 3, 2),
    ('GRP-KHO-LANH', 'TC-KL-03', 'Hàng hóa trong kho lạnh xếp trên kệ inox cách sàn tối thiểu 15cm, cách tường 20cm', 'Quan sát trực tiếp và đo khoảng cách kệ hàng trong kho lạnh/kho khô', 'Chụp ảnh toàn cảnh kệ kho lạnh và khoảng cách gầm kệ', 2, 3),
    ('GRP-KHO-LANH', 'TC-KL-04', 'Tuân thủ nghiêm ngặt nguyên tắc FIFO / FEFO (Hết hạn trước - Xuất trước) đối với mọi nguyên liệu', 'Kiểm tra ngẫu nhiên 10 mặt hàng trên kệ kho xem hạn sử dụng trong/ngoài', 'Chụp ảnh tem date các lô hàng xếp trước và sau', 3, 4),
    ('GRP-KHO-LANH', 'TC-KL-05', 'Gioăng cao su cửa tủ đông/kho lạnh kín khít, không đóng tuyết dày quá 5mm tại dàn lạnh', 'Kiểm tra độ hít của cửa kho lạnh và quan sát dàn lạnh', 'Chụp ảnh gioăng cửa và dàn trao đổi nhiệt tủ đông', 2, 5),
    ('GRP-KHO-LANH', 'TC-KL-06', 'Thịt bò Wagyu / Aging Beef và cá sống Sashimi bảo quản trong tủ chuyên dụng có kiểm soát độ ẩm', 'Kiểm tra nhiệt kế và ẩm kế tủ Aging Beef / Sashimi', 'Chụp ảnh màn hình hiển thị nhiệt độ & độ ẩm tủ chuyên dụng', 4, 6),
    ('GRP-KHO-LANH', 'TC-KL-07', 'Không lưu trữ hóa chất tẩy rửa chung khu vực hoặc liền kề kho thực phẩm và bao bì', 'Kiểm tra kho hóa chất độc lập và tủ đựng dụng cụ vệ sinh', 'Chụp ảnh khu vực lưu trữ hóa chất có khóa/nhãn cảnh báo', 4, 7),
    ('GRP-KHO-LANH', 'TC-KL-08', 'Bột mì Udon và gạo Nhật bảo quản nơi khô thoáng, có thiết bị hút ẩm và khay chống ẩm mốc', 'Kiểm tra độ ẩm kho khô (< 65%) và tình trạng bao bột/gạo', 'Chụp ảnh ẩm kế kho khô và pallet xếp bột mì/gạo', 2, 8),
    ('GRP-KHO-LANH', 'TC-KL-09', 'Quy trình hủy hàng hết hạn / hư hỏng có lập biên bản, cắt hủy bao bì và giám sát qua Camera', 'Đối chiếu sổ hủy hàng với dữ liệu xuất hủy trên phần mềm ERP/POS', 'Chụp ảnh biên bản hủy hàng có chữ ký CHT và ảnh chụp hủy', 3, 9),
    ('GRP-KHO-LANH', 'TC-KL-10', 'Cân điện tử nhận hàng tại khu vực hậu cần được hiệu chuẩn định kỳ và còn tem kiểm định', 'Kiểm tra tem hiệu chuẩn trên bàn cân và thử tải bằng quả cân chuẩn 5kg', 'Chụp ảnh tem hiệu chuẩn và màn hình cân thử tải', 1, 10),

    -- Nhóm 7: An toàn lao động & Môi trường (10 tiêu chí)
    ('GRP-ATLD-MT',  'TC-MT-01', 'Bể tách mỡ 3 ngăn dưới khu rửa được vớt váng mỡ hàng ngày và hút bùn định kỳ hàng tuần', 'Mở nắp bể tách mỡ kiểm tra độ dày lớp váng mỡ và sổ nhật ký vệ sinh', 'Chụp ảnh bên trong bể tách mỡ và biên bản thu gom', 3, 1),
    ('GRP-ATLD-MT',  'TC-MT-02', 'Nhân viên sử dụng máy thái thịt, máy cán mì Udon tuân thủ quy trình khóa an toàn (LOTO) khi vệ sinh', 'Quan sát thao tác tháo lắp vệ sinh máy và kiểm tra công tắc an toàn', 'Chụp ảnh chốt bảo vệ máy thái thịt/máy cán mì', 4, 2),
    ('GRP-ATLD-MT',  'TC-MT-03', 'Găng tay chống cắt bằng lưới thép inox được trang bị đầy đủ và bắt buộc đeo khi lọc thịt/cá lớn', 'Kiểm tra số lượng và tình trạng găng tay chống cắt tại quầy sơ chế', 'Chụp ảnh nhân viên đeo găng chống cắt khi thao tác', 3, 3),
    ('GRP-ATLD-MT',  'TC-MT-04', 'Thảm cao su chống trượt tại khu vực rửa chén và khu chiên Tempura sạch sẽ, không rách cong vênh', 'Kiểm tra độ bám của thảm sàn bếp tại các khu vực ướt và dầu mỡ', 'Chụp ảnh mặt sàn và hệ thống thảm chống trượt khu bếp', 2, 4),
    ('GRP-ATLD-MT',  'TC-MT-05', 'Hóa chất vệ sinh bếp (tẩy dầu mỡ, cồn, nước rửa chén) có đầy đủ bảng hướng dẫn an toàn MSDS tiếng Việt', 'Kiểm tra bìa hồ sơ MSDS treo tại khu vực pha chế hóa chất', 'Chụp ảnh bảng MSDS và bình chiết hóa chất có nhãn phụ', 2, 5),
    ('GRP-ATLD-MT',  'TC-MT-06', 'Rác thải hữu cơ, rác tái chế và dầu ăn phế thải được phân loại tại nguồn và bàn giao đơn vị có phép', 'Kiểm tra khu tập kết rác sau nhà hàng và sổ giao nhận rác/dầu thải', 'Chụp ảnh các thùng rác phân loại và phiếu thu gom dầu thải', 2, 6),
    ('GRP-ATLD-MT',  'TC-MT-07', 'Hệ thống chiếu sáng khu vực bếp sơ chế và nấu đạt độ rọi >= 300 Lux, bóng đèn có chụp bảo vệ chống vỡ', 'Quan sát toàn bộ máng đèn khu vực bếp nấu và bàn ra món', 'Chụp ảnh hệ thống đèn trần khu bếp có nắp chụp bảo vệ', 2, 7),
    ('GRP-ATLD-MT',  'TC-MT-08', 'Nhân viên bếp được trang bị giày bảo hộ chống trượt, chống thấm dầu mỡ đúng quy định', 'Kiểm tra trang phục và giày bảo hộ của toàn bộ nhân viên ca bếp', 'Chụp ảnh giày bảo hộ của nhân viên đang làm việc', 1, 8),
    ('GRP-ATLD-MT',  'TC-MT-09', 'Đường ống dẫn khói và motor quạt hút tổng trên mái/tầng kỹ thuật được vệ sinh tẩy dầu mỡ định kỳ 3 tháng/lần', 'Kiểm tra biên bản nghiệm thu vệ sinh ống khói gần nhất và quan sát miệng ống', 'Chụp ảnh biên bản bảo trì ống khói và bên trong chụp hút', 3, 9),
    ('GRP-ATLD-MT',  'TC-MT-10', 'Không có hiện tượng rò rỉ nước tại các van cấp, ống xả bồn rửa và máy rửa chén công nghiệp', 'Quan sát gầm bồn rửa và khu vực xung quanh máy rửa chén', 'Chụp ảnh gầm hệ thống bồn rửa khô ráo', 1, 10),

    -- Nhóm 8: Tiêu chuẩn Thương hiệu & Trải nghiệm Nhật Bản (10 tiêu chí)
    ('GRP-THUONGHIEU','TC-TH-01', 'Rèm Noren truyền thống trước cửa nhà hàng phẳng phiu, sạch sẽ, treo đúng quy cách thương hiệu', 'Quan sát mặt tiền nhà hàng và tình trạng rèm Noren', 'Chụp ảnh chính diện mặt tiền và rèm Noren', 1, 1),
    ('GRP-THUONGHIEU','TC-TH-02', 'Mô hình món ăn trưng bày (Food Sample Nhật Bản) trong tủ kính sáng bóng, không bám bụi, đèn chiếu sáng đủ', 'Kiểm tra tủ trưng bày Food Sample tại sảnh đón khách', 'Chụp ảnh tủ trưng bày mô hình món ăn', 1, 2),
    ('GRP-THUONGHIEU','TC-TH-03', 'Thực đơn (Menu cuốn & iPad Order) sạch sẽ, không bong tróc, cập nhật đúng giá và món季節 (Theo mùa)', 'Kiểm tra ngẫu nhiên 15 cuốn menu và thiết bị gọi món tại bàn', 'Chụp ảnh bìa và trang ruột Menu tại bàn khách', 2, 3),
    ('GRP-THUONGHIEU','TC-TH-04', 'Quầy gia vị tại bàn (tương ớt Shichimi, nước tương, gừng hồng, tăm, giấy ăn) đầy đặn và lau sạch nắp lọ', 'Kiểm tra 10 bộ khay gia vị trên bàn ăn khu vực sảnh khách', 'Chụp ảnh cận cảnh khay lọ gia vị tại bàn', 1, 4),
    ('GRP-THUONGHIEU','TC-TH-05', 'Khu vực Bếp Mở (Open Kitchen) của Marukame Udon / Chiyoda Sushi luôn gọn gàng, kính chắn trong suốt không mờ dầu', 'Quan sát trực tiếp từ phía khách hàng nhìn vào quầy Bếp Mở', 'Chụp ảnh toàn cảnh quầy Open Kitchen từ hướng sảnh khách', 2, 5),
    ('GRP-THUONGHIEU','TC-TH-06', 'Khẩu hiệu chào khách tiếng Nhật ("Irasshaimase!") đồng thanh, rõ ràng, tươi tắn khi khách vào/ra', 'Trải nghiệm thực tế khi bước vào sảnh và quan sát trong 15 phút', 'Ghi chú đánh giá thực tế tại hiện trường', 1, 6),
    ('GRP-THUONGHIEU','TC-TH-07', 'Khăn lạnh / Khăn ấm (Oshibori) phục vụ khách thơm sạch, đúng nhiệt độ và đặt trên khay gỗ chuẩn', 'Kiểm tra tủ hấp khăn Oshibori và khay khăn phục vụ khách', 'Chụp ảnh tủ giữ nhiệt khăn Oshibori và khay phục vụ', 1, 7),
    ('GRP-THUONGHIEU','TC-TH-08', 'Standee, Poster khuyến mãi và Tentcard tại bàn đặt đúng vị trí, không để ấn phẩm đã hết hạn chương trình', 'Đối chiếu các ấn phẩm POSM đang trưng bày với lịch Marketing tháng hiện hành', 'Chụp ảnh Standee và Tentcard tại quầy thu ngân/bàn ăn', 2, 8),
    ('GRP-THUONGHIEU','TC-TH-09', 'Cây xanh trang trí, tiểu cảnh vườn Nhật (Zen Garden) và hồ cá Koi (nếu có) được chăm sóc xanh tươi, không lá héo', 'Quan sát toàn bộ không gian decor nội ngoại thất nhà hàng', 'Chụp ảnh khu vực tiểu cảnh trang trí tại nhà hàng', 1, 9),
    ('GRP-THUONGHIEU','TC-TH-10', 'Mạng Wi-Fi miễn phí cho khách hàng hoạt động ổn định, trang chào (Captive Portal) hiển thị đúng thương hiệu', 'Kết nối thử Wi-Fi khách hàng và kiểm tra tốc độ truy cập', 'Chụp ảnh màn hình kết nối Wi-Fi thành công', 1, 10)
) AS v(group_code, code, name, check_method, evidence, impact, sort_order)
JOIN criterion_groups g ON lower(g.code) = lower(v.group_code)
ON CONFLICT (lower(code)) DO UPDATE
SET name = EXCLUDED.name, check_method = EXCLUDED.check_method, evidence_required = EXCLUDED.evidence_required;

-- 6. THÊM 5 MẪU PHIẾU KIỂM TRA MỚI (TỔNG 12 MẪU PHIẾU)
INSERT INTO inspection_templates (code, name, inspection_type, description, company_id, active)
SELECT v.code, v.name, 'Định kỳ', v.descr,
       (SELECT id FROM companies WHERE code = v.comp_code LIMIT 1),
       true
FROM (VALUES
    ('TMPL-COLD-CHAIN',  'Mẫu kiểm tra Chuyên đề Kho Lạnh, Chuỗi Cung ứng & Truy xuất Nguồn gốc (Cold Chain)', 'Áp dụng cho hệ thống Tổng kho lạnh, Bếp trung tâm và khu vực kho bảo quản tại các nhà hàng lớn', 'LOTUS-LOG'),
    ('TMPL-CENTRAL-OPS', 'Mẫu kiểm soát Định kỳ Chuỗi Nhà hàng V-Lotus Khu vực Miền Trung (Đà Nẵng - Huế - Nha Trang)', 'Bộ tiêu chuẩn vận hành 100 điểm rủi ro áp dụng cho cụm nhà hàng Đà Nẵng, Huế và Nha Trang', 'LOTUS-CENTRAL'),
    ('TMPL-SUSHI-RAW',   'Mẫu kiểm soát Nghiêm ngặt Chuỗi Chiyoda Sushi & Hải sản Tươi sống (Sashimi Grade)', 'Tập trung kiểm soát nhiệt độ bảo quản cá sống, vệ sinh thớt/dao sashimi, nguồn nước và lưu mẫu', 'LOTUS'),
    ('TMPL-ATLD-MT',     'Mẫu kiểm tra Định kỳ An toàn Lao động, PCCC, Bể tách mỡ & Môi trường', 'Đánh giá toàn diện rủi ro tai nạn lao động máy móc bếp, an toàn điện/gas và xử lý nước thải', 'LOTUS'),
    ('TMPL-BRAND-AUDIT', 'Mẫu đánh giá Tiêu chuẩn Hình ảnh Thương hiệu, Dịch vụ Omotenashi & Trải nghiệm Khách hàng', 'Đánh giá chất lượng phục vụ, không gian trưng bày, POSM, đồng phục và văn hóa chào đón Nhật Bản', NULL)
) AS v(code, name, descr, comp_code)
ON CONFLICT (lower(code)) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Gán tiêu chí cho các mẫu phiếu mới
INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (PARTITION BY t.id ORDER BY g.sort_order, c.sort_order)
FROM inspection_templates t
JOIN criteria c ON true
JOIN criterion_groups g ON g.id = c.group_id
WHERE t.code IN ('TMPL-CENTRAL-OPS', 'TMPL-LOTUS-JP') AND g.code LIKE 'GRP-%'
ON CONFLICT DO NOTHING;

INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (ORDER BY g.sort_order, c.sort_order)
FROM inspection_templates t
JOIN criteria c ON true
JOIN criterion_groups g ON g.id = c.group_id
WHERE t.code = 'TMPL-COLD-CHAIN' AND g.code IN ('GRP-KHO-LANH', 'GRP-VSATTP')
ON CONFLICT DO NOTHING;

INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (ORDER BY g.sort_order, c.sort_order)
FROM inspection_templates t
JOIN criteria c ON true
JOIN criterion_groups g ON g.id = c.group_id
WHERE t.code = 'TMPL-SUSHI-RAW' AND g.code IN ('GRP-VSATTP', 'GRP-KHO-LANH', 'GRP-BEP', 'GRP-THUONGHIEU')
ON CONFLICT DO NOTHING;

INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (ORDER BY g.sort_order, c.sort_order)
FROM inspection_templates t
JOIN criteria c ON true
JOIN criterion_groups g ON g.id = c.group_id
WHERE t.code = 'TMPL-ATLD-MT' AND g.code IN ('GRP-ATLD-MT', 'GRP-CSVC')
ON CONFLICT DO NOTHING;

INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (ORDER BY g.sort_order, c.sort_order)
FROM inspection_templates t
JOIN criteria c ON true
JOIN criterion_groups g ON g.id = c.group_id
WHERE t.code = 'TMPL-BRAND-AUDIT' AND g.code IN ('GRP-THUONGHIEU', 'GRP-DV', 'GRP-BAR-POS')
ON CONFLICT DO NOTHING;

-- 7. THÊM 9 KẾ HOẠCH KIỂM SOÁT MỚI TỪ THÁNG 05/2026 ĐẾN QUÝ 1/2027 (TỔNG 18 KẾ HOẠCH)
INSERT INTO inspection_plans (plan_code, title, start_date, end_date, status, rejection_reason, notes, created_by, approved_by, approved_at, created_at)
VALUES
    ('KH-202605-001', 'Kế hoạch kiểm soát chất lượng định kỳ Tháng 05/2026 – Toàn hệ thống V-Lotus', '2026-05-01', '2026-05-31', 'APPROVED', NULL, 'Đợt kiểm tra đầu mùa hè, rà soát toàn bộ hệ thống điều hòa và tủ đông', 5, 2, '2026-04-28 09:00:00+07', '2026-04-25 08:30:00+07'),
    ('KH-202606-001', 'Kế hoạch kiểm soát VSATTP & Chuỗi Cung ứng Lạnh Tháng 06/2026',               '2026-06-01', '2026-06-30', 'APPROVED', NULL, 'Kiểm tra liên hoàn từ Bếp trung tâm đến 30 nhà hàng trọng điểm', 5, 2, '2026-05-29 10:30:00+07', '2026-05-26 09:00:00+07'),
    ('KH-202608-MT',  'Kế hoạch kiểm soát vận hành Khu vực Miền Trung (Đà Nẵng - Huế - Nha Trang) T08/2026', '2026-08-05', '2026-08-28', 'APPROVED', NULL, 'Kiểm tra cao điểm du lịch biển miền Trung', 5, 2, '2026-08-02 11:00:00+07', '2026-07-30 14:00:00+07'),
    ('KH-202609-MB',  'Kế hoạch kiểm tra định kỳ Khu vực Miền Bắc (Hà Nội - Hải Phòng - Quảng Ninh) T09/2026', '2026-09-03', '2026-09-29', 'APPROVED', NULL, 'Đánh giá đồng bộ 12 nhà hàng phía Bắc', 5, 2, '2026-09-01 09:00:00+07', '2026-08-29 10:00:00+07'),
    ('KH-202610-SUSHI','Kế hoạch chuyên đề Kiểm soát Chuỗi Chiyoda Sushi & Hải sản Tươi sống T10/2026', '2026-10-05', '2026-10-28', 'APPROVED', NULL, 'Kiểm tra chuyên sâu quy trình Sashimi và bảo quản cá hồi/cá ngừ', 5, 2, '2026-10-02 15:00:00+07', '2026-09-30 11:00:00+07'),
    ('KH-202611-003', 'Kế hoạch kiểm soát định kỳ Khu vực Miền Trung & Đông Nam Bộ Tháng 11/2026',   '2026-11-02', '2026-11-29', 'APPROVED', NULL, 'Mở rộng kiểm tra Đà Nẵng, Nha Trang, Bình Dương, Biên Hòa, Vũng Tàu', 5, 2, '2026-11-01 10:00:00+07', '2026-10-29 09:30:00+07'),
    ('KH-202612-003', 'Kế hoạch kiểm tra Chuyên đề Kho Lạnh & An toàn Lao động Tháng 12/2026',       '2026-12-05', '2026-12-28', 'PENDING_APPROVAL', NULL, 'Trình Trưởng phòng KSVH phê duyệt lịch kiểm tra 15 cơ sở', 5, NULL, NULL, '2026-11-19 08:30:00+07'),
    ('KH-202701-001', 'Kế hoạch kiểm soát cao điểm Tết Nguyên Đán Đinh Mùi 2027 – Toàn quốc',       '2027-01-05', '2027-01-30', 'DRAFT', NULL, 'Bản dự thảo phân công 12 chuyên viên KSVH toàn quốc', 5, NULL, NULL, '2026-11-19 16:00:00+07'),
    ('KH-202609-REJ', 'Đề xuất kiểm tra đột xuất toàn bộ chuỗi Cafe Conservo (Bản hủy)',             '2026-09-10', '2026-09-20', 'REJECTED', 'Chuyển hình thức từ Kế hoạch định kỳ sang Lệnh kiểm tra đột xuất trực tiếp theo quy chế KSVH', 'Đề xuất cũ của nhóm 2', 5, 2, '2026-09-08 14:00:00+07', '2026-09-07 09:00:00+07')
ON CONFLICT (lower(plan_code)) DO NOTHING;

-- 8. SINH THÊM ~75 ĐỢT KIỂM TRA (INSPECTIONS), HẠNG MỤC CHẤM (~5.000 ITEMS), FINDINGS (~140 LỖI), OCCURRENCES & EVENTS
DO $$
DECLARE
    v_tmpl_lotus BIGINT;
    v_tmpl_fine BIGINT;
    v_tmpl_vsattp BIGINT;
    v_tmpl_cold BIGINT;
    v_tmpl_central BIGINT;
    v_tmpl_sushi BIGINT;
    v_tmpl_atld BIGINT;
    v_tmpl_brand BIGINT;
    v_lead BIGINT;
    v_store BIGINT;
    v_ins_ids BIGINT[];
    v_rest_rec RECORD;
    v_month_idx INT;
    v_plan_id BIGINT;
    v_insp_code TEXT;
    v_insp_id BIGINT;
    v_inspector_id BIGINT;
    v_tmpl_id BIGINT;
    v_checkin_ts TIMESTAMPTZ;
    v_status TEXT;
    v_ins_type TEXT;
    v_fail_crit1 TEXT;
    v_fail_crit2 TEXT;
    v_item_rec RECORD;
    v_finding_id BIGINT;
    v_occ_count INT;
    v_eff_impact SMALLINT;
    v_score INT;
    v_rl_code VARCHAR(10);
    v_rl_name VARCHAR(100);
    v_rem_days INT;
    v_counter INT := 0;
BEGIN
    SELECT id INTO v_tmpl_lotus FROM inspection_templates WHERE code = 'TMPL-LOTUS-JP' LIMIT 1;
    SELECT id INTO v_tmpl_fine FROM inspection_templates WHERE code = 'TMPL-FINE-DINING' LIMIT 1;
    SELECT id INTO v_tmpl_vsattp FROM inspection_templates WHERE code = 'TMPL-VSATTP-FAST' LIMIT 1;
    SELECT id INTO v_tmpl_cold FROM inspection_templates WHERE code = 'TMPL-COLD-CHAIN' LIMIT 1;
    SELECT id INTO v_tmpl_central FROM inspection_templates WHERE code = 'TMPL-CENTRAL-OPS' LIMIT 1;
    SELECT id INTO v_tmpl_sushi FROM inspection_templates WHERE code = 'TMPL-SUSHI-RAW' LIMIT 1;
    SELECT id INTO v_tmpl_atld FROM inspection_templates WHERE code = 'TMPL-ATLD-MT' LIMIT 1;
    SELECT id INTO v_tmpl_brand FROM inspection_templates WHERE code = 'TMPL-BRAND-AUDIT' LIMIT 1;

    SELECT id INTO v_lead FROM users WHERE username = 'lead' LIMIT 1;
    SELECT id INTO v_store FROM users WHERE username = 'store' LIMIT 1;

    SELECT array_agg(id ORDER BY id) INTO v_ins_ids
    FROM users
    WHERE username IN ('inspector', 'inspector2', 'inspector3', 'inspector4', 'inspector5', 'inspector6', 'inspector7', 'inspector8', 'inspector9', 'inspector10', 'inspector11', 'inspector12', 'auditor');

    -- Duyệt qua các tháng từ Tháng 06/2026 đến Tháng 11/2026 để sinh hàng loạt biên bản kiểm tra dày đặc
    FOR v_month_idx IN 6..11 LOOP
        SELECT id INTO v_plan_id FROM inspection_plans
        WHERE EXTRACT(YEAR FROM start_date) = 2026 AND EXTRACT(MONTH FROM start_date) = v_month_idx AND status = 'APPROVED'
        ORDER BY id LIMIT 1;

        FOR v_rest_rec IN
            SELECT id, code, name, latitude, longitude, store_manager_user_id, escalation_threshold, escalation_step,
                   row_number() OVER (ORDER BY code) AS rn
            FROM org_units
            WHERE unit_type = 'RESTAURANT' AND active = true
        LOOP
            -- Chọn khoảng 12-16 nhà hàng mỗi tháng để tạo biên bản (xoay vòng theo tháng)
            IF (v_rest_rec.rn + v_month_idx) % 3 = 0 OR (v_month_idx = 11 AND v_rest_rec.rn % 2 = 0) THEN
                v_counter := v_counter + 1;
                v_insp_code := 'PER-26' || lpad(v_month_idx::text, 2, '0') || '-' || v_rest_rec.code;

                IF NOT EXISTS (SELECT 1 FROM inspections WHERE lower(code) = lower(v_insp_code))
                   AND NOT EXISTS (SELECT 1 FROM inspections WHERE lower(code) = lower(v_insp_code || '-HIST')) THEN

                    v_inspector_id := v_ins_ids[1 + ((v_counter - 1) % array_length(v_ins_ids, 1))];

                    IF v_rest_rec.code LIKE 'USS-%' OR v_rest_rec.code LIKE 'TNK-%' THEN
                        v_tmpl_id := COALESCE(v_tmpl_fine, v_tmpl_lotus);
                    ELSIF v_rest_rec.code LIKE 'CS-%' THEN
                        v_tmpl_id := COALESCE(v_tmpl_sushi, v_tmpl_lotus);
                    ELSIF v_rest_rec.code LIKE '%-DN%' OR v_rest_rec.code LIKE '%-NT%' OR v_rest_rec.code LIKE '%-HUE%' THEN
                        v_tmpl_id := COALESCE(v_tmpl_central, v_tmpl_lotus);
                    ELSE
                        v_tmpl_id := v_tmpl_lotus;
                    END IF;

                    v_checkin_ts := make_timestamptz(2026, v_month_idx, LEAST(28, 3 + (v_rest_rec.rn::int % 24)), 9 + (v_counter % 6), 15, 0, 'Asia/Ho_Chi_Minh');
                    IF v_month_idx = 11 AND v_checkin_ts > '2026-11-19 18:00:00+07'::timestamptz THEN
                        v_checkin_ts := '2026-11-18 10:00:00+07'::timestamptz - ((v_rest_rec.rn::int % 12) * INTERVAL '1 day');
                    END IF;

                    IF v_month_idx < 11 THEN
                        v_status := 'COMPLETED';
                    ELSE
                        CASE (v_counter % 7)
                            WHEN 0 THEN v_status := 'AWAITING_ACK';
                            WHEN 1 THEN v_status := 'IN_PROGRESS';
                            WHEN 2 THEN v_status := 'ASSIGNED';
                            ELSE v_status := 'COMPLETED';
                        END CASE;
                    END IF;

                    v_ins_type := CASE WHEN v_counter % 8 = 0 THEN 'SURPRISE' ELSE 'PERIODIC' END;

                    -- Chọn 1-2 tiêu chí lỗi đặc trưng theo từng chuỗi để tạo dữ liệu tái phạm (Escalation) phong phú
                    IF v_rest_rec.code LIKE 'MK-%' THEN
                        v_fail_crit1 := 'TC-VS-02';
                        v_fail_crit2 := CASE WHEN v_counter % 2 = 0 THEN 'TC-MT-01' ELSE 'TC-KL-04' END;
                    ELSIF v_rest_rec.code LIKE 'COCO-%' THEN
                        v_fail_crit1 := 'TC-VS-04';
                        v_fail_crit2 := CASE WHEN v_counter % 2 = 0 THEN 'TC-BP-08' ELSE 'TC-TH-03' END;
                    ELSIF v_rest_rec.code LIKE 'CS-%' THEN
                        v_fail_crit1 := 'TC-VS-03';
                        v_fail_crit2 := 'TC-KL-06';
                    ELSIF v_rest_rec.code LIKE 'USS-%' OR v_rest_rec.code LIKE 'TNK-%' THEN
                        v_fail_crit1 := 'TC-KL-06';
                        v_fail_crit2 := 'TC-VC-03';
                    ELSIF v_rest_rec.code LIKE 'YSH-%' THEN
                        v_fail_crit1 := 'TC-VS-01';
                        v_fail_crit2 := 'TC-MT-02';
                    ELSE
                        v_fail_crit1 := 'TC-TH-04';
                        v_fail_crit2 := 'TC-TN-06';
                    END IF;

                    INSERT INTO inspections (
                        code, plan_id, restaurant_id, template_id, inspector_id, inspection_type, status, inspection_mode,
                        location_status, checkin_lat, checkin_lng, checkin_distance_m,
                        checkin_at, submitted_at, completed_at, acknowledged_by, acknowledged_at,
                        notes, created_by, created_at, updated_at, version
                    )
                    VALUES (
                        v_insp_code,
                        CASE WHEN v_ins_type = 'PERIODIC' THEN v_plan_id ELSE NULL END,
                        v_rest_rec.id,
                        v_tmpl_id,
                        v_inspector_id,
                        v_ins_type,
                        v_status,
                        'ON_SITE',
                        CASE WHEN v_status != 'ASSIGNED' THEN 'VERIFIED' ELSE NULL END,
                        CASE WHEN v_status != 'ASSIGNED' THEN v_rest_rec.latitude ELSE NULL END,
                        CASE WHEN v_status != 'ASSIGNED' THEN v_rest_rec.longitude ELSE NULL END,
                        CASE WHEN v_status != 'ASSIGNED' THEN 10.5 + (v_counter % 25) ELSE NULL END,
                        CASE WHEN v_status != 'ASSIGNED' THEN v_checkin_ts ELSE NULL END,
                        CASE WHEN v_status IN ('COMPLETED', 'AWAITING_ACK') THEN v_checkin_ts + INTERVAL '2 hours 15 minutes' ELSE NULL END,
                        CASE WHEN v_status = 'COMPLETED' THEN v_checkin_ts + INTERVAL '4 hours' ELSE NULL END,
                        CASE WHEN v_status = 'COMPLETED' THEN COALESCE(v_rest_rec.store_manager_user_id, v_store) ELSE NULL END,
                        CASE WHEN v_status = 'COMPLETED' THEN v_checkin_ts + INTERVAL '4 hours' ELSE NULL END,
                        'Đợt kiểm tra chất lượng vận hành tháng ' || lpad(v_month_idx::text, 2, '0') || '/2026 tại ' || v_rest_rec.name,
                        v_lead,
                        v_checkin_ts - INTERVAL '2 days',
                        COALESCE(v_checkin_ts + INTERVAL '4 hours', now()),
                        1
                    )
                    RETURNING id INTO v_insp_id;

                    -- Sinh inspection_items (lấy ~45 tiêu chí tiêu biểu để dữ liệu dày ~5000+ items nhưng truy vấn cực nhanh)
                    IF v_insp_id IS NOT NULL AND v_status != 'ASSIGNED' THEN
                        INSERT INTO inspection_items (
                            inspection_id, criterion_id, criterion_code, criterion_name, group_name,
                            base_impact, result, comment, evidence_urls, sort_order, evaluated_at
                        )
                        SELECT
                            v_insp_id, c.id, c.code, c.name, g.name,
                            c.base_impact,
                            CASE
                                WHEN c.code IN (v_fail_crit1, v_fail_crit2) THEN 'FAIL'
                                WHEN v_status = 'IN_PROGRESS' AND c.sort_order > 6 THEN 'UNRATED'
                                ELSE 'PASS'
                            END,
                            CASE
                                WHEN c.code IN (v_fail_crit1, v_fail_crit2) THEN 'Ghi nhận điểm không phù hợp tại ' || v_rest_rec.name || ': ' || c.name || ' cần chấn chỉnh và khắc phục theo đúng SOP.'
                                ELSE NULL
                            END,
                            CASE
                                WHEN c.code IN (v_fail_crit1, v_fail_crit2) THEN 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'
                                ELSE NULL
                            END,
                            row_number() OVER (ORDER BY g.sort_order, c.sort_order),
                            v_checkin_ts + INTERVAL '50 minutes'
                        FROM criteria c
                        JOIN criterion_groups g ON g.id = c.group_id
                        WHERE g.code LIKE 'GRP-%'
                          AND (c.sort_order <= 6 OR c.code IN (v_fail_crit1, v_fail_crit2));
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    -- Cập nhật bảng phân công kế hoạch (inspection_plan_assignments) cho tất cả inspections có plan_id
    INSERT INTO inspection_plan_assignments (plan_id, restaurant_id, inspector_id, template_id, scheduled_date, sort_order, inspection_id, created_at)
    SELECT i.plan_id, i.restaurant_id, i.inspector_id, COALESCE(i.template_id, v_tmpl_lotus),
           COALESCE(i.checkin_at::date, '2026-11-26'::date),
           row_number() OVER (PARTITION BY i.plan_id ORDER BY i.id),
           i.id, i.created_at
    FROM inspections i
    WHERE i.plan_id IS NOT NULL
    ON CONFLICT (plan_id, restaurant_id) DO UPDATE SET inspection_id = EXCLUDED.inspection_id;

    -- Bổ sung phân công cho các kế hoạch chờ duyệt và dự thảo mới
    INSERT INTO inspection_plan_assignments (plan_id, restaurant_id, inspector_id, template_id, scheduled_date, sort_order)
    SELECT p.id, ou.id,
           v_ins_ids[1 + ((row_number() OVER (PARTITION BY p.id ORDER BY ou.code))::int % array_length(v_ins_ids, 1))],
           CASE WHEN ou.code LIKE 'USS-%' OR ou.code LIKE 'TNK-%' THEN v_tmpl_fine ELSE v_tmpl_lotus END,
           p.start_date + ((row_number() OVER (PARTITION BY p.id ORDER BY ou.code))::int % 22),
           row_number() OVER (PARTITION BY p.id ORDER BY ou.code)
    FROM inspection_plans p
    CROSS JOIN (SELECT id, code FROM org_units WHERE unit_type = 'RESTAURANT' AND active = true ORDER BY code LIMIT 22) ou
    WHERE p.plan_code IN ('KH-202612-003', 'KH-202701-001')
    ON CONFLICT (plan_id, restaurant_id) DO NOTHING;

    -- Tự động sinh findings, finding_occurrences và finding_events cho toàn bộ inspection_items FAIL mới
    FOR v_item_rec IN
        SELECT ii.id AS item_id, ii.inspection_id, ii.criterion_id, ii.criterion_code, ii.criterion_name,
               ii.base_impact, i.restaurant_id, ou.code AS rest_code, ou.name AS rest_name,
               ou.escalation_threshold, ou.escalation_step,
               i.code AS insp_code, i.status AS insp_status, i.inspector_id,
               COALESCE(i.submitted_at, i.checkin_at, i.created_at) AS found_at
        FROM inspection_items ii
        JOIN inspections i ON i.id = ii.inspection_id
        JOIN org_units ou ON ou.id = i.restaurant_id
        WHERE ii.result = 'FAIL'
          AND i.status IN ('COMPLETED', 'AWAITING_ACK', 'SUBMITTED')
          AND NOT EXISTS (SELECT 1 FROM findings f WHERE f.inspection_item_id = ii.id)
        ORDER BY COALESCE(i.submitted_at, i.checkin_at, i.created_at) ASC, ii.id ASC
    LOOP
        SELECT COUNT(*) + 1 INTO v_occ_count
        FROM finding_occurrences fo
        WHERE fo.restaurant_id = v_item_rec.restaurant_id
          AND fo.criterion_id = v_item_rec.criterion_id
          AND fo.occurred_at >= (v_item_rec.found_at - INTERVAL '6 months');

        IF v_occ_count >= COALESCE(v_item_rec.escalation_threshold, 3) THEN
            v_eff_impact := LEAST(5, v_item_rec.base_impact + COALESCE(v_item_rec.escalation_step, 1) * (1 + v_occ_count - COALESCE(v_item_rec.escalation_threshold, 3)));
        ELSE
            v_eff_impact := v_item_rec.base_impact;
        END IF;

        v_score := v_eff_impact * v_occ_count;

        IF v_score >= 12 THEN
            v_rl_code := 'M4'; v_rl_name := 'Nghiêm trọng'; v_rem_days := 1;
        ELSIF v_score >= 6 THEN
            v_rl_code := 'M3'; v_rl_name := 'Cao'; v_rem_days := 7;
        ELSIF v_score >= 1 THEN
            v_rl_code := 'M2'; v_rl_name := 'Trung bình'; v_rem_days := 30;
        ELSE
            v_rl_code := 'M1'; v_rl_name := 'Thấp'; v_rem_days := 60;
        END IF;

        INSERT INTO findings (
            inspection_id, inspection_item_id, restaurant_id, criterion_id,
            base_impact, effective_impact, violation_count, calculated_score,
            risk_level_code, risk_level_name, remediation_days, deadline_date,
            status, description, evidence_urls,
            remediation_plan, remediation_evidence_urls, remediation_submitted_at, remediation_target_date,
            verification_comment, verified_by, verified_at,
            created_at, updated_at, version
        )
        VALUES (
            v_item_rec.inspection_id, v_item_rec.item_id, v_item_rec.restaurant_id, v_item_rec.criterion_id,
            v_item_rec.base_impact, v_eff_impact, v_occ_count, v_score,
            v_rl_code, v_rl_name, v_rem_days,
            (v_item_rec.found_at::date + v_rem_days),
            'CLOSED',
            'Phát hiện điểm không phù hợp [' || v_item_rec.criterion_code || '] tại ' || v_item_rec.rest_name || ': ' || v_item_rec.criterion_name || ' (Vi phạm lần thứ ' || v_occ_count || ' trong kỳ đếm 6 tháng).',
            'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800',
            'Cửa hàng trưởng đã tổ chức họp ca, khắc phục triệt để tại hiện trường, hiệu chuẩn lại thiết bị và gửi báo cáo hình ảnh nghiệm thu.',
            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
            v_item_rec.found_at + INTERVAL '2 days',
            (v_item_rec.found_at::date + LEAST(v_rem_days, 5)),
            'Chuyên viên KSVH đã kiểm tra đối chiếu bằng chứng và xác nhận khắc phục đạt yêu cầu 100%.',
            v_item_rec.inspector_id,
            v_item_rec.found_at + INTERVAL '4 days',
            v_item_rec.found_at,
            v_item_rec.found_at + INTERVAL '4 days',
            1
        )
        RETURNING id INTO v_finding_id;

        UPDATE inspection_items SET finding_id = v_finding_id WHERE id = v_item_rec.item_id;

        INSERT INTO finding_occurrences (restaurant_id, criterion_id, finding_id, source, occurred_at)
        VALUES (v_item_rec.restaurant_id, v_item_rec.criterion_id, v_finding_id, 'CONFIRMED', v_item_rec.found_at);

        INSERT INTO finding_events (finding_id, action, from_status, to_status, actor_id, note, created_at) VALUES
            (v_finding_id, 'CREATED', NULL, 'OPEN', v_item_rec.inspector_id, 'Ghi nhận điểm không phù hợp từ biên bản kiểm tra ' || v_item_rec.insp_code, v_item_rec.found_at),
            (v_finding_id, 'CONFIRMED', 'OPEN', 'CONFIRMED', v_store, 'Cửa hàng trưởng xác nhận lỗi và tiếp nhận xử lý.', v_item_rec.found_at + INTERVAL '3 hours'),
            (v_finding_id, 'REMEDIATION_PLANNED', 'CONFIRMED', 'REMEDIATING', v_store, 'Đã lập kế hoạch hành động khắc phục (CAPA) và phân công nhân sự.', v_item_rec.found_at + INTERVAL '18 hours'),
            (v_finding_id, 'REMEDIATION_SUBMITTED', 'REMEDIATING', 'PENDING_VERIFICATION', v_store, 'Đã hoàn tất khắc phục và đính kèm hình ảnh nghiệm thu.', v_item_rec.found_at + INTERVAL '2 days'),
            (v_finding_id, 'VERIFY_PASSED', 'PENDING_VERIFICATION', 'CLOSED', v_item_rec.inspector_id, 'Chuyên viên KSVH nghiệm thu đạt yêu cầu, đóng hồ sơ lỗi.', v_item_rec.found_at + INTERVAL '4 days');
    END LOOP;
END $$;

-- 9. BỔ SUNG THÊM 25 THÔNG BÁO (NOTIFICATIONS) & 30 DÒNG NHẬT KÝ HỆ THỐNG (AUDIT LOGS)
INSERT INTO notifications (user_id, type, title, body, link, read_at, created_at)
SELECT u.id, v.ntype, v.title, v.body, v.link, v.read_at, v.created_at
FROM (VALUES
    ('admin',      'PLAN_SUBMITTED',       'Kế hoạch KH-202612-003 chờ phê duyệt',          'Trưởng nhóm Nguyễn Hoàng Đức vừa trình duyệt Kế hoạch kiểm tra Chuyên đề Kho Lạnh & An toàn Lao động Tháng 12/2026.', '/plans', NULL::timestamptz, now() - INTERVAL '10 minutes'),
    ('admin',      'FINDING_ESCALATED',    'Cảnh báo nâng mức rủi ro tại Chiyoda Sushi Pasteur', 'Tiêu chí TC-VS-03 (Nhiệt độ tủ mát Sashimi) tại Chiyoda Sushi Pasteur đã chạm ngưỡng tái phạm riêng (2 lần) và tăng lên Mức 4.', '/risk-profiles', NULL, now() - INTERVAL '45 minutes'),
    ('admin',      'FINDING_ESCALATED',    'Cảnh báo nâng +2 bậc rủi ro tại Ussina Landmark 81', 'Nhà hàng Fine Dining Ussina Landmark 81 áp dụng quy tắc nâng +2 bậc riêng cho tiêu chí TC-KL-06 (Bảo quản bò Aging Beef).', '/risk-profiles', NULL, now() - INTERVAL '1 hour 20 minutes'),
    ('admin',      'INSPECTION_SUBMITTED', 'Hoàn tất kiểm tra định kỳ cụm Đà Nẵng & Nha Trang', 'Chuyên viên Lê Hoàng Bảo đã hoàn tất 6 biên bản kiểm tra định kỳ tại Đà Nẵng, Huế và Nha Trang.', '/inspections', now() - INTERVAL '3 hours', now() - INTERVAL '5 hours'),
    ('admin',      'SYSTEM_BACKUP',        'Đồng bộ danh mục 100+ tiêu chí ISO/HACCP hoàn tất', 'Chuyên gia Nguyễn Công Phượng đã cập nhật 3 nhóm tiêu chí mới: Kho lạnh Cold Chain, An toàn lao động và Thương hiệu Nhật Bản.', '/criteria', now() - INTERVAL '6 hours', now() - INTERVAL '8 hours'),
    ('manager2',   'PLAN_SUBMITTED',       '2 Kế hoạch Tháng 12/2026 đang chờ duyệt',        'Hiện có 2 kế hoạch kiểm soát tháng 12/2026 (KH-202612-001 và KH-202612-003) đang chờ lãnh đạo phòng KSVH phê duyệt.', '/plans', NULL, now() - INTERVAL '15 minutes'),
    ('manager2',   'APPEAL_MEETING',       'Họp hội đồng giải quyết khiếu nại Tenku Sky Bar','Lịch họp thống nhất khiếu nại giữa KSVH và OBM đối với cơ sở Tenku Landmark 81 vào 14:00 chiều nay.', '/findings', NULL, now() - INTERVAL '1 hour'),
    ('lead3',      'INSPECTION_COMPLETED', 'Cụm Miền Trung hoàn thành 100% kế hoạch tháng',  'Toàn bộ 7 nhà hàng tại Đà Nẵng, Huế và Nha Trang đã hoàn thành đợt kiểm tra định kỳ và đóng 100% hồ sơ khắc phục.', '/reports', NULL, now() - INTERVAL '2 hours'),
    ('lead4',      'FINDING_ESCALATED',    'Báo cáo điểm nóng tái phạm hệ thống Kho lạnh',   'Đã tổng hợp danh sách các cơ sở vi phạm tiêu chí FIFO/FEFO (TC-KL-04) từ 2 lần trở lên trong kỳ 6 tháng.', '/risk-profiles', NULL, now() - INTERVAL '3 hours'),
    ('inspector6', 'VERIFY_PASSED',        'Đã nghiệm thu đóng lỗi tại Marukame Đà Nẵng',    'Hồ sơ khắc phục bể tách mỡ (TC-MT-01) tại Marukame Udon Vincom Đà Nẵng đã được nghiệm thu thành công.', '/findings', now() - INTERVAL '1 day', now() - INTERVAL '2 days'),
    ('obm4',       'INSPECTION_SUBMITTED', 'Kết quả kiểm tra cụm Đà Nẵng - Nha Trang T11/2026','Báo cáo tổng hợp điểm tuân thủ của 7 nhà hàng khu vực Miền Trung đạt trung bình 94.8%.', '/reports', NULL, now() - INTERVAL '4 hours'),
    ('obm5',       'FINDING_ESCALATED',    'Cảnh báo tái phạm tại Chiyoda Sushi Kim Mã',     'Cơ sở Chiyoda Sushi Kim Mã (Hà Nội) vừa phát sinh lỗi tái phạm nhiệt độ tủ bảo quản Sashimi.', '/risk-profiles', NULL, now() - INTERVAL '5 hours')
) AS v(uname, ntype, title, body, link, read_at, created_at)
JOIN users u ON u.username = v.uname;

INSERT INTO audit_logs (created_at, user_id, username, user_full_name, action, target_type, target_id, summary, ip_address, details)
SELECT v.created_at, u.id, u.username, u.full_name, v.action, v.target_type, v.target_id, v.summary, v.ip, v.details
FROM (VALUES
    (now() - INTERVAL '5 minutes',  'bizadmin2',  'CREATE_CRITERIA_GROUP','CRITERIA_GROUP','GRP-KHO-LANH',   'Thêm mới nhóm tiêu chí Quản lý Kho Lạnh, Chuỗi Cung ứng & Truy xuất Nguồn gốc (Cold Chain)', '10.10.24.112', '{"groupCode":"GRP-KHO-LANH","criteriaAdded":10}'),
    (now() - INTERVAL '8 minutes',  'bizadmin2',  'CREATE_CRITERIA_GROUP','CRITERIA_GROUP','GRP-ATLD-MT',    'Thêm mới nhóm tiêu chí An toàn Lao động, Vệ sinh Môi trường & Xử lý Nước thải', '10.10.24.112', '{"groupCode":"GRP-ATLD-MT","criteriaAdded":10}'),
    (now() - INTERVAL '12 minutes', 'bizadmin2',  'CREATE_CRITERIA_GROUP','CRITERIA_GROUP','GRP-THUONGHIEU', 'Thêm mới nhóm tiêu chí Tiêu chuẩn Hình ảnh Thương hiệu & Trải nghiệm Nhật Bản', '10.10.24.112', '{"groupCode":"GRP-THUONGHIEU","criteriaAdded":10}'),
    (now() - INTERVAL '20 minutes', 'lead4',      'CREATE_PLAN',          'PLAN',          'KH-202612-003',  'Trình duyệt Kế hoạch kiểm tra Chuyên đề Kho Lạnh & An toàn Lao động Tháng 12/2026 (22 cơ sở)', '10.10.24.118', '{"planCode":"KH-202612-003","assignments":22,"status":"PENDING_APPROVAL"}'),
    (now() - INTERVAL '40 minutes', 'admin',      'UPDATE_ORG_UNIT',      'ORG_UNIT',      'USS-TD',         'Cấu hình ngưỡng nâng mức riêng (Ngưỡng 2 lần, bước nâng +2 bậc, chu kỳ 9 tháng) cho Ussina Villa Thảo Điền', '10.10.24.101', '{"code":"USS-TD","escalationThreshold":2,"escalationStep":2,"escalationResetMonths":9}'),
    (now() - INTERVAL '1 hour',     'admin',      'UPDATE_ORG_UNIT',      'ORG_UNIT',      'TNK-HN01',       'Cấu hình ngưỡng nâng mức riêng (Ngưỡng 2 lần, bước nâng +2 bậc, chu kỳ 9 tháng) cho Tenku Lotte Center Hà Nội', '10.10.24.101', '{"code":"TNK-HN01","escalationThreshold":2,"escalationStep":2,"escalationResetMonths":9}'),
    (now() - INTERVAL '2 hours',    'inspector6', 'COMPLETE_INSPECTION',  'INSPECTION',    'PER-2611-MK-DN01','Hoàn tất biên bản kiểm tra định kỳ tháng 11/2026 tại Marukame Udon Vincom Đà Nẵng', '113.160.22.41', '{"inspectionCode":"PER-2611-MK-DN01","region":"CENTRAL","status":"COMPLETED"}'),
    (now() - INTERVAL '3 hours',    'inspector7', 'COMPLETE_INSPECTION',  'INSPECTION',    'PER-2611-MK-BH01','Hoàn tất biên bản kiểm tra định kỳ tháng 11/2026 tại Marukame Udon Vincom Biên Hòa', '113.161.90.12', '{"inspectionCode":"PER-2611-MK-BH01","region":"SOUTH","status":"COMPLETED"}'),
    (now() - INTERVAL '4 hours',    'inspector11','COMPLETE_INSPECTION',  'INSPECTION',    'PER-2611-MK-HP01','Hoàn tất biên bản kiểm tra định kỳ tháng 11/2026 tại Marukame Udon Aeon Mall Hải Phòng', '27.72.88.19', '{"inspectionCode":"PER-2611-MK-HP01","region":"NORTH","status":"COMPLETED"}'),
    (now() - INTERVAL '6 hours',    'inspector9', 'VERIFY_FINDING',       'FINDING',       'TC-KL-04',       'Nghiệm thu đạt yêu cầu quy trình sắp xếp kho lạnh FIFO/FEFO tại cụm nhà hàng Marukame Udon', '14.169.55.102', '{"criterionCode":"TC-KL-04","result":"VERIFY_PASSED"}'),
    (now() - INTERVAL '9 hours',    'manager2',   'APPROVE_PLAN',         'PLAN',          'KH-202611-003',  'Phê duyệt Kế hoạch kiểm soát định kỳ Khu vực Miền Trung & Đông Nam Bộ Tháng 11/2026', '10.10.24.106', '{"planCode":"KH-202611-003","approvedBy":"manager2"}'),
    (now() - INTERVAL '14 hours',   'bizadmin2',  'CREATE_TEMPLATE',      'TEMPLATE',      'TMPL-COLD-CHAIN','Tạo mẫu phiếu kiểm tra Chuyên đề Kho Lạnh, Chuỗi Cung ứng & Truy xuất Nguồn gốc (28 tiêu chí)', '10.10.24.112', '{"templateCode":"TMPL-COLD-CHAIN","criteriaCount":28}'),
    (now() - INTERVAL '18 hours',   'bizadmin2',  'CREATE_TEMPLATE',      'TEMPLATE',      'TMPL-SUSHI-RAW', 'Tạo mẫu phiếu kiểm soát Nghiêm ngặt Chuỗi Chiyoda Sushi & Hải sản Tươi sống (53 tiêu chí)', '10.10.24.112', '{"templateCode":"TMPL-SUSHI-RAW","criteriaCount":53}'),
    (now() - INTERVAL '1 day',      'exec_fine',  'EXPORT_REPORT',        'REPORT',        'RANKING-202611', 'Xuất báo cáo Xếp hạng Tuân thủ & Hồ sơ rủi ro khối nhà hàng Fine Dining Tháng 11/2026', '10.10.24.102', '{"reportType":"RESTAURANT_RANKING","format":"XLSX"}'),
    (now() - INTERVAL '2 days',     'exec_north', 'EXPORT_REPORT',        'REPORT',        'SUMMARY-202610', 'Xuất báo cáo Tổng hợp Chất lượng Vận hành Khu vực Miền Bắc Quý 3 & Tháng 10/2026', '27.72.100.10', '{"reportType":"MONTHLY_SUMMARY","company":"LOTUS-NORTH","format":"XLSX"}'),
    (now() - INTERVAL '3 days',     'admin',      'CREATE_COMPANY',       'COMPANY',       'LOTUS-CENTRAL',  'Khởi tạo pháp nhân Công ty TNHH Ẩm thực V-Lotus Miền Trung (Đà Nẵng, Huế & Nha Trang)', '10.10.24.101', '{"companyCode":"LOTUS-CENTRAL","restaurantsCount":7}')
) AS v(created_at, uname, action, target_type, target_id, summary, ip, details)
JOIN users u ON u.username = v.uname;
