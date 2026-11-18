-- ====================================================================
-- DỮ LIỆU MẪU CHO MÁY DEV (PostgreSQL) – KHÔNG phải migration, Flyway không chạy file này.
-- DataInitializer chỉ nạp khi: profile dev + app.seed.sample-data=true + bảng companies còn trống.
-- Tham chiếu nhau bằng mã (code) / username, không ghi id cố định.
-- KHÔNG nạp cấu hình rủi ro (mức M1–M4, tần suất, nâng mức): những thứ đó do Flyway nạp theo DOMAIN_SPEC.
-- Phiếu chấm / lỗi KHÔNG seed ở đây: tạo qua luồng thật để trạng thái và lịch sử luôn đúng.
-- Tiêu chí dưới đây là VÍ DỤ để thử giao diện, không phải bộ tiêu chí chính thức của Phòng KSVH.
-- ====================================================================

-- 1. Công ty
INSERT INTO companies (code, name) VALUES
    ('LOTUS',  'CÔNG TY CP TẬP ĐOÀN LOTUS (V-Lotus Holdings F&B)')
ON CONFLICT DO NOTHING;

-- 2. Nhà hàng & phòng ban (CHT = tài khoản store, OBM = tài khoản obm)
INSERT INTO org_units (company_id, unit_type, code, name, address, latitude, longitude, checkin_radius_m, store_manager_user_id, obm_user_id)
SELECT c.id, v.unit_type, v.code, v.name, v.address, v.lat, v.lng, v.radius,
       CASE WHEN v.unit_type = 'RESTAURANT' THEN (SELECT id FROM users WHERE username = 'store') END,
       CASE WHEN v.unit_type = 'RESTAURANT' THEN (SELECT id FROM users WHERE username = 'obm') END
FROM (VALUES
    ('LOTUS', 'DEPARTMENT', 'LOTUS-HQ', 'Trụ sở Tập đoàn V-Lotus Holdings', 'Tầng 15, Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM', NULL, NULL, NULL),
    ('LOTUS', 'DEPARTMENT', 'LOTUS-QC', 'Phòng Đảm bảo Chất lượng & KSVH V-Lotus', 'Tầng 15, Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM', NULL, NULL, NULL),
    ('LOTUS', 'RESTAURANT', 'MK-BT',    'Marukame Udon Bến Thành', '215-217 Lý Tự Trọng, Bến Thành, Quận 1, TP.HCM', 10.7725, 106.6961, 100),
    ('LOTUS', 'RESTAURANT', 'COCO-LM81', 'CoCo Ichibanya Landmark 81', 'Tầng B1, Vincom Landmark 81, 720A Điện Biên Phủ, Bình Thạnh, TP.HCM', 10.7951, 106.7218, 100)
) AS v(company_code, unit_type, code, name, address, lat, lng, radius)
JOIN companies c ON lower(c.code) = lower(v.company_code)
ON CONFLICT DO NOTHING;

-- 3. Nhân viên, liên kết với tài khoản dev cùng vai trò
INSERT INTO employees (employee_code, full_name, email, phone, job_title, org_unit_id, user_id)
SELECT v.code, v.full_name, v.email, v.phone, v.job_title, ou.id, u.id
FROM (VALUES
    ('NV001', 'Quản trị hệ thống Demo', 'admin@ksvh.vn', '0901234567', 'Chuyên viên Quản trị Hệ thống', 'LOTUS-QC', 'admin'),
    ('NV002', 'Quản trị nghiệp vụ Demo', 'bizadmin@ksvh.vn', '0902345678', 'Chuyên viên Quản lý Tiêu chuẩn F&B', 'LOTUS-QC', 'bizadmin'),
    ('NV003', 'Trưởng nhóm KSVH Demo', 'lead@ksvh.vn', '0903456789', 'Trưởng nhóm Kiểm Soát Vận Hành', 'LOTUS-QC', 'lead'),
    ('NV004', 'Quản lý KSVH Demo', 'manager@ksvh.vn', '0904567890', 'Trưởng phòng KSVH & Đảm bảo Chất lượng', 'LOTUS-QC', 'manager'),
    ('NV005', 'Chuyên viên KSVH Demo', 'inspector@ksvh.vn', '0905678901', 'Thanh tra viên KSVH', 'LOTUS-QC', 'inspector'),
    ('NV006', 'Cửa hàng trưởng Demo', 'store@ksvh.vn', '0906789012', 'Cửa hàng trưởng Nhà hàng', 'MK-BT', 'store'),
    ('NV007', 'OBM Vận hành Demo', 'obm@ksvh.vn', '0907890123', 'Giám sát Vận hành Vùng (OBM)', 'LOTUS-QC', 'obm')
) AS v(code, full_name, email, phone, job_title, unit_code, username)
LEFT JOIN org_units ou ON lower(ou.code) = lower(v.unit_code)
LEFT JOIN users u ON u.username = v.username
ON CONFLICT DO NOTHING;

-- 4. Nhóm tiêu chí (dùng chung toàn hệ thống)
INSERT INTO criterion_groups (code, name, sort_order) VALUES
    ('GRP-VSATTP', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1),
    ('GRP-CSVC', 'Cơ sở vật chất & An toàn lao động', 2),
    ('GRP-QUYTRINH', 'Quy trình phục vụ & Tác phong nhân viên', 3)
ON CONFLICT DO NOTHING;

-- 5. Tiêu chí ví dụ (mức ảnh hưởng gốc theo thang 1–5)
INSERT INTO criteria (group_id, code, name, base_impact, check_method, evidence_required, sort_order)
SELECT g.id, v.code, v.name, v.impact, v.check_method, v.evidence, v.sort_order
FROM (VALUES
    ('GRP-VSATTP', 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 3, 'Quan sát tủ trữ đông và bàn sơ chế thực phẩm', 'Chụp ảnh tủ bảo quản và nhãn thực phẩm', 1),
    ('GRP-VSATTP', 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 3, 'Dùng nhiệt kế kiểm chuẩn đo nhiệt độ trung tâm tủ', 'Chụp ảnh màn hình nhiệt kế', 2),
    ('GRP-VSATTP', 'TC-VS-03', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 2, 'Dùng máy đo chất lượng dầu', 'Chụp ảnh màn hình máy đo hiển thị chỉ số', 3),
    ('GRP-VSATTP', 'TC-VS-04', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm', 1, 'Kiểm tra khu sơ chế hải sản, thịt gia cầm, rau củ', 'Chụp ảnh giá để dao thớt', 4),
    ('GRP-CSVC', 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 2, 'Kiểm tra lưu lượng hút tại chụp hút và quạt tổng', 'Chụp ảnh chụp hút và khu chế biến', 1),
    ('GRP-CSVC', 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 2, 'Kiểm tra vị trí đèn diệt côn trùng và nhật ký thay bẫy', 'Chụp ảnh đèn và phiếu kiểm tra', 2),
    ('GRP-CSVC', 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất ở vạch xanh', 3, 'Quan sát tem kiểm định và áp kế bình PCCC', 'Chụp ảnh tem kiểm định và đồng hồ áp', 3),
    ('GRP-QUYTRINH', 'TC-QT-01', 'Nhân viên đeo khẩu trang, găng tay và mũ bảo hộ đúng quy cách', 2, 'Quan sát trực tiếp nhân viên bếp và ra đồ', 'Chụp ảnh nhân viên tại khu bếp', 1),
    ('GRP-QUYTRINH', 'TC-QT-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đủ ca', 1, 'Kiểm tra sổ theo dõi tại quầy sơ chế', 'Chụp ảnh 2 trang sổ gần nhất', 2)
) AS v(group_code, code, name, impact, check_method, evidence, sort_order)
JOIN criterion_groups g ON lower(g.code) = lower(v.group_code)
ON CONFLICT DO NOTHING;
