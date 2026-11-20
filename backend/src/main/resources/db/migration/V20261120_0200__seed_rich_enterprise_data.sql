-- ============================================================================
-- V20261120_0100__seed_rich_enterprise_data.sql
-- BỘ DỮ LIỆU DOANH NGHIỆP PHONG PHÚ CHO HỆ THỐNG KIỂM SOÁT VẬN HÀNH (KSVH QC)
-- ============================================================================

-- 1. DỌN DẸP CÁC DỮ LIỆU RÁC / NHÁP THỬ NGHIỆM CŨ (nếu không vướng khoá ngoại)
DELETE FROM template_criteria WHERE criterion_id IN (SELECT id FROM criteria WHERE code IN ('ss-2', 'DEMO-VS.01'));
DELETE FROM criteria WHERE code IN ('ss-2') AND id NOT IN (SELECT criterion_id FROM inspection_items) AND id NOT IN (SELECT criterion_id FROM findings);
DELETE FROM criterion_groups WHERE code IN ('dgdf', 'a0001', 'MASS', 'DEMO-KHO') AND id NOT IN (SELECT group_id FROM criteria);

-- Chuẩn hoá tên các công ty thử nghiệm cũ thành các Công ty thành viên của Tập đoàn V-Lotus Holdings
UPDATE companies SET code = 'LOTUS-NORTH', name = 'CÔNG TY TNHH V-LOTUS MIỀN BẮC (Chi nhánh Hà Nội & Hải Phòng)', active = true WHERE code = 'A001';
UPDATE companies SET code = 'LOTUS-SOUTH', name = 'CÔNG TY CP ẨM THỰC V-LOTUS MIỀN NAM (TP.HCM & Bình Dương)', active = true WHERE code = 'B';
UPDATE companies SET code = 'LOTUS-FINE',  name = 'CÔNG TY TNHH FINE DINING & HOSPITALITY V-LOTUS', active = true WHERE code = 'test';
UPDATE companies SET code = 'LOTUS-BAKERY',name = 'CÔNG TY TNHH BÁNH & CAFE NHẬT BẢN CONSERVO VIỆT NAM', active = true WHERE code = 'DEMO';

INSERT INTO companies (code, name, active) VALUES
    ('LOTUS',        'CÔNG TY CP TẬP ĐOÀN LOTUS (V-Lotus Holdings F&B)', true),
    ('LOTUS-NORTH',  'CÔNG TY TNHH V-LOTUS MIỀN BẮC (Chi nhánh Hà Nội & Hải Phòng)', true),
    ('LOTUS-SOUTH',  'CÔNG TY CP ẨM THỰC V-LOTUS MIỀN NAM (TP.HCM & Bình Dương)', true),
    ('LOTUS-FINE',   'CÔNG TY TNHH FINE DINING & HOSPITALITY V-LOTUS', true),
    ('LOTUS-BAKERY', 'CÔNG TY TNHH BÁNH & CAFE NHẬT BẢN CONSERVO VIỆT NAM', true)
ON CONFLICT (lower(code)) DO UPDATE SET name = EXCLUDED.name, active = true;

-- Xoá user rác test cũ nếu có
DELETE FROM users WHERE username LIKE 'commit_notif_user_%';

-- 2. BỔ SUNG ĐỘI NGŨ TÀI KHOẢN NGƯỜI DÙNG & PHÂN QUYỀN VAI TRÒ
DO $$
DECLARE
    v_pw_hash TEXT;
BEGIN
    SELECT password_hash INTO v_pw_hash FROM users WHERE username = 'inspector' LIMIT 1;
    IF v_pw_hash IS NULL THEN
        v_pw_hash := '{bcrypt}$2a$10$fzRhc28Ul9IDpVqLzc/rROmDGdu2YNLWamSqs8jkrDFZ./19M41qe';
    END IF;

    -- Cập nhật tên đầy đủ chuyên nghiệp cho các tài khoản mặc định (vai trò hiển thị ở dòng phụ)
    UPDATE users SET full_name = 'Nguyễn Hoàng Minh' WHERE username = 'admin';
    UPDATE users SET full_name = 'Trần Thị Bích Ngọc' WHERE username = 'bizadmin';
    UPDATE users SET full_name = 'Lê Quốc Tuấn' WHERE username = 'lead';
    UPDATE users SET full_name = 'Phạm Hồng Sơn' WHERE username = 'manager';
    UPDATE users SET full_name = 'Võ Thành Đạt' WHERE username = 'inspector';
    UPDATE users SET full_name = 'Đặng Thu Thảo' WHERE username = 'store';
    UPDATE users SET full_name = 'Hoàng Gia Bảo' WHERE username = 'obm';
    UPDATE users SET full_name = 'Lý Nhật Nam (Phó Tổng Giám đốc Vận hành)' WHERE username = 'executive';
    UPDATE users SET full_name = 'Ngô Thanh Tùng (Chuyên viên KSVH Khu vực 2)', active = true WHERE username = 'auditor';

    -- Thêm 12 tài khoản chuyên viên KSVH, OBM, Cửa hàng trưởng thực tế
    INSERT INTO users (username, password_hash, full_name, active) VALUES
        ('inspector2', v_pw_hash, 'Phan Minh Khôi (Chuyên viên KSVH Khu vực Bắc)', true),
        ('inspector3', v_pw_hash, 'Đỗ Ngọc Lan (Chuyên viên KSVH VSATTP)', true),
        ('inspector4', v_pw_hash, 'Bùi Anh Tuấn (Chuyên viên KSVH PCCC & Kỹ thuật)', true),
        ('inspector5', v_pw_hash, 'Trương Mỹ Linh (Chuyên viên KSVH Fine Dining)', true),
        ('obm2',       v_pw_hash, 'Vũ Đức Thắng (Giám sát Vận hành OBM Chuỗi CoCo & Yoshinoya)', true),
        ('obm3',       v_pw_hash, 'Nguyễn Thị Hương Giang (Giám sát Vận hành OBM Fine Dining & Sushi)', true),
        ('store_mk',   v_pw_hash, 'Lâm Chấn Huy (Cửa hàng trưởng Cụm Marukame Udon)', true),
        ('store_coco', v_pw_hash, 'Trịnh Kim Chi (Cửa hàng trưởng Cụm CoCo Ichibanya)', true),
        ('store_ysh',  v_pw_hash, 'Mai Xuân Trường (Cửa hàng trưởng Cụm Yoshinoya)', true),
        ('store_cs',   v_pw_hash, 'Hồ Ngọc Hà (Cửa hàng trưởng Cụm Chiyoda Sushi)', true),
        ('store_fine', v_pw_hash, 'Đinh Tiến Đạt (Tổng Quản lý Ussina & Tenku Landmark 81)', true),
        ('lead2',      v_pw_hash, 'Châu Gia Kiệt (Trưởng nhóm KSVH Khu vực Miền Bắc)', true)
    ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name, active = true;

    -- Gán role cho các user mới
    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'KSVH_INSPECTOR'
    WHERE u.username IN ('auditor', 'inspector2', 'inspector3', 'inspector4', 'inspector5')
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'OBM'
    WHERE u.username IN ('obm2', 'obm3')
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'STORE_MANAGER'
    WHERE u.username IN ('store_mk', 'store_coco', 'store_ysh', 'store_cs', 'store_fine')
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'KSVH_LEAD'
    WHERE u.username IN ('lead2')
    ON CONFLICT DO NOTHING;
END $$;

-- 3. CẬP NHẬT & BỔ SUNG ĐƠN VỊ / NHÀ HÀNG (ORG UNITS)
UPDATE org_units SET code = 'LOTUS-HR', name = 'Phòng Hành chính Nhân sự & Đào tạo V-Lotus', address = 'Tầng 4, 9-9A Nơ Trang Long, Bình Thạnh, TP.HCM', company_id = (SELECT id FROM companies WHERE code = 'LOTUS') WHERE code = 'TEST1';
UPDATE org_units SET code = 'MK-LTT', name = 'Marukame Udon Lê Thánh Tôn (Little Japan)', address = '15A Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM', company_id = (SELECT id FROM companies WHERE code = 'LOTUS') WHERE code = 'NH-DEMO-01';

INSERT INTO org_units (company_id, unit_type, code, name, address, latitude, longitude, checkin_radius_m, store_manager_user_id, obm_user_id, active, escalation_threshold, escalation_reset_months)
SELECT c.id, v.unit_type, v.code, v.name, v.address, v.lat, v.lng, v.radius,
       (SELECT id FROM users WHERE username = v.store_user),
       (SELECT id FROM users WHERE username = v.obm_user),
       true, v.esc_threshold, v.esc_reset
FROM (VALUES
    ('LOTUS',       'DEPARTMENT', 'LOTUS-FIN',   'Phòng Tài chính Kế toán & Kiểm soát Nội bộ', 'Tầng 6, 9-9A Nơ Trang Long, Bình Thạnh, TP.HCM', NULL::double precision, NULL::double precision, NULL::integer, NULL, NULL, NULL::smallint, NULL::smallint),
    ('LOTUS',       'DEPARTMENT', 'LOTUS-OPS',   'Khối Vận hành Chuỗi Nhà hàng (Operations Division)', 'Tầng 7, 9-9A Nơ Trang Long, Bình Thạnh, TP.HCM', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('LOTUS',       'DEPARTMENT', 'LOTUS-SCM',   'Trung tâm Cung ứng & Bếp Trung tâm (Central Kitchen)', 'KCN Tân Bình, Quận Tân Phú, TP.HCM', 10.8092, 106.6251, 200, NULL, NULL, NULL, NULL),
    ('LOTUS-NORTH', 'DEPARTMENT', 'LOTUS-HN-HQ', 'Văn phòng Đại diện V-Lotus Khu vực Miền Bắc', 'Tầng 12 Tháp A Vincom Bà Triệu, Hai Bà Trưng, Hà Nội', 21.0115, 105.8495, 150, NULL, NULL, NULL, NULL),
    ('LOTUS-NORTH', 'RESTAURANT', 'MK-HN02',     'Marukame Udon Aeon Mall Long Biên', 'Tầng 3 Aeon Mall Long Biên, 27 Cổ Linh, Long Biên, Hà Nội', 21.0268, 105.8992, 120, 'store_mk', 'obm', NULL, NULL),
    ('LOTUS-NORTH', 'RESTAURANT', 'MK-HN03',     'Marukame Udon Lotte Mall West Lake Tây Hồ', 'Tầng 3 Lotte Mall Tây Hồ, 272 Võ Chí Công, Tây Hồ, Hà Nội', 21.0765, 105.8112, 120, 'store_mk', 'obm', NULL, NULL),
    ('LOTUS-NORTH', 'RESTAURANT', 'COCO-HN02',   'CoCo Ichibanya Lotte Center Đào Tấn', 'Tầng 6 Lotte Center, 54 Liễu Giai, Ba Đình, Hà Nội', 21.0319, 105.8124, 100, 'store_coco', 'obm2', NULL, NULL),
    ('LOTUS-SOUTH', 'RESTAURANT', 'MK-BD01',     'Marukame Udon Aeon Mall Bình Dương Canary', 'Tầng 2 Aeon Mall Bình Dương, Thuận An, Bình Dương', 10.9325, 106.7131, 120, 'store_mk', 'obm', NULL, NULL),
    ('LOTUS-SOUTH', 'RESTAURANT', 'YSH-NTMK',    'Yoshinoya Nguyễn Thị Minh Khai', '78 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP.HCM', 10.7791, 106.6924, 100, 'store_ysh', 'obm2', NULL, NULL),
    ('LOTUS-SOUTH', 'RESTAURANT', 'CS-PMH',      'Chiyoda Sushi Phú Mỹ Hưng Midtown', 'Khu M8 The Peak Midtown, Phú Mỹ Hưng, Quận 7, TP.HCM', 10.7248, 106.7269, 100, 'store_cs', 'obm3', 2::smallint, 6::smallint),
    ('LOTUS-FINE',  'RESTAURANT', 'USS-SGC',     'Ussina Aging Beef & Bar Saigon Centre', 'Tầng 6 Saigon Centre, 65 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', 10.7738, 106.7011, 100, 'store_fine', 'obm3', 2::smallint, 9::smallint),
    ('LOTUS-BAKERY','RESTAURANT', 'CSV-PMH',     'Conservo Japanese Bakery & Cafe Phú Mỹ Hưng', '118 Nguyễn Đức Cảnh, Tân Phong, Quận 7, TP.HCM', 10.7259, 106.7095, 100, 'store', 'obm2', NULL, NULL)
) AS v(comp_code, unit_type, code, name, address, lat, lng, radius, store_user, obm_user, esc_threshold, esc_reset)
JOIN companies c ON lower(c.code) = lower(v.comp_code)
ON CONFLICT (lower(code)) DO UPDATE
SET name = EXCLUDED.name,
    company_id = EXCLUDED.company_id,
    store_manager_user_id = COALESCE(EXCLUDED.store_manager_user_id, org_units.store_manager_user_id),
    obm_user_id = COALESCE(EXCLUDED.obm_user_id, org_units.obm_user_id),
    escalation_threshold = COALESCE(EXCLUDED.escalation_threshold, org_units.escalation_threshold),
    escalation_reset_months = COALESCE(EXCLUDED.escalation_reset_months, org_units.escalation_reset_months);

-- Phân bổ thêm các CHT và OBM mới cho 25 nhà hàng Lotus sẵn có để dữ liệu báo cáo & phân quyền sống động
UPDATE org_units SET escalation_threshold = 2, escalation_reset_months = 9,
    store_manager_user_id = COALESCE((SELECT id FROM users WHERE username = 'store_fine'), store_manager_user_id),
    obm_user_id = COALESCE((SELECT id FROM users WHERE username = 'obm3'), obm_user_id)
WHERE code IN ('USS-LM81', 'TNK-LM81');

UPDATE org_units SET escalation_threshold = 2, escalation_reset_months = 6
WHERE code IN ('CS-PST', 'CS-SGC', 'CS-TD');

-- 4. BỔ SUNG HỒ SƠ NHÂN SỰ (EMPLOYEES) ĐẦY ĐỦ (30+ NHÂN VIÊN)
INSERT INTO employees (employee_code, full_name, job_title, org_unit_id, phone, email, user_id, active)
SELECT v.emp_code, v.full_name, v.job_title,
       (SELECT id FROM org_units WHERE lower(code) = lower(v.unit_code) LIMIT 1),
       v.phone, v.email,
       (SELECT id FROM users WHERE username = v.username LIMIT 1),
       true
FROM (VALUES
    ('NV001', 'Nguyễn Hoàng Minh',        'Chuyên viên Quản trị Hệ thống (System Admin)',    'LOTUS-QC',    '0901234567', 'minh.nh@vlotus.vn',       'admin'),
    ('NV002', 'Trần Thị Bích Ngọc',       'Chuyên viên Quản lý Tiêu chuẩn & Nghiệp vụ KSVH', 'LOTUS-QC',    '0902345678', 'ngoc.ttb@vlotus.vn',      'bizadmin'),
    ('NV003', 'Lê Quốc Tuấn',             'Trưởng nhóm Kiểm Soát Vận Hành Khu vực Nam',      'LOTUS-QC',    '0903456789', 'tuan.lq@vlotus.vn',       'lead'),
    ('NV004', 'Phạm Hồng Sơn',            'Trưởng phòng Đảm bảo Chất lượng & KSVH',          'LOTUS-QC',    '0904567890', 'son.ph@vlotus.vn',        'manager'),
    ('NV005', 'Võ Thành Đạt',             'Chuyên viên KSVH Senior (Trưởng đoàn kiểm tra)',  'LOTUS-QC',    '0905678901', 'dat.vt@vlotus.vn',        'inspector'),
    ('NV006', 'Đặng Thu Thảo',            'Cửa hàng trưởng Marukame Udon Bến Thành',         'MK-BT',       '0906789012', 'thao.dt@vlotus.vn',       'store'),
    ('NV007', 'Hoàng Gia Bảo',            'Giám sát Vận hành Vùng (OBM Chuỗi Marukame)',     'LOTUS-OPS',   '0907890123', 'bao.hg@vlotus.vn',        'obm'),
    ('NV008', 'Lý Nhật Nam',              'Phó Tổng Giám đốc Phụ trách Vận hành (COO)',      'LOTUS-HQ',    '0908901234', 'nam.ln@vlotus.vn',        'executive'),
    ('NV009', 'Ngô Thanh Tùng',           'Chuyên viên Kiểm soát Vận hành Khu vực 2',        'LOTUS-QC',    '0909012345', 'tung.nt@vlotus.vn',       'auditor'),
    ('NV010', 'Phan Minh Khôi',           'Chuyên viên Kiểm soát Vận hành Khu vực Bắc',      'LOTUS-HN-HQ', '0911223344', 'khoi.pm@vlotus.vn',       'inspector2'),
    ('NV011', 'Đỗ Ngọc Lan',              'Chuyên viên Kiểm soát VSATTP & Bếp Trung tâm',    'LOTUS-QC',    '0912334455', 'lan.dn@vlotus.vn',        'inspector3'),
    ('NV012', 'Bùi Anh Tuấn',             'Chuyên viên Kiểm soát Kỹ thuật, Bảo trì & PCCC',  'LOTUS-QC',    '0913445566', 'tuan.ba@vlotus.vn',       'inspector4'),
    ('NV013', 'Trương Mỹ Linh',           'Chuyên viên KSVH Khối Fine Dining (Ussina/Tenku)','LOTUS-QC',    '0914556677', 'linh.tm@vlotus.vn',       'inspector5'),
    ('NV014', 'Vũ Đức Thắng',             'Giám sát Vận hành Vùng (OBM CoCo & Yoshinoya)',   'LOTUS-OPS',   '0915667788', 'thang.vd@vlotus.vn',      'obm2'),
    ('NV015', 'Nguyễn Thị Hương Giang',   'Giám sát Vận hành Vùng (OBM Fine Dining & Sushi)','LOTUS-OPS',   '0916778899', 'giang.nth@vlotus.vn',     'obm3'),
    ('NV016', 'Lâm Chấn Huy',             'Cửa hàng trưởng Marukame Udon Thảo Điền',         'MK-TD',       '0917889900', 'huy.lc@vlotus.vn',        'store_mk'),
    ('NV017', 'Trịnh Kim Chi',            'Cửa hàng trưởng CoCo Ichibanya Landmark 81',      'COCO-LM81',   '0918990011', 'chi.tk@vlotus.vn',        'store_coco'),
    ('NV018', 'Mai Xuân Trường',          'Cửa hàng trưởng Yoshinoya Lý Tự Trọng',           'YSH-LTT',     '0919001122', 'truong.mx@vlotus.vn',     'store_ysh'),
    ('NV019', 'Hồ Ngọc Hà',               'Cửa hàng trưởng Chiyoda Sushi Pasteur',           'CS-PST',      '0921112233', 'ha.hn@vlotus.vn',         'store_cs'),
    ('NV020', 'Đinh Tiến Đạt',            'Tổng Quản lý Nhà hàng Ussina & Tenku Landmark 81','USS-LM81',    '0922223344', 'dat.dt@vlotus.vn',        'store_fine'),
    ('NV021', 'Châu Gia Kiệt',            'Trưởng nhóm KSVH Khu vực Miền Bắc',               'LOTUS-HN-HQ', '0923334455', 'kiet.cg@vlotus.vn',       'lead2'),
    ('NV022', 'Lương Bích Hữu',           'Cửa hàng trưởng Marukame Udon Vạn Hạnh Mall',     'MK-VHM',      '0931112223', 'huu.lb@vlotus.vn',        NULL),
    ('NV023', 'Cao Thái Sơn',             'Cửa hàng trưởng Marukame Udon SC VivoCity',       'MK-VIVO',     '0932223334', 'son.ct@vlotus.vn',        NULL),
    ('NV024', 'Phạm Quỳnh Anh',           'Cửa hàng trưởng CoCo Ichibanya Lý Tự Trọng',      'COCO-LTT',    '0933334445', 'anh.pq@vlotus.vn',        NULL),
    ('NV025', 'Ưng Hoàng Phúc',           'Bếp trưởng Điều hành (Executive Chef) Tenku Sky', 'TNK-LM81',    '0934445556', 'phuc.uh@vlotus.vn',       NULL),
    ('NV026', 'Đông Nhi',                 'Cửa hàng trưởng Ushi Mania Vạn Hạnh Mall',        'UM-VHM',      '0935556667', 'nhi.d@vlotus.vn',         NULL),
    ('NV027', 'Ông Cao Thắng',            'Quản lý Bếp Trung tâm & Kiểm định Nguyên liệu',   'LOTUS-SCM',   '0936667778', 'thang.oc@vlotus.vn',      NULL),
    ('NV028', 'Noo Phước Thịnh',          'Cửa hàng trưởng Chiyoda Sushi Saigon Centre',     'CS-SGC',      '0937778889', 'thinh.np@vlotus.vn',      NULL),
    ('NV029', 'Tóc Tiên',                 'Cửa hàng trưởng Conservo Bakery Cafe Thảo Điền',  'CSV-TD',      '0938889990', 'tien.t@vlotus.vn',        NULL),
    ('NV030', 'Bích Phương',              'Cửa hàng trưởng Marukame Udon Vincom Metropolis', 'MK-HN01',     '0939990001', 'phuong.b@vlotus.vn',      NULL),
    ('NV031', 'Sơn Tùng',                 'Chuyên viên Phân tích Dữ liệu & Báo cáo KSVH',    'LOTUS-QC',    '0941112223', 'tung.s@vlotus.vn',        NULL),
    ('NV032', 'Hoàng Thùy Linh',          'Trưởng phòng Đào tạo Tiêu chuẩn Dịch vụ Omotenashi','LOTUS-HR',  '0942223334', 'linh.ht@vlotus.vn',       NULL)
) AS v(emp_code, full_name, job_title, unit_code, phone, email, username)
ON CONFLICT (lower(employee_code)) DO UPDATE
SET full_name = EXCLUDED.full_name,
    job_title = EXCLUDED.job_title,
    org_unit_id = COALESCE(EXCLUDED.org_unit_id, employees.org_unit_id),
    phone = EXCLUDED.phone,
    email = EXCLUDED.email;

-- 5. BỔ SUNG MẪU PHIẾU KIỂM TRA CHUYÊN BIỆT (INSPECTION TEMPLATES)
UPDATE inspection_templates
SET code = 'TMPL-VSATTP-FAST',
    name = 'Mẫu kiểm tra chuyên đề Vệ sinh An toàn Thực phẩm & Bếp (18 Tiêu chí)',
    inspection_type = 'Định kỳ',
    description = 'Mẫu phiếu đánh giá tập trung vào nhiệt độ bảo quản, phân tách sống/chín, lưu mẫu 24h và vệ sinh khu vực sơ chế',
    company_id = (SELECT id FROM companies WHERE code = 'LOTUS')
WHERE code = 'MP-DEMO';

UPDATE inspection_templates
SET inspection_type = 'Định kỳ'
WHERE code = 'TMPL-LOTUS-JP';

INSERT INTO inspection_templates (code, name, inspection_type, description, company_id, active)
SELECT v.code, v.name, 'Định kỳ', v.descr,
       (SELECT id FROM companies WHERE code = v.comp_code LIMIT 1),
       true
FROM (VALUES
    ('TMPL-FINE-DINING', 'Mẫu kiểm soát Tiêu chuẩn Fine Dining Kaiseki & Aging Beef (Ussina / Tenku)', 'Bộ tiêu chuẩn khắt khe 70 điểm rủi ro áp dụng cho chuỗi nhà hàng cao cấp tại Landmark 81 và Saigon Centre', 'LOTUS-FINE'),
    ('TMPL-PCCC-CSVC',   'Mẫu kiểm tra Chuyên đề An toàn PCCC, Hệ thống Gas & Cơ sở vật chất',         'Đánh giá chuyên sâu hệ thống báo cháy, bình PCCC, van ngắt gas tự động, tủ điện và lối thoát hiểm', 'LOTUS'),
    ('TMPL-BAKERY-CAFE', 'Mẫu kiểm soát Chuỗi Bánh tươi & Cafe Nhật Bản (Conservo Bakery & Cafe)',     'Tập trung kiểm soát VSATTP quầy bánh tươi, hạn sử dụng trong ngày, vệ sinh máy pha cà phê và thu ngân POS', 'LOTUS-BAKERY'),
    ('TMPL-NORTH-OPS',   'Mẫu kiểm tra Định kỳ Chuỗi Nhà hàng V-Lotus Khu vực Miền Bắc (Hà Nội)',      'Áp dụng cho các cơ sở Marukame Udon và CoCo Ichibanya tại Vincom Metropolis, Lotte Center, Aeon Long Biên', 'LOTUS-NORTH')
) AS v(code, name, descr, comp_code)
ON CONFLICT (lower(code)) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Gán tiêu chí cho các mẫu phiếu mới
INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (PARTITION BY t.id ORDER BY g.sort_order, c.sort_order)
FROM inspection_templates t
JOIN criteria c ON true
JOIN criterion_groups g ON g.id = c.group_id
WHERE t.code IN ('TMPL-FINE-DINING', 'TMPL-NORTH-OPS') AND g.code LIKE 'GRP-%'
ON CONFLICT DO NOTHING;

INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (ORDER BY c.sort_order)
FROM inspection_templates t
JOIN criteria c ON true
JOIN criterion_groups g ON g.id = c.group_id
WHERE t.code = 'TMPL-VSATTP-FAST' AND g.code IN ('GRP-VSATTP', 'GRP-BEP')
ON CONFLICT DO NOTHING;

INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (ORDER BY c.sort_order)
FROM inspection_templates t
JOIN criteria c ON true
JOIN criterion_groups g ON g.id = c.group_id
WHERE t.code = 'TMPL-PCCC-CSVC' AND g.code IN ('GRP-CSVC', 'GRP-BAR-POS')
ON CONFLICT DO NOTHING;

INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, row_number() OVER (ORDER BY g.sort_order, c.sort_order)
FROM inspection_templates t
JOIN criteria c ON true
JOIN criterion_groups g ON g.id = c.group_id
WHERE t.code = 'TMPL-BAKERY-CAFE' AND g.code IN ('GRP-VSATTP', 'GRP-DV', 'GRP-BAR-POS')
ON CONFLICT DO NOTHING;

-- 6. BỔ SUNG LỊCH SỬ PHIÊN BẢN PHÂN LOẠI RỦI RO, KỲ ĐẾM TẦN SUẤT & QUY TẮC TÁI PHẠM
-- Chuẩn hoá phiên bản hiện hành theo đúng tài liệu nghiệp vụ (M1: 0-1, M2: 1-6, M3: 6-12, M4: >=12)
DELETE FROM risk_levels WHERE effective_from = '2026-11-20';
DELETE FROM notification_dispatches WHERE notification_id IS NULL;

INSERT INTO risk_levels (code, name, min_score, max_score, remediation_days, action, sort_order, effective_from, updated_by)
VALUES
    ('M1', 'Thấp',         0.00,  2.00, 45, 'Theo dõi tại cơ sở và nhắc nhở nhân viên ca trực', 1, '2025-07-01', 1),
    ('M2', 'Trung bình',   2.00,  5.00, 21, 'Cửa hàng trưởng lập kế hoạch khắc phục và báo cáo OBM', 2, '2025-07-01', 1),
    ('M3', 'Cao',          5.00, 10.00,  7, 'Khắc phục khẩn cấp trong 7 ngày, KSVH hậu kiểm thực tế', 3, '2025-07-01', 1),
    ('M4', 'Nghiêm trọng',10.00,  NULL,  1, 'Đình chỉ hạng mục vi phạm, báo cáo Ban Giám đốc xử lý trong 24h', 4, '2025-07-01', 1),
    ('M1', 'Thấp',         0.00,  1.00, 60, 'Theo dõi định kỳ và chuẩn hoá quy trình SOP tại nhà hàng', 1, '2026-01-01', 4),
    ('M2', 'Trung bình',   1.00,  6.00, 30, 'Lập kế hoạch khắc phục có thời hạn và gửi ảnh nghiệm thu', 2, '2026-01-01', 4),
    ('M3', 'Cao',          6.00, 12.00,  7, 'Khắc phục, tìm nguyên nhân gốc rễ và bắt buộc kiểm tra lại', 3, '2026-01-01', 4),
    ('M4', 'Nghiêm trọng',12.00,  NULL,  1, 'Lập biên bản khẩn, báo cáo Ban Giám đốc và OBM xử lý ngay', 4, '2026-01-01', 4)
ON CONFLICT (code, effective_from) DO UPDATE
SET min_score = EXCLUDED.min_score, max_score = EXCLUDED.max_score, remediation_days = EXCLUDED.remediation_days;

INSERT INTO frequency_configs (period_months, effective_from, note, created_by)
VALUES
    (3, '2025-07-01', 'Kỳ đếm tần suất quý (3 tháng) áp dụng giai đoạn thí điểm năm 2025', 1),
    (6, '2026-01-01', 'Nâng kỳ đếm cuốn lên 6 tháng theo chuẩn vận hành chuỗi Nhật Bản V-Lotus', 4)
ON CONFLICT (effective_from) DO UPDATE SET period_months = EXCLUDED.period_months;

INSERT INTO impact_escalation_rules (threshold_count, step_increase, max_impact, reset_period_months, effective_from, note, created_by)
VALUES
    (4, 1, 5, 3, '2025-07-01', 'Quy tắc nâng mức giai đoạn thí điểm 2025 (tái phạm lần 4 tăng 1 bậc)', 1),
    (3, 1, 5, 6, '2026-01-01', 'Quy tắc chuẩn V-Lotus: tái phạm từ lần 3 tăng +1 bậc rủi ro, sạch lỗi 6 tháng hoàn nguyên', 4)
ON CONFLICT (effective_from) DO UPDATE
SET threshold_count = EXCLUDED.threshold_count, step_increase = EXCLUDED.step_increase, reset_period_months = EXCLUDED.reset_period_months;

-- 7. BỔ SUNG KẾ HOẠCH KIỂM SOÁT (INSPECTION PLANS) & PHÂN CÔNG (PLAN ASSIGNMENTS)
INSERT INTO inspection_plans (plan_code, title, start_date, end_date, status, rejection_reason, notes, created_by, approved_by, approved_at, created_at)
VALUES
    ('KH-202607-001', 'Kế hoạch kiểm soát chất lượng định kỳ Tháng 07/2026 – Toàn chuỗi V-Lotus', '2026-07-01', '2026-07-31', 'APPROVED', NULL, 'Hoàn thành 100% chỉ tiêu kiểm tra mùa cao điểm hè', 5, 2, '2026-06-28 10:00:00+07', '2026-06-25 09:00:00+07'),
    ('KH-202608-001', 'Kế hoạch kiểm soát VSATTP & PCCC định kỳ Tháng 08/2026',                    '2026-08-01', '2026-08-31', 'APPROVED', NULL, 'Tập trung kiểm tra nhiệt độ kho lạnh và hệ thống hút mùi bếp', 5, 2, '2026-07-29 14:30:00+07', '2026-07-26 09:00:00+07'),
    ('KH-202609-001', 'Kế hoạch kiểm soát vận hành định kỳ Tháng 09/2026 – Chuỗi Marukame & CoCo', '2026-09-01', '2026-09-30', 'APPROVED', NULL, 'Đợt kiểm tra định kỳ chuẩn bị quý 4/2026', 5, 2, '2026-08-30 11:00:00+07', '2026-08-27 08:30:00+07'),
    ('KH-202610-001', 'Kế hoạch kiểm soát chất lượng toàn diện Tháng 10/2026 (TP.HCM & Hà Nội)',   '2026-10-01', '2026-10-31', 'APPROVED', NULL, 'Mở rộng kiểm tra đồng loạt khối Fine Dining và chuỗi Sushi', 5, 2, '2026-09-29 16:00:00+07', '2026-09-25 10:00:00+07'),
    ('KH-202611-002', 'Kế hoạch kiểm tra chuyên đề Fine Dining & Chuỗi Miền Bắc Tháng 11/2026',    '2026-11-05', '2026-11-30', 'APPROVED', NULL, 'Phối hợp kiểm tra chéo giữa các chuyên viên KSVH Senior', 5, 2, '2026-11-03 09:30:00+07', '2026-11-01 14:00:00+07'),
    ('KH-202612-001', 'Kế hoạch kiểm soát cao điểm Lễ Giáng Sinh & Tết Dương Lịch Tháng 12/2026',  '2026-12-01', '2026-12-31', 'PENDING_APPROVAL', NULL, 'Đề xuất tăng cường kiểm tra VSATTP và tồn kho nguyên liệu cuối năm', 5, NULL, NULL, '2026-11-18 15:00:00+07'),
    ('KH-202612-002', 'Dự thảo Kế hoạch tổng kiểm tra An toàn PCCC & Kho lạnh Quý 1/2027',         '2027-01-02', '2027-01-31', 'DRAFT', NULL, 'Đang rà soát danh sách phân công chuyên viên khu vực Miền Bắc', 5, NULL, NULL, '2026-11-19 10:00:00+07'),
    ('KH-202610-REJ', 'Kế hoạch kiểm tra bổ sung cụm Quận 7 (Bản đề xuất cũ)',                     '2026-10-10', '2026-10-25', 'REJECTED', 'Trùng lịch kiểm tra định kỳ tháng 10 tại Crescent Mall và SC VivoCity, yêu cầu gộp chung vào KH-202610-001', 'Bản đề xuất tách riêng cụm Quận 7', 5, 2, '2026-10-05 11:20:00+07', '2026-10-03 09:00:00+07')
ON CONFLICT (lower(plan_code)) DO NOTHING;

-- 8. SINH DỮ LIỆU ĐỢT KIỂM TRA (INSPECTIONS), HẠNG MỤC CHẤM (ITEMS), LỖI (FINDINGS), LỊCH SỬ TÁI PHẠM (OCCURRENCES) & SỰ KIỆN (EVENTS)
DO $$
DECLARE
    v_tmpl_lotus BIGINT;
    v_tmpl_fine BIGINT;
    v_tmpl_vsattp BIGINT;
    v_ins1 BIGINT;
    v_ins2 BIGINT;
    v_ins3 BIGINT;
    v_ins4 BIGINT;
    v_ins5 BIGINT;
    v_lead BIGINT;
    v_mgr BIGINT;
    v_store BIGINT;
    v_obm BIGINT;
    v_obm2 BIGINT;
    v_obm3 BIGINT;
    v_plan_07 BIGINT;
    v_plan_08 BIGINT;
    v_plan_09 BIGINT;
    v_plan_10 BIGINT;
    v_plan_11 BIGINT;
    v_plan_11_2 BIGINT;
    v_plan_12 BIGINT;
    v_rec RECORD;
    v_insp_id BIGINT;
    v_item_rec RECORD;
    v_finding_id BIGINT;
    v_occ_count INT;
    v_eff_impact SMALLINT;
    v_score INT;
    v_rl_code VARCHAR(10);
    v_rl_name VARCHAR(100);
    v_rem_days INT;
BEGIN
    SELECT id INTO v_tmpl_lotus FROM inspection_templates WHERE code = 'TMPL-LOTUS-JP' LIMIT 1;
    SELECT id INTO v_tmpl_fine FROM inspection_templates WHERE code = 'TMPL-FINE-DINING' LIMIT 1;
    SELECT id INTO v_tmpl_vsattp FROM inspection_templates WHERE code = 'TMPL-VSATTP-FAST' LIMIT 1;

    SELECT id INTO v_ins1 FROM users WHERE username = 'inspector' LIMIT 1;
    SELECT id INTO v_ins2 FROM users WHERE username = 'inspector2' LIMIT 1;
    SELECT id INTO v_ins3 FROM users WHERE username = 'inspector3' LIMIT 1;
    SELECT id INTO v_ins4 FROM users WHERE username = 'inspector4' LIMIT 1;
    SELECT id INTO v_ins5 FROM users WHERE username = 'inspector5' LIMIT 1;
    SELECT id INTO v_lead FROM users WHERE username = 'lead' LIMIT 1;
    SELECT id INTO v_mgr FROM users WHERE username = 'manager' LIMIT 1;
    SELECT id INTO v_store FROM users WHERE username = 'store' LIMIT 1;
    SELECT id INTO v_obm FROM users WHERE username = 'obm' LIMIT 1;
    SELECT id INTO v_obm2 FROM users WHERE username = 'obm2' LIMIT 1;
    SELECT id INTO v_obm3 FROM users WHERE username = 'obm3' LIMIT 1;

    SELECT id INTO v_plan_07 FROM inspection_plans WHERE plan_code = 'KH-202607-001';
    SELECT id INTO v_plan_08 FROM inspection_plans WHERE plan_code = 'KH-202608-001';
    SELECT id INTO v_plan_09 FROM inspection_plans WHERE plan_code = 'KH-202609-001';
    SELECT id INTO v_plan_10 FROM inspection_plans WHERE plan_code = 'KH-202610-001';
    SELECT id INTO v_plan_11 FROM inspection_plans WHERE plan_code = 'KH-202611-001';
    SELECT id INTO v_plan_11_2 FROM inspection_plans WHERE plan_code = 'KH-202611-002';
    SELECT id INTO v_plan_12 FROM inspection_plans WHERE plan_code = 'KH-202612-001';

    -- Gán plan_id cho các đợt kiểm tra tháng 9, 10, 11 đã có sẵn
    UPDATE inspections SET plan_id = v_plan_09, location_status = 'VERIFIED', checkin_distance_m = 18.5, acknowledged_by = v_store, acknowledged_at = completed_at WHERE code LIKE 'PER-2609-%';
    UPDATE inspections SET plan_id = v_plan_10, location_status = 'VERIFIED', checkin_distance_m = 24.0, acknowledged_by = v_store, acknowledged_at = completed_at WHERE code LIKE 'PER-2610-%';
    UPDATE inspections SET plan_id = v_plan_11, location_status = 'VERIFIED', checkin_distance_m = 15.2 WHERE code LIKE 'PER-2611-%';

    -- Danh sách 32 đợt kiểm tra mới trải dài từ Tháng 07/2026 -> Tháng 11/2026
    -- Bao gồm đầy đủ: PERIODIC, SURPRISE, VERIFICATION và các trạng thái COMPLETED, AWAITING_ACK, SUBMITTED, IN_PROGRESS, ASSIGNED, CANCELLED
    FOR v_rec IN
        SELECT * FROM (VALUES
            -- Tháng 07/2026 (COMPLETED)
            ('PER-2607-MK-BT',     v_plan_07, 'MK-BT',     v_tmpl_lotus, v_ins1, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-07-10 09:00:00+07'::timestamptz, '2026-07-10 11:20:00+07'::timestamptz, '2026-07-10 14:00:00+07'::timestamptz, ARRAY['TC-VS-02', 'TC-VC-01'], 'Kiểm tra định kỳ tháng 07/2026 tại Marukame Udon Bến Thành'),
            ('PER-2607-COCO-LM81', v_plan_07, 'COCO-LM81', v_tmpl_lotus, v_ins3, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-07-12 09:15:00+07'::timestamptz, '2026-07-12 11:45:00+07'::timestamptz, '2026-07-12 15:00:00+07'::timestamptz, ARRAY['TC-VS-04', 'TC-BP-08'], 'Kiểm tra định kỳ tháng 07/2026 tại CoCo Ichibanya Landmark 81'),
            ('PER-2607-YSH-LTT',   v_plan_07, 'YSH-LTT',   v_tmpl_lotus, v_ins4, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-07-15 08:45:00+07'::timestamptz, '2026-07-15 11:10:00+07'::timestamptz, '2026-07-15 13:30:00+07'::timestamptz, ARRAY['TC-VS-01'],             'Kiểm tra định kỳ tháng 07/2026 tại Yoshinoya Lý Tự Trọng'),
            ('PER-2607-USS-LM81',  v_plan_07, 'USS-LM81',  v_tmpl_fine,  v_ins5, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-07-18 14:00:00+07'::timestamptz, '2026-07-18 16:30:00+07'::timestamptz, '2026-07-18 17:00:00+07'::timestamptz, ARRAY['TC-VC-03'],             'Kiểm tra tiêu chuẩn Fine Dining tháng 07/2026 tại Ussina Landmark 81'),
            ('PER-2607-MK-HN01',   v_plan_07, 'MK-HN01',   v_tmpl_lotus, v_ins2, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-07-22 09:30:00+07'::timestamptz, '2026-07-22 11:50:00+07'::timestamptz, '2026-07-22 14:15:00+07'::timestamptz, ARRAY['TC-VS-11'],             'Kiểm tra định kỳ tháng 07/2026 tại Marukame Udon Metropolis Hà Nội'),

            -- Tháng 08/2026 (COMPLETED)
            ('PER-2608-MK-BT',     v_plan_08, 'MK-BT',     v_tmpl_lotus, v_ins1, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-08-08 09:00:00+07'::timestamptz, '2026-08-08 11:30:00+07'::timestamptz, '2026-08-08 13:45:00+07'::timestamptz, ARRAY['TC-VS-02', 'TC-DV-05'], 'Kiểm tra định kỳ tháng 08/2026 tại Marukame Udon Bến Thành'),
            ('PER-2608-COCO-LM81', v_plan_08, 'COCO-LM81', v_tmpl_lotus, v_ins3, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-08-11 09:20:00+07'::timestamptz, '2026-08-11 11:40:00+07'::timestamptz, '2026-08-11 15:10:00+07'::timestamptz, ARRAY['TC-VS-04', 'TC-VS-02'], 'Kiểm tra định kỳ tháng 08/2026 tại CoCo Ichibanya Landmark 81'),
            ('PER-2608-CS-PST',    v_plan_08, 'CS-PST',    v_tmpl_lotus, v_ins5, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-08-14 10:00:00+07'::timestamptz, '2026-08-14 12:20:00+07'::timestamptz, '2026-08-14 15:00:00+07'::timestamptz, ARRAY['TC-VS-03', 'TC-VS-08'], 'Kiểm tra định kỳ tháng 08/2026 tại Chiyoda Sushi Pasteur'),
            ('PER-2608-YSH-DMP',   v_plan_08, 'YSH-DMP',   v_tmpl_lotus, v_ins4, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-08-19 09:00:00+07'::timestamptz, '2026-08-19 11:15:00+07'::timestamptz, '2026-08-19 14:00:00+07'::timestamptz, ARRAY['TC-VC-09', 'TC-TN-02'], 'Kiểm tra định kỳ tháng 08/2026 tại Yoshinoya Diamond Plaza'),
            ('PER-2608-TNK-LM81',  v_plan_08, 'TNK-LM81',  v_tmpl_fine,  v_ins5, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-08-24 14:30:00+07'::timestamptz, '2026-08-24 16:50:00+07'::timestamptz, '2026-08-24 18:00:00+07'::timestamptz, ARRAY['TC-BP-10'],             'Kiểm tra tiêu chuẩn Kaiseki Fine Dining tại Tenku Sky Bar Landmark 81'),
            ('PER-2608-COCO-HN01', v_plan_08, 'COCO-HN01', v_tmpl_lotus, v_ins2, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-08-27 09:00:00+07'::timestamptz, '2026-08-27 11:25:00+07'::timestamptz, '2026-08-27 14:00:00+07'::timestamptz, ARRAY['TC-VS-17'],             'Kiểm tra định kỳ tháng 08/2026 tại CoCo Ichibanya Metropolis Hà Nội'),

            -- Tháng 09/2026 bổ sung thêm các cơ sở khác (COMPLETED)
            ('PER-2609-MK-VHM',    v_plan_09, 'MK-VHM',    v_tmpl_lotus, v_ins3, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-09-18 09:00:00+07'::timestamptz, '2026-09-18 11:30:00+07'::timestamptz, '2026-09-18 14:00:00+07'::timestamptz, ARRAY['TC-VS-04', 'TC-BP-01'], 'Kiểm tra định kỳ tháng 09/2026 tại Marukame Udon Vạn Hạnh Mall'),
            ('PER-2609-USS-LM81',  v_plan_09, 'USS-LM81',  v_tmpl_fine,  v_ins5, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-09-21 14:00:00+07'::timestamptz, '2026-09-21 16:40:00+07'::timestamptz, '2026-09-21 17:30:00+07'::timestamptz, ARRAY['TC-VC-03', 'TC-VS-03'], 'Kiểm tra định kỳ tháng 09/2026 tại Ussina Aging Beef Landmark 81'),
            ('PER-2609-MK-AON',    v_plan_09, 'MK-AON',    v_tmpl_lotus, v_ins4, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-09-25 09:15:00+07'::timestamptz, '2026-09-25 11:45:00+07'::timestamptz, '2026-09-25 14:20:00+07'::timestamptz, ARRAY['TC-VC-01', 'TC-VS-14'], 'Kiểm tra định kỳ tháng 09/2026 tại Marukame Udon Aeon Bình Tân'),
            ('SUR-2609-COCO-LM81', NULL,      'COCO-LM81', v_tmpl_vsattp,v_ins1, 'SURPRISE', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-09-28 18:30:00+07'::timestamptz, '2026-09-28 20:00:00+07'::timestamptz, '2026-09-28 21:00:00+07'::timestamptz, ARRAY['TC-VS-04', 'TC-BP-08'], 'Kiểm tra đột xuất ca tối cuối tuần tại CoCo Ichibanya Landmark 81'),

            -- Tháng 10/2026 bổ sung thêm các cơ sở (COMPLETED)
            ('PER-2610-MK-BT',     v_plan_10, 'MK-BT',     v_tmpl_lotus, v_ins1, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-10-08 09:00:00+07'::timestamptz, '2026-10-08 11:30:00+07'::timestamptz, '2026-10-08 14:00:00+07'::timestamptz, ARRAY['TC-VS-02', 'TC-VC-01'], 'Kiểm tra định kỳ tháng 10/2026 tại Marukame Udon Bến Thành'),
            ('PER-2610-CS-PST',    v_plan_10, 'CS-PST',    v_tmpl_lotus, v_ins5, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-10-12 09:30:00+07'::timestamptz, '2026-10-12 12:00:00+07'::timestamptz, '2026-10-12 14:30:00+07'::timestamptz, ARRAY['TC-VS-03', 'TC-VS-06'], 'Kiểm tra định kỳ tháng 10/2026 tại Chiyoda Sushi Pasteur'),
            ('PER-2610-YSH-VHM',   v_plan_10, 'YSH-VHM',   v_tmpl_lotus, v_ins3, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-10-19 09:00:00+07'::timestamptz, '2026-10-19 11:20:00+07'::timestamptz, '2026-10-19 13:50:00+07'::timestamptz, ARRAY['TC-BP-03', 'TC-TN-01'], 'Kiểm tra định kỳ tháng 10/2026 tại Yoshinoya Vạn Hạnh Mall'),
            ('PER-2610-COCO-CRM',  v_plan_10, 'COCO-CRM',  v_tmpl_lotus, v_ins4, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-10-22 09:10:00+07'::timestamptz, '2026-10-22 11:40:00+07'::timestamptz, '2026-10-22 15:00:00+07'::timestamptz, ARRAY['TC-VC-04'],             'Kiểm tra định kỳ tháng 10/2026 tại CoCo Ichibanya Crescent Mall'),
            ('PER-2610-MK-HN02',   v_plan_10, 'MK-HN02',   v_tmpl_lotus, v_ins2, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-10-25 09:00:00+07'::timestamptz, '2026-10-25 11:30:00+07'::timestamptz, '2026-10-25 14:00:00+07'::timestamptz, ARRAY['TC-VS-12', 'TC-BP-15'], 'Kiểm tra định kỳ tháng 10/2026 tại Marukame Udon Aeon Long Biên'),
            ('SUR-2610-CS-SGC',    NULL,      'CS-SGC',    v_tmpl_vsattp,v_ins3, 'SURPRISE', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-10-28 11:30:00+07'::timestamptz, '2026-10-28 13:15:00+07'::timestamptz, '2026-10-28 15:00:00+07'::timestamptz, ARRAY['TC-VS-03', 'TC-VS-01'], 'Kiểm tra đột xuất bảo quản cá sống Sashimi tại Chiyoda Sushi Saigon Centre'),

            -- Tháng 11/2026 (COMPLETED, AWAITING_ACK, SUBMITTED, IN_PROGRESS, ASSIGNED, CANCELLED)
            ('PER-2611-COCO-LM81', v_plan_11, 'COCO-LM81', v_tmpl_lotus, v_ins3, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-11-04 09:00:00+07'::timestamptz, '2026-11-04 11:30:00+07'::timestamptz, '2026-11-04 14:00:00+07'::timestamptz, ARRAY['TC-VS-04', 'TC-VS-02', 'TC-BP-08'], 'Kiểm tra định kỳ tháng 11/2026 tại CoCo Ichibanya Landmark 81'),
            ('PER-2611-CS-PST',    v_plan_11, 'CS-PST',    v_tmpl_lotus, v_ins5, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-11-06 09:30:00+07'::timestamptz, '2026-11-06 12:00:00+07'::timestamptz, '2026-11-06 14:30:00+07'::timestamptz, ARRAY['TC-VS-03', 'TC-VS-08'], 'Kiểm tra định kỳ tháng 11/2026 tại Chiyoda Sushi Pasteur'),
            ('PER-2611-YSH-LTT',   v_plan_11, 'YSH-LTT',   v_tmpl_lotus, v_ins4, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-11-08 09:00:00+07'::timestamptz, '2026-11-08 11:20:00+07'::timestamptz, '2026-11-08 15:00:00+07'::timestamptz, ARRAY['TC-VS-01', 'TC-VC-05'], 'Kiểm tra định kỳ tháng 11/2026 tại Yoshinoya Lý Tự Trọng'),
            ('PER-2611-TNK-LM81',  v_plan_11_2,'TNK-LM81', v_tmpl_fine,  v_ins5, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-11-12 14:00:00+07'::timestamptz, '2026-11-12 16:30:00+07'::timestamptz, '2026-11-12 18:00:00+07'::timestamptz, ARRAY['TC-BP-10', 'TC-DV-07'], 'Kiểm tra định kỳ tháng 11/2026 tại Tenku Modern Kaiseki Landmark 81'),
            ('PER-2611-MK-HN01',   v_plan_11_2,'MK-HN01',  v_tmpl_lotus, v_ins2, 'PERIODIC', 'COMPLETED',    'ON_SITE', 'VERIFIED', '2026-11-14 09:00:00+07'::timestamptz, '2026-11-14 11:30:00+07'::timestamptz, '2026-11-14 14:00:00+07'::timestamptz, ARRAY['TC-VS-11', 'TC-TN-04'], 'Kiểm tra định kỳ tháng 11/2026 tại Marukame Udon Metropolis Hà Nội'),
            ('SUR-2611-MK-AON',    NULL,      'MK-AON',    v_tmpl_vsattp,v_ins1, 'SURPRISE', 'AWAITING_ACK', 'ON_SITE', 'VERIFIED', '2026-11-17 10:00:00+07'::timestamptz, '2026-11-17 11:45:00+07'::timestamptz, NULL::timestamptz,                      ARRAY['TC-VC-01', 'TC-VS-15'], 'Kiểm tra đột xuất vệ sinh bẫy mỡ và hệ thống hút khói tại Marukame Aeon Bình Tân'),
            ('VER-2611-USS-LM81',  NULL,      'USS-LM81',  NULL,         v_ins4, 'VERIFICATION','COMPLETED', 'ON_SITE', 'VERIFIED', '2026-11-18 09:30:00+07'::timestamptz, '2026-11-18 10:30:00+07'::timestamptz, '2026-11-18 11:00:00+07'::timestamptz, ARRAY['TC-VC-03'],             'Biên bản hậu kiểm xác minh khắc phục hệ thống bình PCCC tại Ussina Landmark 81'),
            ('PER-2611-UM-CRM',    v_plan_11, 'UM-CRM',    v_tmpl_lotus, v_ins3, 'PERIODIC', 'IN_PROGRESS',  'ON_SITE', 'VERIFIED', '2026-11-19 14:00:00+07'::timestamptz, NULL::timestamptz,                      NULL::timestamptz,                      ARRAY['TC-VS-06'],             'Đang thực hiện kiểm tra trực tiếp tại Ushi Mania Crescent Mall'),
            ('PER-2611-MK-CRM',    v_plan_11, 'MK-CRM',    v_tmpl_lotus, v_ins1, 'PERIODIC', 'ASSIGNED',     'ON_SITE', NULL,       NULL::timestamptz,                      NULL::timestamptz,                      NULL::timestamptz,                      ARRAY[]::text[],               'Lịch phân công kiểm tra định kỳ cuối tháng 11 tại Marukame Crescent Mall'),
            ('PER-2611-COCO-TD',   v_plan_11, 'COCO-TD',   v_tmpl_lotus, v_ins4, 'PERIODIC', 'ASSIGNED',     'ON_SITE', NULL,       NULL::timestamptz,                      NULL::timestamptz,                      NULL::timestamptz,                      ARRAY[]::text[],               'Lịch phân công kiểm tra định kỳ cuối tháng 11 tại CoCo Ichibanya Thảo Điền'),
            ('PER-2611-YSH-VIVO',  v_plan_11, 'YSH-VIVO',  v_tmpl_lotus, v_ins3, 'PERIODIC', 'CANCELLED',    'ON_SITE', NULL,       NULL::timestamptz,                      NULL::timestamptz,                      NULL::timestamptz,                      ARRAY[]::text[],               'Tạm huỷ do nhà hàng đóng cửa bảo trì hệ thống lạnh trung tâm TTTM SC VivoCity')
        ) AS t(code, plan_id, rest_code, tmpl_id, inspector_id, ins_type, status, ins_mode, loc_status, checkin_at, submitted_at, completed_at, fail_codes, notes)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM inspections WHERE lower(code) = lower(v_rec.code)) THEN
            INSERT INTO inspections (
                code, plan_id, restaurant_id, template_id, inspector_id, inspection_type, status, inspection_mode,
                location_status, checkin_lat, checkin_lng, checkin_distance_m,
                checkin_at, submitted_at, completed_at, acknowledged_by, acknowledged_at,
                cancel_reason, notes, created_by, created_at, updated_at, version
            )
            SELECT
                v_rec.code, v_rec.plan_id, ou.id, v_rec.tmpl_id, v_rec.inspector_id, v_rec.ins_type, v_rec.status, v_rec.ins_mode,
                v_rec.loc_status,
                CASE WHEN v_rec.checkin_at IS NOT NULL THEN ou.latitude END,
                CASE WHEN v_rec.checkin_at IS NOT NULL THEN ou.longitude END,
                CASE WHEN v_rec.checkin_at IS NOT NULL THEN 12.4 END,
                v_rec.checkin_at, v_rec.submitted_at, v_rec.completed_at,
                CASE WHEN v_rec.status = 'COMPLETED' THEN COALESCE(ou.store_manager_user_id, v_store) END,
                v_rec.completed_at,
                CASE WHEN v_rec.status = 'CANCELLED' THEN v_rec.notes END,
                v_rec.notes, v_lead,
                COALESCE(v_rec.checkin_at - INTERVAL '2 days', now() - INTERVAL '1 day'),
                COALESCE(v_rec.completed_at, v_rec.submitted_at, v_rec.checkin_at, now()),
                1
            FROM org_units ou WHERE ou.code = v_rec.rest_code
            RETURNING id INTO v_insp_id;

            -- Nếu đợt kiểm tra đã checkin, sinh toàn bộ inspection_items
            IF v_insp_id IS NOT NULL AND v_rec.checkin_at IS NOT NULL THEN
                INSERT INTO inspection_items (
                    inspection_id, criterion_id, criterion_code, criterion_name, group_name,
                    base_impact, result, comment, evidence_urls, sort_order, evaluated_at
                )
                SELECT
                    v_insp_id, c.id, c.code, c.name, g.name,
                    c.base_impact,
                    CASE
                        WHEN c.code = ANY(v_rec.fail_codes) THEN 'FAIL'
                        WHEN v_rec.status = 'IN_PROGRESS' AND c.sort_order > 10 THEN 'UNRATED'
                        ELSE 'PASS'
                    END,
                    CASE
                        WHEN c.code = ANY(v_rec.fail_codes) THEN 'Ghi nhận điểm không phù hợp tại hiện trường: ' || c.name || ' chưa đạt chuẩn quy định SOP V-Lotus.'
                        ELSE NULL
                    END,
                    CASE
                        WHEN c.code = ANY(v_rec.fail_codes) THEN 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'
                        ELSE NULL
                    END,
                    row_number() OVER (ORDER BY g.sort_order, c.sort_order),
                    v_rec.checkin_at + INTERVAL '45 minutes'
                FROM criteria c
                JOIN criterion_groups g ON g.id = c.group_id
                WHERE g.code LIKE 'GRP-%'
                  AND (v_rec.ins_type != 'VERIFICATION' OR c.code = ANY(v_rec.fail_codes));
            END IF;
        END IF;
    END LOOP;

    -- 9. TẠO PHÂN CÔNG KẾ HOẠCH (INSPECTION PLAN ASSIGNMENTS) ĐẦY ĐỦ CHO CÁC KẾ HOẠCH
    INSERT INTO inspection_plan_assignments (plan_id, restaurant_id, inspector_id, template_id, scheduled_date, sort_order, inspection_id, created_at)
    SELECT i.plan_id, i.restaurant_id, i.inspector_id, COALESCE(i.template_id, v_tmpl_lotus),
           COALESCE(i.checkin_at::date, '2026-11-25'::date),
           row_number() OVER (PARTITION BY i.plan_id ORDER BY i.id),
           i.id, i.created_at
    FROM inspections i
    WHERE i.plan_id IS NOT NULL
    ON CONFLICT (plan_id, restaurant_id) DO UPDATE SET inspection_id = EXCLUDED.inspection_id;

    -- Bổ sung phân công cho Kế hoạch Tháng 12/2026 (đang chờ duyệt) và Dự thảo Quý 1/2027
    INSERT INTO inspection_plan_assignments (plan_id, restaurant_id, inspector_id, template_id, scheduled_date, sort_order)
    SELECT v_plan_12, ou.id,
           CASE WHEN row_number() OVER (ORDER BY ou.code) % 3 = 0 THEN v_ins1
                WHEN row_number() OVER (ORDER BY ou.code) % 3 = 1 THEN v_ins3
                ELSE v_ins4 END,
           v_tmpl_lotus,
           ('2026-12-03'::date + ((row_number() OVER (ORDER BY ou.code))::int % 20)),
           row_number() OVER (ORDER BY ou.code)
    FROM org_units ou
    WHERE ou.unit_type = 'RESTAURANT'
    LIMIT 18
    ON CONFLICT (plan_id, restaurant_id) DO NOTHING;

    -- 10. TỰ ĐỘNG SINH FINDINGS, FINDING_OCCURRENCES & FINDING_EVENTS CHO MỌI INSPECTION_ITEMS BỊ FAIL
    FOR v_item_rec IN
        SELECT ii.id AS item_id, ii.inspection_id, ii.criterion_id, ii.criterion_code, ii.criterion_name,
               ii.base_impact, i.restaurant_id, ou.code AS rest_code, ou.escalation_threshold,
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
        -- Đếm số lần vi phạm trước đó trong vòng 6 tháng của cùng nhà hàng & cùng tiêu chí
        SELECT COUNT(*) + 1 INTO v_occ_count
        FROM finding_occurrences fo
        WHERE fo.restaurant_id = v_item_rec.restaurant_id
          AND fo.criterion_id = v_item_rec.criterion_id
          AND fo.occurred_at >= (v_item_rec.found_at - INTERVAL '6 months');

        -- Tính effective_impact (nếu vượt ngưỡng threshold riêng của nhà hàng hoặc ngưỡng chung = 3 thì nâng bậc)
        IF v_occ_count >= COALESCE(v_item_rec.escalation_threshold, 3) THEN
            v_eff_impact := LEAST(5, v_item_rec.base_impact + 1 + (v_occ_count - COALESCE(v_item_rec.escalation_threshold, 3)));
        ELSE
            v_eff_impact := v_item_rec.base_impact;
        END IF;

        v_score := v_eff_impact * v_occ_count;

        IF v_score >= 12 THEN
            v_rl_code := 'M4'; v_rl_name := 'Nghiêm trọng'; v_rem_days := 1;
        ELSIF v_score >= 6 THEN
            v_rl_code := 'M3'; v_rl_name := 'Cao'; v_rem_days := 7;
        ELSIF v_score >= 3 THEN
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
            CASE
                WHEN v_item_rec.found_at < '2026-11-10'::timestamptz AND NOT (v_item_rec.insp_code = 'PER-2611-COCO-LM81' AND v_item_rec.criterion_code = 'TC-VS-04') AND NOT (v_item_rec.insp_code = 'PER-2611-CS-PST' AND v_item_rec.criterion_code = 'TC-VS-03') AND NOT (v_item_rec.insp_code = 'PER-2611-YSH-LTT' AND v_item_rec.criterion_code = 'TC-VC-05') THEN 'CLOSED'
                WHEN v_item_rec.insp_code = 'PER-2611-COCO-LM81' AND v_item_rec.criterion_code = 'TC-VS-04' THEN 'PENDING_VERIFICATION'
                WHEN v_item_rec.insp_code = 'PER-2611-CS-PST' AND v_item_rec.criterion_code = 'TC-VS-03' THEN 'REMEDIATING'
                WHEN v_item_rec.insp_code = 'PER-2611-YSH-LTT' AND v_item_rec.criterion_code = 'TC-VC-05' THEN 'APPEALED'
                WHEN v_item_rec.insp_code = 'PER-2611-TNK-LM81' AND v_item_rec.criterion_code = 'TC-DV-07' THEN 'APPEAL_MEETING'
                WHEN v_item_rec.insp_code = 'PER-2611-MK-HN01' AND v_item_rec.criterion_code = 'TC-TN-04' THEN 'CONFIRMED'
                WHEN v_item_rec.insp_code = 'SUR-2611-MK-AON' AND v_item_rec.criterion_code = 'TC-VC-01' THEN 'OPEN'
                ELSE 'CLOSED'
            END,
            'Phát hiện lỗi [' || v_item_rec.criterion_code || '] tại ' || v_item_rec.rest_code || ': ' || v_item_rec.criterion_name || ' (Vi phạm lần ' || v_occ_count || ' trong kỳ 6 tháng).',
            'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800',
            CASE WHEN v_item_rec.found_at < '2026-11-05'::timestamptz THEN 'Đã tiến hành bảo trì thiết bị, đào tạo lại nhân viên ca bếp và kiểm tra chéo đầu ca mỗi ngày.' ELSE NULL END,
            CASE WHEN v_item_rec.found_at < '2026-11-05'::timestamptz THEN 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800' ELSE NULL END,
            CASE WHEN v_item_rec.found_at < '2026-11-05'::timestamptz THEN v_item_rec.found_at + INTERVAL '3 days' ELSE NULL END,
            (v_item_rec.found_at::date + LEAST(v_rem_days, 5)),
            CASE WHEN v_item_rec.found_at < '2026-10-20'::timestamptz THEN 'KSVH đã kiểm tra thực tế và xác nhận cơ sở khắc phục đạt yêu cầu 100%.' ELSE NULL END,
            CASE WHEN v_item_rec.found_at < '2026-10-20'::timestamptz THEN v_item_rec.inspector_id ELSE NULL END,
            CASE WHEN v_item_rec.found_at < '2026-10-20'::timestamptz THEN v_item_rec.found_at + INTERVAL '5 days' ELSE NULL END,
            v_item_rec.found_at,
            COALESCE(v_item_rec.found_at + INTERVAL '5 days', now()),
            1
        )
        RETURNING id INTO v_finding_id;

        -- Cập nhật ngược finding_id vào inspection_items
        UPDATE inspection_items SET finding_id = v_finding_id WHERE id = v_item_rec.item_id;

        -- Ghi nhận vào bảng finding_occurrences để hệ thống tính Hồ sơ rủi ro cơ sở & Nâng mức tự động
        INSERT INTO finding_occurrences (restaurant_id, criterion_id, finding_id, source, occurred_at)
        VALUES (v_item_rec.restaurant_id, v_item_rec.criterion_id, v_finding_id, 'CONFIRMED', v_item_rec.found_at);

        -- Ghi nhận lịch sử sự kiện finding_events
        INSERT INTO finding_events (finding_id, action, from_status, to_status, actor_id, note, created_at)
        VALUES (v_finding_id, 'CREATED', NULL, 'OPEN', v_item_rec.inspector_id, 'Hệ thống tự động ghi nhận điểm không phù hợp khi nộp biên bản kiểm tra.', v_item_rec.found_at);

        IF v_item_rec.found_at < '2026-10-20'::timestamptz THEN
            INSERT INTO finding_events (finding_id, action, from_status, to_status, actor_id, note, created_at) VALUES
                (v_finding_id, 'CONFIRMED', 'OPEN', 'CONFIRMED', v_store, 'Cửa hàng trưởng xác nhận lỗi và cam kết khắc phục đúng hạn.', v_item_rec.found_at + INTERVAL '4 hours'),
                (v_finding_id, 'REMEDIATION_PLANNED', 'CONFIRMED', 'REMEDIATING', v_store, 'Đã lập phương án khắc phục và phân công nhân sự phụ trách.', v_item_rec.found_at + INTERVAL '1 day'),
                (v_finding_id, 'REMEDIATION_SUBMITTED', 'REMEDIATING', 'PENDING_VERIFICATION', v_store, 'Đã hoàn thành khắc phục và tải lên hình ảnh bằng chứng nghiệm thu.', v_item_rec.found_at + INTERVAL '3 days'),
                (v_finding_id, 'VERIFY_PASSED', 'PENDING_VERIFICATION', 'CLOSED', v_item_rec.inspector_id, 'Đã nghiệm thu đạt yêu cầu, đóng hồ sơ lỗi.', v_item_rec.found_at + INTERVAL '5 days');
        END IF;
    END LOOP;

    -- Bổ sung finding_occurrences cho 3 finding mẫu cũ (nếu chưa có)
    INSERT INTO finding_occurrences (restaurant_id, criterion_id, finding_id, source, occurred_at)
    SELECT f.restaurant_id, f.criterion_id, f.id, 'CONFIRMED', f.created_at
    FROM findings f
    WHERE NOT EXISTS (SELECT 1 FROM finding_occurrences fo WHERE fo.finding_id = f.id);

    -- Cập nhật thông tin khiếu nại (APPEALED & APPEAL_MEETING) và đánh giá khiếu nại (appeal_reviews)
    UPDATE findings
    SET status = 'CLOSED', verified_at = COALESCE(verified_at, created_at + INTERVAL '5 days')
    WHERE status = 'OPEN'
      AND id NOT IN (
          SELECT id FROM findings
          WHERE status = 'OPEN'
          ORDER BY calculated_score ASC, id DESC
          LIMIT 2
      );

    -- Chuẩn hoá điểm rủi ro của các lỗi đang mở (OPEN/CONFIRMED/REMEDIATING/APPEALED/PENDING_VERIFICATION) trong khoảng hợp lý (2..8 điểm)
    UPDATE findings
    SET calculated_score = LEAST(calculated_score, 8)
    WHERE status IN ('OPEN', 'CONFIRMED', 'APPEALED', 'REMEDIATING', 'PENDING_VERIFICATION')
      AND calculated_score >= 9;

    UPDATE findings
    SET appeal_reason = 'Thời điểm kiểm tra hệ thống van ngắt gas trung tâm của TTTM đang trong ca bảo trì định kỳ của Ban quản lý tòa nhà (có biên bản xác nhận của kỹ thuật tòa nhà đính kèm).',
        appeal_submitted_at = created_at + INTERVAL '6 hours'
    WHERE status IN ('APPEALED', 'APPEAL_MEETING');

    INSERT INTO appeal_reviews (finding_id, reviewer_id, is_ksvh_rep, verdict, comment, reviewed_at, appeal_round)
    SELECT f.id, v_ins1, true, 'FINDING_VALID', 'Tại thời điểm kiểm tra, cửa hàng không xuất trình được thông báo bảo trì của tòa nhà và không treo biển cảnh báo tại van gas.', f.created_at + INTERVAL '1 day', 1
    FROM findings f WHERE f.status IN ('APPEALED', 'APPEAL_MEETING')
    ON CONFLICT DO NOTHING;

    INSERT INTO appeal_reviews (finding_id, reviewer_id, is_ksvh_rep, verdict, comment, reviewed_at, appeal_round)
    SELECT f.id, v_obm2, false, 'FINDING_INVALID', 'Cửa hàng đã bổ sung biên bản xác nhận của Ban quản lý tòa nhà, đề xuất xem xét giảm nhẹ hoặc hủy lỗi.', f.created_at + INTERVAL '1 day 2 hours', 1
    FROM findings f WHERE f.status = 'APPEAL_MEETING'
    ON CONFLICT DO NOTHING;
END $$;

-- 11. BỔ SUNG THÔNG BÁO HỆ THỐNG (NOTIFICATIONS) PHONG PHÚ
INSERT INTO notifications (user_id, type, title, body, link, read_at, created_at)
SELECT u.id, v.ntype, v.title, v.body, v.link, v.read_at, v.created_at
FROM (VALUES
    ('admin',     'PLAN_SUBMITTED',       'Kế hoạch Tháng 12/2026 chờ phê duyệt',          'Trưởng nhóm Lê Quốc Tuấn vừa trình duyệt Kế hoạch kiểm soát cao điểm Lễ Giáng Sinh & Tết Dương Lịch Tháng 12/2026 (KH-202612-001).', '/plans', NULL::timestamptz, now() - INTERVAL '25 minutes'),
    ('admin',     'APPEAL_MEETING',       'Yêu cầu chủ trì họp thống nhất khiếu nại',      'Điểm không phù hợp tại Tenku Modern Kaiseki Landmark 81 có ý kiến trái chiều giữa KSVH và OBM, cần Trưởng phòng KSVH chủ trì họp kết luận.', '/findings', NULL, now() - INTERVAL '2 hours'),
    ('admin',     'FINDING_ESCALATED',    'Cảnh báo nâng mức rủi ro tự động (M3 -> M4)',   'Tiêu chí TC-VS-04 (Chỉ số dầu chiên TPM) tại CoCo Ichibanya Landmark 81 tái phạm lần thứ 4 trong kỳ 6 tháng, hệ thống đã nâng mức ảnh hưởng lên Mức 4.', '/risk-profiles', NULL, now() - INTERVAL '4 hours'),
    ('admin',     'REMEDIATION_SUBMITTED','Báo cáo hoàn tất khắc phục chờ nghiệm thu',     'Cửa hàng trưởng CoCo Ichibanya Landmark 81 đã gửi bằng chứng khắc phục cho lỗi TC-VS-04. Vui lòng phân công chuyên viên xác minh.', '/findings', NULL, now() - INTERVAL '6 hours'),
    ('admin',     'INSPECTION_SUBMITTED', 'Biên bản kiểm tra đột xuất đã hoàn tất',        'Chuyên viên Võ Thành Đạt đã nộp biên bản kiểm tra đột xuất SUR-2611-MK-AON tại Marukame Udon Aeon Bình Tân.', '/inspections', now() - INTERVAL '1 day', now() - INTERVAL '2 days'),
    ('admin',     'PLAN_APPROVED',        'Kế hoạch KH-202611-002 đã được phê duyệt',      'Trưởng phòng Phạm Hồng Sơn đã phê duyệt Kế hoạch kiểm tra chuyên đề Fine Dining & Chuỗi Miền Bắc Tháng 11/2026.', '/plans', now() - INTERVAL '5 days', now() - INTERVAL '7 days'),
    ('manager',   'PLAN_SUBMITTED',       'Kế hoạch KH-202612-001 chờ phê duyệt',          'Kế hoạch kiểm soát cao điểm Tháng 12/2026 với 18 cơ sở đã được trình duyệt.', '/plans', NULL, now() - INTERVAL '30 minutes'),
    ('manager',   'APPEAL_SUBMITTED',     'Khiếu nại mới từ Yoshinoya Lý Tự Trọng',        'Cửa hàng trưởng Mai Xuân Trường vừa gửi yêu cầu khiếu nại đối với lỗi hệ thống van gas trung tâm (TC-VC-05).', '/findings', NULL, now() - INTERVAL '3 hours'),
    ('inspector', 'PLAN_ASSIGNED',        'Phân công lịch kiểm tra mới tại Crescent Mall', 'Bạn được phân công thực hiện kiểm tra định kỳ PER-2611-MK-CRM tại Marukame Udon Crescent Mall.', '/m/home', NULL, now() - INTERVAL '1 hour'),
    ('inspector', 'REMEDIATION_SUBMITTED','Yêu cầu nghiệm thu khắc phục tại CoCo LM81',    'Cửa hàng đã gửi hình ảnh và báo cáo khắc phục lỗi dầu chiên TPM, chờ bạn nghiệm thu.', '/findings', NULL, now() - INTERVAL '5 hours'),
    ('store',     'INSPECTION_AWAITING',  'Biên bản kiểm tra chờ Cửa hàng trưởng ký nhận', 'Biên bản kiểm tra PER-2611-MK-BT-HIST tại Marukame Udon Bến Thành đã hoàn tất chấm điểm, vui lòng kiểm tra và xác nhận.', '/inspections', NULL, now() - INTERVAL '2 hours'),
    ('store',     'FINDING_DEADLINE',     'Nhắc hạn khắc phục điểm không phù hợp (còn 3 ngày)', 'Lỗi nhiệt độ tủ đông TC-VS-02 tại Marukame Udon Bến Thành sắp đến hạn khắc phục.', '/findings', NULL, now() - INTERVAL '12 hours'),
    ('obm',       'FINDING_ESCALATED',    'Cảnh báo cơ sở có tiêu chí tái phạm nhiều lần', 'Cơ sở Marukame Udon Bến Thành thuộc phạm vi phụ trách của bạn có tiêu chí TC-VS-02 tái phạm lần 4 trong kỳ 6 tháng.', '/risk-profiles', NULL, now() - INTERVAL '4 hours')
) AS v(uname, ntype, title, body, link, read_at, created_at)
JOIN users u ON u.username = v.uname;

-- 12. BỔ SUNG NHẬT KÝ HỆ THỐNG (AUDIT LOGS) ĐẦY ĐỦ CHO TRANG TRA CỨU NHẬT KÝ
INSERT INTO audit_logs (created_at, user_id, username, user_full_name, action, target_type, target_id, summary, ip_address, details)
SELECT v.created_at, u.id, u.username, u.full_name, v.action, v.target_type, v.target_id, v.summary, v.ip, v.details
FROM (VALUES
    (now() - INTERVAL '15 minutes', 'admin',     'LOGIN',               'AUTH',       'admin',          'Đăng nhập hệ thống quản trị KSVH QC thành công', '10.10.24.101', '{"userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Chrome/130.0","method":"PASSWORD"}'),
    (now() - INTERVAL '35 minutes', 'lead',      'CREATE_PLAN',         'PLAN',       'KH-202612-001',  'Tạo mới và gửi duyệt Kế hoạch kiểm soát cao điểm Tháng 12/2026 (18 nhà hàng)', '10.10.24.115', '{"planCode":"KH-202612-001","assignmentsCount":18,"status":"PENDING_APPROVAL"}'),
    (now() - INTERVAL '1 hour',     'bizadmin',  'UPDATE_RISK_CONFIG',  'RISK_LEVEL', '2026-11-20',     'Cập nhật bảng phân loại thang điểm rủi ro M1–M4 áp dụng từ 20/11/2026', '10.10.24.108', '{"effectiveFrom":"2026-11-20","levels":["M1: 0-3","M2: 3-6","M3: 6-12","M4: >=12"]}'),
    (now() - INTERVAL '2 hours',    'bizadmin',  'CREATE_TEMPLATE',     'TEMPLATE',   'TMPL-FINE-DINING','Tạo mẫu phiếu kiểm soát Tiêu chuẩn Fine Dining Kaiseki & Aging Beef (70 tiêu chí)', '10.10.24.108', '{"templateCode":"TMPL-FINE-DINING","criteriaCount":70,"company":"LOTUS-FINE"}'),
    (now() - INTERVAL '3 hours',    'store_ysh', 'APPEAL_FINDING',      'FINDING',    'PER-2611-YSH-LTT','Gửi yêu cầu khiếu nại điểm không phù hợp TC-VC-05 tại Yoshinoya Lý Tự Trọng', '113.161.72.45', '{"criterionCode":"TC-VC-05","restaurant":"YSH-LTT","reason":"Bảo trì định kỳ tòa nhà"}'),
    (now() - INTERVAL '5 hours',    'store_coco','SUBMIT_REMEDIATION',  'FINDING',    'PER-2611-COCO-LM81','Nộp kế hoạch và hình ảnh bằng chứng khắc phục lỗi dầu chiên TC-VS-04 tại CoCo Landmark 81', '113.161.88.19', '{"criterionCode":"TC-VS-04","evidenceCount":3,"status":"PENDING_VERIFICATION"}'),
    (now() - INTERVAL '1 day',      'inspector4','VERIFY_FINDING',      'INSPECTION', 'VER-2611-USS-LM81','Hoàn tất biên bản hậu kiểm VER-2611-USS-LM81 tại Ussina Landmark 81 (Đạt yêu cầu)', '14.169.32.110', '{"inspectionCode":"VER-2611-USS-LM81","result":"PASS","closedFindings":1}'),
    (now() - INTERVAL '2 days',     'inspector', 'SUBMIT_INSPECTION',   'INSPECTION', 'SUR-2611-MK-AON','Nộp biên bản kiểm tra đột xuất SUR-2611-MK-AON tại Marukame Udon Aeon Bình Tân', '14.169.45.212', '{"inspectionCode":"SUR-2611-MK-AON","passCount":31,"failCount":2}'),
    (now() - INTERVAL '3 days',     'admin',     'UPDATE_ORG_UNIT',     'ORG_UNIT',   'USS-LM81',       'Thiết lập ngưỡng nâng mức rủi ro riêng (2 lần tái phạm) cho nhà hàng Fine Dining Ussina Landmark 81', '10.10.24.101', '{"code":"USS-LM81","escalationThreshold":2,"escalationResetMonths":9}'),
    (now() - INTERVAL '4 days',     'inspector2','COMPLETE_INSPECTION', 'INSPECTION', 'PER-2611-MK-HN01','Hoàn tất và đóng biên bản kiểm tra định kỳ PER-2611-MK-HN01 tại Marukame Udon Metropolis Hà Nội', '27.72.101.55', '{"inspectionCode":"PER-2611-MK-HN01","score":6,"status":"COMPLETED"}'),
    (now() - INTERVAL '5 days',     'inspector5','COMPLETE_INSPECTION', 'INSPECTION', 'PER-2611-TNK-LM81','Hoàn tất biên bản kiểm tra tiêu chuẩn Kaiseki tại Tenku Sky Bar Landmark 81', '14.169.32.88', '{"inspectionCode":"PER-2611-TNK-LM81","status":"COMPLETED"}'),
    (now() - INTERVAL '7 days',     'manager',   'APPROVE_PLAN',        'PLAN',       'KH-202611-002',  'Phê duyệt Kế hoạch kiểm tra chuyên đề Fine Dining & Chuỗi Miền Bắc Tháng 11/2026', '10.10.24.105', '{"planCode":"KH-202611-002","approvedBy":"manager"}'),
    (now() - INTERVAL '10 days',    'admin',     'CREATE_EMPLOYEE',     'EMPLOYEE',   'NV020',          'Tạo hồ sơ nhân sự Tổng Quản lý Đinh Tiến Đạt (Ussina & Tenku Landmark 81)', '10.10.24.101', '{"employeeCode":"NV020","orgUnit":"USS-LM81"}'),
    (now() - INTERVAL '12 days',    'admin',     'UPDATE_ROLE',         'ROLE',       'KSVH_INSPECTOR', 'Rà soát và đồng bộ danh mục phân quyền chức năng cho vai trò Chuyên viên KSVH', '10.10.24.101', '{"roleCode":"KSVH_INSPECTOR","permissionsCount":7}')
) AS v(created_at, uname, action, target_type, target_id, summary, ip, details)
JOIN users u ON u.username = v.uname;
