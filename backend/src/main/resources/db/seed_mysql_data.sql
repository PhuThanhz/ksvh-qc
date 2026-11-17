-- ====================================================================
-- SEED DATA CHUẨN DOANH NGHIỆP CHO HỆ THỐNG KSVH QC (MYSQL 8.4)
-- 100% Dữ liệu thực, đa dạng chuỗi nhà hàng, tiêu chí, phiếu chấm, lỗi & lịch sử
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Companies (Tập đoàn F&B)
INSERT INTO companies (id, code, name, active, created_at, updated_at) VALUES
(1, 'GGG', 'CÔNG TY CP THƯƠNG MẠI DỊCH VỤ CỔNG VÀNG (Golden Gate Group)', 1, NOW(), NOW()),
(2, 'REDSUN', 'CÔNG TY CP ĐẦU TƯ THƯƠNG MẠI QUỐC TẾ MẶT TRỜI ĐỎ (Redsun ITI)', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Org Units (Nhà hàng & Phòng ban KSVH)
INSERT INTO org_units (id, company_id, unit_type, code, name, address, latitude, longitude, checkin_radius_m, store_manager_user_id, obm_user_id, active, created_at, updated_at) VALUES
(1, 1, 'RESTAURANT', 'KICHI-01', 'Kichi-Kichi Vincom Đồng Khởi', 'Tầng B3-01, Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM', 10.7774, 106.7022, 100, 6, 7, 1, NOW(), NOW()),
(2, 1, 'RESTAURANT', 'GOGI-01', 'Gogi House Nguyễn Thị Thập', '521 Nguyễn Thị Thập, Tân Phong, Quận 7, TP.HCM', 10.7381, 106.7115, 100, 6, 7, 1, NOW(), NOW()),
(3, 2, 'RESTAURANT', 'KBBQ-01', 'King BBQ Diamond Plaza', 'Tầng 4, Diamond Plaza, 34 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM', 10.7801, 106.6994, 100, 6, 7, 1, NOW(), NOW()),
(4, 2, 'RESTAURANT', 'HPS-01', 'Hotpot Story Saigon Centre', 'Tầng 5, Saigon Centre, 65 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', 10.7738, 106.7011, 100, 6, 7, 1, NOW(), NOW()),
(5, 1, 'RESTAURANT', 'MANWAH-01', 'Manwah Taiwanese Hotpot Aeon Mall Tân Phú', 'Tầng 1, Aeon Mall, 30 Bờ Bao Tân Thắng, Sơn Kỳ, Tân Phú, TP.HCM', 10.8009, 106.6156, 120, 6, 7, 1, NOW(), NOW()),
(6, 1, 'RESTAURANT', 'ISUSHI-01', 'iSushi Buffet Nhật Bản Landmark 81', 'Tầng B1, Vinhomes Central Park, 720A Điện Biên Phủ, Bình Thạnh, TP.HCM', 10.7951, 106.7218, 100, 6, 7, 1, NOW(), NOW()),
(7, 1, 'DEPARTMENT', 'PK-SVH', 'Phòng Kiểm Soát Vận Hành', 'Trụ sở Golden Gate Tower, 60 Giang Văn Minh, Ba Đình, Hà Nội', NULL, NULL, NULL, NULL, NULL, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. Employees (Nhân viên vận hành & KSVH)
INSERT INTO employees (id, employee_code, full_name, email, phone, job_title, org_unit_id, user_id, active, created_at, updated_at) VALUES
(1, 'NV001', 'Quản trị hệ thống Demo', 'admin@ksvh.vn', '0901234567', 'Chuyên viên Quản trị Hệ thống', 7, 1, 1, NOW(), NOW()),
(2, 'NV002', 'Quản trị nghiệp vụ Demo', 'bizadmin@ksvh.vn', '0902345678', 'Chuyên viên Quản lý Tiêu chuẩn F&B', 7, 2, 1, NOW(), NOW()),
(3, 'NV003', 'Trưởng nhóm KSVH Demo', 'lead@ksvh.vn', '0903456789', 'Trưởng nhóm Kiểm Soát Vận Hành', 7, 3, 1, NOW(), NOW()),
(4, 'NV004', 'Quản lý KSVH Demo', 'manager@ksvh.vn', '0904567890', 'Trưởng phòng KSVH & Đảm bảo Chất lượng', 7, 4, 1, NOW(), NOW()),
(5, 'NV005', 'Chuyên viên KSVH Demo', 'inspector@ksvh.vn', '0905678901', 'Thanh tra viên KSVH cấp cao', 7, 5, 1, NOW(), NOW()),
(6, 'NV006', 'Cửa hàng trưởng Demo', 'store@ksvh.vn', '0906789012', 'Cửa hàng trưởng Nhà hàng', 3, 6, 1, NOW(), NOW()),
(7, 'NV007', 'OBM Vận hành Demo', 'obm@ksvh.vn', '0907890123', 'Giám sát Vận hành Vùng (OBM)', 7, 7, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 4. Risk Levels (Mức độ rủi ro M1 - M4)
INSERT INTO risk_levels (id, code, name, min_score, max_score, remediation_days, action, effective_from, sort_order, created_at, updated_at) VALUES
(1, 'M1', 'Nhẹ', 1.00, 3.00, 7, 'Nhắc nhở và lập kế hoạch khắc phục trong 7 ngày', '2026-01-01', 1, NOW(), NOW()),
(2, 'M2', 'Trung bình', 4.00, 6.00, 5, 'Lập biên bản vi phạm, khắc phục và kiểm tra lại sau 5 ngày', '2026-01-01', 2, NOW(), NOW()),
(3, 'M3', 'Trung bình cao', 7.00, 9.00, 3, 'Báo cáo OBM, tiến hành khắc phục khẩn cấp trong 3 ngày', '2026-01-01', 3, NOW(), NOW()),
(4, 'M4', 'Nghiêm trọng', 10.00, 999.00, 1, 'Tạm ngưng phục vụ khu vực vi phạm, xử lý ngay trong 24h', '2026-01-01', 4, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 5. Criterion Groups (Nhóm tiêu chí)
INSERT INTO criterion_groups (id, code, name, company_id, sort_order, active, created_at, updated_at) VALUES
(1, 'GRP-VSATTP', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1, 1, 1, NOW(), NOW()),
(2, 'GRP-CSVC', 'Cơ sở vật chất & An toàn lao động', 1, 2, 1, NOW(), NOW()),
(3, 'GRP-QUYTRINH', 'Quy trình phục vụ & Tác phong nhân viên', 1, 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 6. Criteria (Tiêu chuẩn đánh giá)
INSERT INTO criteria (id, group_id, code, name, base_impact, check_method, evidence_required, sort_order, active, created_at, updated_at) VALUES
(1, 1, 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 3, 'Quan sát tủ trữ đông và bàn sơ chế thực phẩm', 'Chụp ảnh tủ bảo quản và nhãn thực phẩm', 1, 1, NOW(), NOW()),
(2, 1, 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 3, 'Sử dụng nhiệt kế kiểm chuẩn đo nhiệt độ trung tâm tủ', 'Chụp ảnh màn hình hiển thị nhiệt kế', 2, 1, NOW(), NOW()),
(3, 1, 'TC-VS-03', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 2, 'Sử dụng máy đo chất lượng dầu Testo 270', 'Chụp ảnh màn hình máy đo testo hiển thị chỉ số', 3, 1, NOW(), NOW()),
(4, 1, 'TC-VS-04', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm', 1, 'Kiểm tra khu sơ chế hải sản, thịt gia cầm, rau củ', 'Chụp ảnh giá để dao thớt', 4, 1, NOW(), NOW()),
(5, 2, 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 2, 'Kiểm tra lưu lượng hút tại chụp hút và quạt tổng', 'Chụp ảnh chụp hút và khu vực chế biến', 1, 1, NOW(), NOW()),
(6, 2, 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 2, 'Kiểm tra vị trí đèn diệt côn trùng và nhật ký thay bẫy', 'Chụp ảnh đèn và phiếu kiểm tra', 2, 1, NOW(), NOW()),
(7, 2, 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất kim chỉ vạch xanh', 3, 'Quan sát tem kiểm định và áp kế bình PCCC', 'Chụp ảnh tem kiểm định và đồng hồ đo áp', 3, 1, NOW(), NOW()),
(8, 3, 'TC-QT-01', 'Nhân viên đeo khẩu trang, găng tay và đội mũ bảo hộ đúng quy cách', 2, 'Quan sát trực tiếp nhân viên bếp và ra đồ', 'Chụp ảnh nhân viên đang làm việc tại khu bếp', 1, 1, NOW(), NOW()),
(9, 3, 'TC-QT-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đầy đủ ca', 1, 'Kiểm tra sổ theo dõi tại quầy sơ chế', 'Chụp ảnh 2 trang sổ gần nhất', 2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 7. Inspection Template
INSERT INTO inspection_templates (id, company_id, code, name, inspection_type, description, active, created_at, updated_at) VALUES
(1, 1, 'TMPL-VSATTP', 'Mẫu kiểm tra Tiêu chuẩn VSATTP Toàn diện', 'PERIODIC', 'Phiếu chấm định kỳ áp dụng cho toàn bộ chuỗi nhà hàng ẩm thực', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 8. Template Criteria
DELETE FROM template_criteria WHERE template_id = 1;
INSERT INTO template_criteria (template_id, criterion_id, sort_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4),
(1, 5, 5), (1, 6, 6), (1, 7, 7),
(1, 8, 8), (1, 9, 9);

-- 9. Inspection Plans (Kế hoạch định kỳ & đột xuất)
INSERT INTO inspection_plans (id, plan_code, title, start_date, end_date, status, created_by, approved_by, approved_at, notes, created_at, updated_at) VALUES
(1, 'KH-2026-Q4', 'Kế hoạch kiểm tra định kỳ Quý 4/2026', '2026-10-01', '2026-12-31', 'APPROVED', 3, 4, NOW(), 'Kiểm tra toàn bộ chuỗi nhà hàng trọng điểm khu vực miền Nam', NOW(), NOW()),
(2, 'KH-2026-T11-DX', 'Kế hoạch kiểm tra đột xuất Tháng 11/2026', '2026-11-01', '2026-11-30', 'APPROVED', 3, 4, NOW(), 'Tập trung kiểm tra nguồn nguyên liệu và dầu chiên', NOW(), NOW()),
(3, 'KH-2026-Q3', 'Kế hoạch kiểm tra định kỳ Quý 3/2026', '2026-07-01', '2026-09-30', 'APPROVED', 3, 4, '2026-07-01 08:00:00', 'Đã hoàn thành đánh giá Q3 chuỗi nhà hàng', '2026-07-01 08:00:00', '2026-07-01 08:00:00')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 10. Inspections (12 đợt kiểm tra trải dài qua các tháng 6, 7, 8, 9, 10, 11/2026)
DELETE FROM inspection_items;
DELETE FROM findings;
DELETE FROM inspections;

INSERT INTO inspections (id, code, plan_id, restaurant_id, template_id, inspector_id, inspection_type, inspection_mode, status, location_status, checkin_lat, checkin_lng, checkin_distance_m, checkin_at, submitted_at, completed_at, version, notes, created_by, created_at, updated_at) VALUES
-- Tháng 11/2026 (Tháng hiện tại - 6 phiếu: 4 hoàn thành, 1 đang chấm, 1 được giao)
(1, 'KT-2026-KBBQ01', 1, 3, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7801, 106.6994, 18.5, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY, 1, 'Đã hoàn thành kiểm tra thực tế tại King BBQ Diamond Plaza', 3, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
(2, 'KT-2026-KICHI01', 1, 1, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7774, 106.7022, 12.0, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY, 1, 'Kiểm tra đạt chuẩn quy trình tại Kichi-Kichi Đồng Khởi', 3, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
(3, 'KT-2026-GOGI01', 1, 2, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7381, 106.7115, 24.3, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY, 1, 'Hoàn thành kiểm tra tiêu chuẩn VSATTP Gogi House', 3, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(4, 'KT-2026-HPS01', 2, 4, 1, 5, 'SURPRISE', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7738, 106.7011, 15.2, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 1, 'Kiểm tra đột xuất an toàn PCCC Hotpot Story', 3, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(5, 'KT-2026-MANWAH01', 1, 5, 1, 5, 'PERIODIC', 'ON_SITE', 'IN_PROGRESS', 'VERIFIED', 10.8009, 106.6156, 32.1, NOW() - INTERVAL 4 HOUR, NULL, NULL, 1, 'Đang tiến hành chấm thực tế tại Manwah Tân Phú', 3, NOW() - INTERVAL 4 HOUR, NOW()),
(6, 'KT-2026-ISUSHI01', 1, 6, 1, 5, 'PERIODIC', 'ON_SITE', 'ASSIGNED', 'UNVERIFIED', NULL, NULL, NULL, NULL, NULL, NULL, 1, 'Phân công kiểm tra định kỳ trong tuần', 3, NOW(), NOW()),

-- Tháng 10/2026 (3 phiếu hoàn thành)
(7, 'KT-2026-KBBQ-10', 1, 3, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7801, 106.6994, 14.2, '2026-10-15 09:30:00', '2026-10-15 11:45:00', '2026-10-15 11:45:00', 1, 'Đánh giá định kỳ tháng 10 cơ sở King BBQ', 3, '2026-10-15 09:00:00', '2026-10-15 11:45:00'),
(8, 'KT-2026-KICHI-10', 1, 1, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7774, 106.7022, 19.8, '2026-10-22 14:00:00', '2026-10-22 16:30:00', '2026-10-22 16:30:00', 1, 'Kiểm tra định kỳ tháng 10 Kichi-Kichi', 3, '2026-10-22 13:30:00', '2026-10-22 16:30:00'),
(9, 'KT-2026-GOGI-10', 1, 2, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7381, 106.7115, 21.0, '2026-10-28 10:15:00', '2026-10-28 12:00:00', '2026-10-28 12:00:00', 1, 'Đạt tiêu chuẩn 9/9 tiêu chí Gogi House', 3, '2026-10-28 10:00:00', '2026-10-28 12:00:00'),

-- Tháng 09/2026 (2 phiếu hoàn thành)
(10, 'KT-2026-HPS-09', 3, 4, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7738, 106.7011, 16.5, '2026-09-18 09:30:00', '2026-09-18 11:30:00', '2026-09-18 11:30:00', 1, 'Đánh giá vận hành tháng 9 Hotpot Story', 3, '2026-09-18 09:00:00', '2026-09-18 11:30:00'),
(11, 'KT-2026-KBBQ-09', 3, 3, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7801, 106.6994, 25.1, '2026-09-25 14:00:00', '2026-09-25 16:00:00', '2026-09-25 16:00:00', 1, 'Kiểm tra định kỳ tháng 9 King BBQ', 3, '2026-09-25 13:30:00', '2026-09-25 16:00:00'),

-- Tháng 08/2026 (2 phiếu hoàn thành)
(12, 'KT-2026-KICHI-08', 3, 1, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7774, 106.7022, 11.2, '2026-08-16 10:00:00', '2026-08-16 12:15:00', '2026-08-16 12:15:00', 1, 'Đánh giá định kỳ tháng 8 Kichi-Kichi', 3, '2026-08-16 09:30:00', '2026-08-16 12:15:00'),
(13, 'KT-2026-GOGI-08', 3, 2, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.7381, 106.7115, 18.0, '2026-08-27 15:00:00', '2026-08-27 17:10:00', '2026-08-27 17:10:00', 1, 'Đánh giá định kỳ tháng 8 Gogi House', 3, '2026-08-27 14:30:00', '2026-08-27 17:10:00'),

-- Tháng 07/2026 (1 phiếu hoàn thành)
(14, 'KT-2026-MANWAH-07', 3, 5, 1, 5, 'PERIODIC', 'ON_SITE', 'COMPLETED', 'VERIFIED', 10.8009, 106.6156, 22.0, '2026-07-20 10:30:00', '2026-07-20 12:30:00', '2026-07-20 12:30:00', 1, 'Đánh giá định kỳ tháng 7 Manwah Tân Phú', 3, '2026-07-20 10:00:00', '2026-07-20 12:30:00');

-- 11. Inspection Items (Chi tiết các tiêu chí được chấm)
DELETE FROM inspection_items;
INSERT INTO inspection_items (id, inspection_id, criterion_id, criterion_code, criterion_name, group_name, base_impact, result, sort_order, evaluated_at, comment) VALUES
-- Inspection 1: King BBQ (7 PASS, 2 FAIL -> 73.68%)
(1, 1, 1, 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 1, NOW() - INTERVAL 5 DAY, 'Đạt chuẩn, nhãn date đầy đủ'),
(2, 1, 2, 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'FAIL', 2, NOW() - INTERVAL 5 DAY, 'Tủ đông số 2 đo được -14°C, vượt ngưỡng cho phép'),
(3, 1, 3, 'TC-VS-03', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 2, 'PASS', 3, NOW() - INTERVAL 5 DAY, 'TPM = 18.5%, đạt chuẩn'),
(4, 1, 4, 'TC-VS-04', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1, 'PASS', 4, NOW() - INTERVAL 5 DAY, 'Phân màu rõ ràng'),
(5, 1, 5, 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 5, NOW() - INTERVAL 5 DAY, 'Hoạt động tốt'),
(6, 1, 6, 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 6, NOW() - INTERVAL 5 DAY, 'Bẫy hoạt động tốt'),
(7, 1, 7, 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất kim chỉ vạch xanh', 'Cơ sở vật chất & An toàn lao động', 3, 'PASS', 7, NOW() - INTERVAL 5 DAY, 'Còn hạn đến 12/2026'),
(8, 1, 8, 'TC-QT-01', 'Nhân viên đeo khẩu trang, găng tay và đội mũ bảo hộ đúng quy cách', 'Quy trình phục vụ & Tác phong nhân viên', 2, 'FAIL', 8, NOW() - INTERVAL 5 DAY, '2 nhân viên phụ bếp chưa đội mũ bảo hộ đúng quy cách'),
(9, 1, 9, 'TC-QT-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đầy đủ ca', 'Quy trình phục vụ & Tác phong nhân viên', 1, 'PASS', 9, NOW() - INTERVAL 5 DAY, 'Sổ ký đủ ca sáng'),

-- Inspection 2: Kichi-Kichi (9 PASS -> 100%)
(10, 2, 1, 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 1, NOW() - INTERVAL 3 DAY, 'Tủ mát line lẩu sắp xếp gọn gàng'),
(11, 2, 2, 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 2, NOW() - INTERVAL 3 DAY, 'Nhiệt độ đo -19.5°C'),
(12, 2, 3, 'TC-VS-03', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 2, 'PASS', 3, NOW() - INTERVAL 3 DAY, 'TPM 16.2% đạt chuẩn'),
(13, 2, 4, 'TC-VS-04', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1, 'PASS', 4, NOW() - INTERVAL 3 DAY, 'Đầy đủ dao thớt chuyên dụng'),
(14, 2, 5, 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 5, NOW() - INTERVAL 3 DAY, 'Hệ thống hút êm'),
(15, 2, 6, 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 6, NOW() - INTERVAL 3 DAY, 'Đèn diệt côn trùng hoạt động tốt'),
(16, 2, 7, 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất kim chỉ vạch xanh', 'Cơ sở vật chất & An toàn lao động', 3, 'PASS', 7, NOW() - INTERVAL 3 DAY, 'Bình PCCC kiểm định đúng hạn'),
(17, 2, 8, 'TC-QT-01', 'Nhân viên đeo khẩu trang, găng tay và đội mũ bảo hộ đúng quy cách', 'Quy trình phục vụ & Tác phong nhân viên', 2, 'PASS', 8, NOW() - INTERVAL 3 DAY, 'Nhân viên tuân thủ nghiêm túc'),
(18, 2, 9, 'TC-QT-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đầy đủ ca', 'Quy trình phục vụ & Tác phong nhân viên', 1, 'PASS', 9, NOW() - INTERVAL 3 DAY, 'Ký đủ 3 ca'),

-- Inspection 3: Gogi House (8 PASS, 1 FAIL -> 84.21%)
(19, 3, 1, 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 1, NOW() - INTERVAL 2 DAY, 'Tem date đầy đủ'),
(20, 3, 2, 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'FAIL', 2, NOW() - INTERVAL 2 DAY, 'Tủ rau củ 8°C lúc xả đá'),
(21, 3, 3, 'TC-VS-03', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 2, 'PASS', 3, NOW() - INTERVAL 2 DAY, 'TPM 17% đạt chuẩn'),
(22, 3, 4, 'TC-VS-04', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1, 'PASS', 4, NOW() - INTERVAL 2 DAY, 'Phân màu chuẩn'),
(23, 3, 5, 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 5, NOW() - INTERVAL 2 DAY, 'Hút mùi tốt'),
(24, 3, 6, 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 6, NOW() - INTERVAL 2 DAY, 'Đèn sáng tốt'),
(25, 3, 7, 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất kim chỉ vạch xanh', 'Cơ sở vật chất & An toàn lao động', 3, 'PASS', 7, NOW() - INTERVAL 2 DAY, 'PCCC đạt chuẩn'),
(26, 3, 8, 'TC-QT-01', 'Nhân viên đeo khẩu trang, găng tay và đội mũ bảo hộ đúng quy cách', 'Quy trình phục vụ & Tác phong nhân viên', 2, 'PASS', 8, NOW() - INTERVAL 2 DAY, 'Đồng phục nghiêm túc'),
(27, 3, 9, 'TC-QT-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đầy đủ ca', 'Quy trình phục vụ & Tác phong nhân viên', 1, 'PASS', 9, NOW() - INTERVAL 2 DAY, 'Ghi chép đều đặn'),

-- Inspection 4: Hotpot Story (8 PASS, 1 FAIL -> 89.47%)
(28, 4, 1, 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 1, NOW() - INTERVAL 1 DAY, 'Phân khu sống chín rõ ràng'),
(29, 4, 2, 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 3, 'PASS', 2, NOW() - INTERVAL 1 DAY, 'Nhiệt độ -20°C'),
(30, 4, 3, 'TC-VS-03', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 2, 'FAIL', 3, NOW() - INTERVAL 1 DAY, 'TPM 25.8% vượt ngưỡng'),
(31, 4, 4, 'TC-VS-04', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1, 'PASS', 4, NOW() - INTERVAL 1 DAY, 'Đạt chuẩn'),
(32, 4, 5, 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 5, NOW() - INTERVAL 1 DAY, 'Hút mùi tốt'),
(33, 4, 6, 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 'Cơ sở vật chất & An toàn lao động', 2, 'PASS', 6, NOW() - INTERVAL 1 DAY, 'Bẫy côn trùng sạch'),
(34, 4, 7, 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất kim chỉ vạch xanh', 'Cơ sở vật chất & An toàn lao động', 3, 'PASS', 7, NOW() - INTERVAL 1 DAY, 'Đạt chuẩn'),
(35, 4, 8, 'TC-QT-01', 'Nhân viên đeo khẩu trang, găng tay và đội mũ bảo hộ đúng quy cách', 'Quy trình phục vụ & Tác phong nhân viên', 2, 'PASS', 8, NOW() - INTERVAL 1 DAY, 'Trang phục chuẩn'),
(36, 4, 9, 'TC-QT-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đầy đủ ca', 'Quy trình phục vụ & Tác phong nhân viên', 1, 'PASS', 9, NOW() - INTERVAL 1 DAY, 'Sổ ký đầy đủ');

-- 12. Findings (10 Lỗi thực tế: M1, M2, M3, M4 với đầy đủ trạng thái)
INSERT INTO findings (id, inspection_id, inspection_item_id, criterion_id, restaurant_id, risk_level_code, risk_level_name, base_impact, effective_impact, violation_count, calculated_score, description, status, remediation_days, deadline_date, version, created_at, updated_at) VALUES
-- Lỗi 1: M2, Status OPEN (Tủ đông đo -14°C)
(1, 1, 2, 2, 3, 'M2', 'Trung bình', 3, 3, 1, 6, 'Tủ đông số 2 tại khu sơ chế thịt đo được -14°C, vượt ngưỡng quy định (-18°C đến -22°C). Cần xả tuyết và bảo dưỡng lốc lạnh ngay.', 'OPEN', 5, CURRENT_DATE + INTERVAL 3 DAY, 1, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),

-- Lỗi 2: M1, Status REMEDIATING (Nhân viên chưa đội mũ bảo hộ)
(2, 1, 8, 8, 3, 'M1', 'Nhẹ', 2, 2, 1, 3, '2 nhân viên phụ bếp chưa đội mũ bảo hộ đúng quy cách trong ca làm việc buổi sáng.', 'REMEDIATING', 7, CURRENT_DATE + INTERVAL 5 DAY, 1, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 3 DAY),

-- Lỗi 3: M3, Status CONFIRMED (Dầu chiên khét TPM cao)
(3, 4, 3, 3, 4, 'M3', 'Trung bình cao', 2, 3, 2, 8, 'Dầu chiên tại chảo số 1 có chỉ số TPM đo được 25.8% (vượt mức 24%), màu dầu sẫm và có cặn cháy.', 'CONFIRMED', 3, CURRENT_DATE + INTERVAL 2 DAY, 1, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),

-- Lỗi 4: M2, Status APPEALED (Nhiệt độ lúc xả tuyết định kỳ)
(4, 3, 2, 2, 2, 'M2', 'Trung bình', 3, 3, 1, 5, 'Tủ bảo quản rau củ đo được 8°C lúc 10:30. Cửa hàng khiếu nại do đang trong chu kỳ tự động xả tuyết.', 'APPEALED', 5, CURRENT_DATE + INTERVAL 4 DAY, 1, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY),

-- Lỗi 5: M1, Status PENDING_VERIFICATION (Đèn diệt côn trùng đã thay bóng)
(5, 2, 6, 6, 1, 'M1', 'Nhẹ', 2, 2, 1, 2, 'Đèn diệt côn trùng khu vực cửa kho hàng bị hỏng 1 bóng tuýp UV.', 'PENDING_VERIFICATION', 7, CURRENT_DATE + INTERVAL 6 DAY, 1, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY),

-- Lỗi 6: M1, Status OPEN nhưng Quá hạn (Overdue) để kiểm tra KPI cảnh báo quá hạn
(6, 1, 4, 4, 3, 'M1', 'Nhẹ', 1, 1, 1, 2, 'Thớt dùng cho thực phẩm chín có vết xước sâu cần bào phẳng hoặc thay mới.', 'OPEN', 3, CURRENT_DATE - INTERVAL 2 DAY, 1, NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),

-- Lỗi 7: M2, Status CLOSED (Đã khắc phục đúng hạn tháng 10)
(7, 7, 7, 7, 3, 'M2', 'Trung bình', 3, 3, 1, 6, 'Bình chữa cháy tại lối thoát hiểm bị che chắn bởi thùng carton hàng hóa.', 'CLOSED', 5, '2026-10-20', 1, '2026-10-15 10:00:00', '2026-10-18 14:00:00'),

-- Lỗi 8: M1, Status CLOSED (Đã khắc phục đúng hạn tháng 10)
(8, 8, 1, 1, 1, 'M1', 'Nhẹ', 3, 2, 1, 3, '2 khay thịt ba chỉ bò trong tủ mát chưa dán tem phụ ngày sơ chế.', 'CLOSED', 7, '2026-10-29', 1, '2026-10-22 15:00:00', '2026-10-25 09:30:00'),

-- Lỗi 9: M3, Status CLOSED (Đã khắc phục đúng hạn tháng 9)
(9, 10, 5, 5, 4, 'M3', 'Trung bình cao', 2, 3, 1, 7, 'Hút mùi line nướng số 4 bị đứt dây curoa quạt hút gây tràn khói ra khu vực khách.', 'CLOSED', 3, '2026-09-21', 1, '2026-09-18 10:00:00', '2026-09-20 16:00:00'),

-- Lỗi 10: M2, Status CLOSED (Đã khắc phục đúng hạn tháng 8)
(10, 12, 9, 9, 1, 'M2', 'Trung bình', 1, 2, 1, 4, 'Sổ kiểm thực 3 bước bị thiếu chữ ký xác nhận của Cửa hàng trưởng ca chiều.', 'CLOSED', 5, '2026-08-21', 1, '2026-08-16 11:00:00', '2026-08-18 15:00:00')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Cập nhật verified_at cho các lỗi đã đóng (CLOSED)
UPDATE findings SET verified_at = '2026-10-18 14:00:00', verified_by = 5 WHERE id = 7;
UPDATE findings SET verified_at = '2026-10-25 09:30:00', verified_by = 5 WHERE id = 8;
UPDATE findings SET verified_at = '2026-09-20 16:00:00', verified_by = 5 WHERE id = 9;
UPDATE findings SET verified_at = '2026-08-18 15:00:00', verified_by = 5 WHERE id = 10;

SET FOREIGN_KEY_CHECKS = 1;
