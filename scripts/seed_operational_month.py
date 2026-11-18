#!/usr/bin/env python3
"""
Nạp dữ liệu mẫu 70 tiêu chí và 1 tháng vận hành hoàn chỉnh cho KSVH QC.
"""

import subprocess

sql_content = """
-- 1. CÔNG TY
INSERT INTO companies (code, name) VALUES
    ('GGG', 'CÔNG TY CP THƯƠNG MẠI DỊCH VỤ CỔNG VÀNG (Golden Gate Group)'),
    ('REDSUN', 'CÔNG TY CP ĐẦU TƯ THƯƠNG MẠI QUỐC TẾ MẶT TRỜI ĐỎ (Redsun ITI)')
ON CONFLICT (lower(code)) DO NOTHING;

-- 2. NHÀ HÀNG & PHÒNG BAN
INSERT INTO org_units (company_id, unit_type, code, name, address, latitude, longitude, checkin_radius_m, store_manager_user_id, obm_user_id)
SELECT c.id, v.unit_type, v.code, v.name, v.address, v.lat, v.lng, v.radius,
       CASE WHEN v.unit_type = 'RESTAURANT' THEN (SELECT id FROM users WHERE username = 'store' LIMIT 1) END,
       CASE WHEN v.unit_type = 'RESTAURANT' THEN (SELECT id FROM users WHERE username = 'obm' LIMIT 1) END
FROM (VALUES
    ('GGG',    'RESTAURANT', 'KICHI-01',  'Kichi-Kichi Vincom Đồng Khởi', 'Tầng B3-01, Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM', 10.7774, 106.7022, 100),
    ('GGG',    'RESTAURANT', 'GOGI-01',   'Gogi House Nguyễn Thị Thập', '521 Nguyễn Thị Thập, Tân Phong, Quận 7, TP.HCM', 10.7381, 106.7115, 100),
    ('GGG',    'RESTAURANT', 'MANWAH-01', 'Manwah Taiwanese Hotpot Aeon Mall Tân Phú', 'Tầng 1, Aeon Mall, 30 Bờ Bao Tân Thắng, Sơn Kỳ, Tân Phú, TP.HCM', 10.8009, 106.6156, 120),
    ('GGG',    'RESTAURANT', 'ISUSHI-01', 'iSushi Buffet Nhật Bản Landmark 81', 'Tầng B1, Vinhomes Central Park, 720A Điện Biên Phủ, Bình Thạnh, TP.HCM', 10.7951, 106.7218, 100),
    ('REDSUN', 'RESTAURANT', 'KBBQ-01',   'King BBQ Diamond Plaza', 'Tầng 4, Diamond Plaza, 34 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM', 10.7801, 106.6994, 100),
    ('REDSUN', 'RESTAURANT', 'HPS-01',    'Hotpot Story Saigon Centre', 'Tầng 5, Saigon Centre, 65 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', 10.7738, 106.7011, 100),
    ('GGG',    'DEPARTMENT', 'PK-SVH',    'Phòng Kiểm Soát Vận Hành', 'Trụ sở Golden Gate Tower, 60 Giang Văn Minh, Ba Đình, Hà Nội', NULL, NULL, NULL)
) AS v(company_code, unit_type, code, name, address, lat, lng, radius)
JOIN companies c ON lower(c.code) = lower(v.company_code)
ON CONFLICT (lower(code)) DO NOTHING;

-- 3. NHÂN VIÊN
INSERT INTO employees (employee_code, full_name, email, phone, job_title, org_unit_id, user_id)
SELECT v.code, v.full_name, v.email, v.phone, v.job_title, ou.id, u.id
FROM (VALUES
    ('NV001', 'Quản trị hệ thống', 'admin@ksvh.vn', '0901234567', 'Chuyên viên Quản trị Hệ thống', 'PK-SVH', 'admin'),
    ('NV002', 'Quản trị nghiệp vụ', 'bizadmin@ksvh.vn', '0902345678', 'Chuyên viên Quản lý Tiêu chuẩn F&B', 'PK-SVH', 'bizadmin'),
    ('NV003', 'Trưởng nhóm KSVH', 'lead@ksvh.vn', '0903456789', 'Trưởng nhóm Kiểm Soát Vận Hành', 'PK-SVH', 'lead'),
    ('NV004', 'Quản lý KSVH', 'manager@ksvh.vn', '0904567890', 'Trưởng phòng KSVH & Đảm bảo Chất lượng', 'PK-SVH', 'manager'),
    ('NV005', 'Chuyên viên KSVH 01', 'inspector@ksvh.vn', '0905678901', 'Thanh tra viên KSVH', 'PK-SVH', 'inspector'),
    ('NV006', 'Cửa hàng trưởng Demo', 'store@ksvh.vn', '0906789012', 'Cửa hàng trưởng Nhà hàng', 'KICHI-01', 'store'),
    ('NV007', 'Giám sát Vận hành OBM', 'obm@ksvh.vn', '0907890123', 'Giám sát Vận hành Vùng (OBM)', 'PK-SVH', 'obm'),
    ('NV008', 'Đại diện Ban Giám đốc', 'executive@ksvh.vn', '0908901234', 'Phó Tổng Giám đốc Vận hành', 'PK-SVH', 'executive')
) AS v(code, full_name, email, phone, job_title, unit_code, username)
LEFT JOIN org_units ou ON lower(ou.code) = lower(v.unit_code)
LEFT JOIN users u ON u.username = v.username
ON CONFLICT (lower(employee_code)) DO NOTHING;

-- 4. NHÓM TIÊU CHÍ (5 nhóm)
INSERT INTO criterion_groups (code, name, sort_order) VALUES
    ('GRP-VSATTP', 'Vệ sinh An toàn Thực phẩm (VSATTP)', 1),
    ('GRP-CSVC', 'Cơ sở vật chất & An toàn PCCC', 2),
    ('GRP-BEP', 'Quy trình chế biến & Vận hành Bếp', 3),
    ('GRP-DV', 'Tiêu chuẩn dịch vụ & Phục vụ khách hàng', 4),
    ('GRP-BAR-POS', 'Quản lý Quầy Bar, Thu ngân & An ninh', 5)
ON CONFLICT (lower(code)) DO NOTHING;

-- 5. TIÊU CHÍ (70 tiêu chí)
INSERT INTO criteria (group_id, code, name, base_impact, check_method, evidence_required, sort_order)
SELECT g.id, v.code, v.name, v.impact, v.check_method, v.evidence, v.sort_order
FROM (VALUES
    ('GRP-VSATTP', 'TC-VS-01', 'Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng', 3, 'Quan sát tủ trữ đông và bàn sơ chế thực phẩm', 'Chụp ảnh tủ bảo quản và nhãn thực phẩm', 1),
    ('GRP-VSATTP', 'TC-VS-02', 'Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)', 3, 'Dùng nhiệt kế kiểm chuẩn đo nhiệt độ trung tâm tủ', 'Chụp ảnh màn hình nhiệt kế', 2),
    ('GRP-VSATTP', 'TC-VS-03', 'Nhiệt độ tủ mát bảo quản thực phẩm chín đạt chuẩn (0°C đến 4°C)', 3, 'Dùng nhiệt kế kiểm chuẩn đo nhiệt độ tủ mát', 'Chụp ảnh màn hình nhiệt kế', 3),
    ('GRP-VSATTP', 'TC-VS-04', 'Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%', 2, 'Dùng máy đo chất lượng dầu Testo', 'Chụp ảnh màn hình máy đo hiển thị chỉ số', 4),
    ('GRP-VSATTP', 'TC-VS-05', 'Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm (đỏ: thịt, xanh: rau)', 2, 'Kiểm tra khu sơ chế hải sản, thịt gia cầm, rau củ', 'Chụp ảnh giá để dao thớt', 5),
    ('GRP-VSATTP', 'TC-VS-06', 'Thực phẩm rã đông đúng quy trình, không ngâm trực tiếp trong nước', 3, 'Quan sát phương pháp rã đông tại bồn rửa và tủ mát', 'Chụp ảnh khay thực phẩm đang rã đông', 6),
    ('GRP-VSATTP', 'TC-VS-07', 'Tuyệt đối không sử dụng phụ gia hoặc phẩm màu ngoài danh mục Bộ Y Tế', 4, 'Kiểm tra kho gia vị và phụ gia tại bếp', 'Chụp ảnh nhãn mác gia vị', 7),
    ('GRP-VSATTP', 'TC-VS-08', 'Mẫu lưu thực phẩm đủ định lượng và lưu tối thiểu 24 giờ', 3, 'Kiểm tra tủ lưu mẫu và nhật ký lưu mẫu thức ăn', 'Chụp ảnh khay lưu mẫu và sổ ký', 8),
    ('GRP-VSATTP', 'TC-VS-09', 'Khăn lau bàn và khăn lau ly chén phân biệt và giặt khử trùng hàng ngày', 1, 'Kiểm tra thau ngâm khăn và giá phơi khăn', 'Chụp ảnh khu giặt phơi khăn', 9),
    ('GRP-VSATTP', 'TC-VS-10', 'Dụng cụ chứa đựng thực phẩm làm bằng inox hoặc nhựa thực phẩm nguyên sinh', 2, 'Kiểm tra đáy hộp, khay GN và xô chậu trong bếp', 'Chụp ảnh khay hộp', 10),
    ('GRP-VSATTP', 'TC-VS-11', 'Bồn rửa tay nhân viên có đầy đủ xà phòng diệt khuẩn, cồn sát khuẩn và khăn giấy', 2, 'Kiểm tra bồn rửa tay trước cửa bếp', 'Chụp ảnh bồn rửa tay', 11),
    ('GRP-VSATTP', 'TC-VS-12', 'Nhân viên trực tiếp chế biến có giấy khám sức khỏe và tập huấn VSATTP còn hạn', 3, 'Kiểm tra hồ sơ lưu trữ nhân sự tại nhà hàng', 'Chụp ảnh hồ sơ sức khỏe', 12),
    ('GRP-VSATTP', 'TC-VS-13', 'Khu vực thùng rác bếp có nắp đậy kín, đạp chân và lót túi rác đạt chuẩn', 1, 'Kiểm tra các vị trí thùng rác trong bếp', 'Chụp ảnh thùng rác', 13),
    ('GRP-VSATTP', 'TC-VS-14', 'Hệ thống thoát nước sàn bếp có lưới chắn rác và bẫy mỡ định kỳ vệ sinh', 2, 'Mở nắp hố ga và bẫy mỡ kiểm tra độ đọng mỡ', 'Chụp ảnh rãnh thoát nước và bẫy mỡ', 14),
    ('GRP-VSATTP', 'TC-VS-15', 'Không có dấu vết côn trùng, ruồi, gián, chuột trong khu vực kho và chế biến', 3, 'Kiểm tra góc tường, gầm kệ kho và bẫy dính', 'Chụp ảnh khu vực nghi vấn', 15),
    ('GRP-VSATTP', 'TC-VS-16', 'Nước đá dùng cho đồ uống đảm bảo nguồn gốc nước đá sạch có kiểm nghiệm định kỳ', 3, 'Kiểm tra thùng trữ đá quầy bar và chứng từ giao nhận đá', 'Chụp ảnh thùng đá và phiếu giao', 16),
    ('GRP-VSATTP', 'TC-VS-17', 'Gia vị và nước sốt pha chế trong ngày dán nhãn hạn sử dụng rõ ràng', 2, 'Kiểm tra chai lọ gia vị tại line ra đồ', 'Chụp ảnh tem nhãn sốt', 17),
    ('GRP-VSATTP', 'TC-VS-18', 'Tủ cơm và thiết bị hấp giữ nhiệt trên 65°C trước khi phục vụ', 2, 'Đo nhiệt độ thực phẩm trong tủ giữ nóng', 'Chụp ảnh nhiệt kế', 18),
    ('GRP-CSVC', 'TC-VC-01', 'Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ', 2, 'Kiểm tra lưu lượng hút tại chụp hút và quạt tổng', 'Chụp ảnh chụp hút và khu chế biến', 1),
    ('GRP-CSVC', 'TC-VC-02', 'Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định', 2, 'Kiểm tra vị trí đèn diệt côn trùng và nhật ký thay bẫy', 'Chụp ảnh đèn và phiếu kiểm tra', 2),
    ('GRP-CSVC', 'TC-VC-03', 'Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất ở vạch xanh', 3, 'Quan sát tem kiểm định và áp kế bình PCCC', 'Chụp ảnh tem kiểm định và đồng hồ áp', 3),
    ('GRP-CSVC', 'TC-VC-04', 'Lối thoát hiểm thông thoáng, đèn Exit và đèn chiếu sáng sự cố sáng tốt', 4, 'Kiểm tra hành lang thoát hiểm và ngắt điện thử đèn Exit', 'Chụp ảnh cửa thoát hiểm và đèn', 4),
    ('GRP-CSVC', 'TC-VC-05', 'Hệ thống gas trung tâm có van ngắt tự động và còi báo rò rỉ gas hoạt động', 4, 'Kiểm tra tủ điều khiển gas và đầu dò gas', 'Chụp ảnh bảng điều khiển gas', 5),
    ('GRP-CSVC', 'TC-VC-06', 'Sàn nhà khu vực khách và bếp khô ráo, không trơn trượt, có biển cảnh báo', 2, 'Kiểm tra mặt sàn và gạch chống trượt', 'Chụp ảnh mặt sàn', 6),
    ('GRP-CSVC', 'TC-VC-07', 'Hệ thống điều hòa và quạt thông gió sảnh khách mát mẻ (23°C - 26°C)', 1, 'Đo nhiệt độ trung tâm khu vực bàn khách', 'Chụp ảnh nhiệt kế sảnh', 7),
    ('GRP-CSVC', 'TC-VC-08', 'Bàn ghế, sofa, rèm cửa sạch sẽ, không rách, không lung lay ọp ẹp', 1, 'Kiểm tra ngẫu nhiên 5 bộ bàn ghế', 'Chụp ảnh bàn ghế', 8),
    ('GRP-CSVC', 'TC-VC-09', 'Nhà vệ sinh khách sạch sẽ, không mùi hôi, đủ giấy vệ sinh và nước rửa tay', 2, 'Kiểm tra bồn cầu, gương, lavabo nhà vệ sinh', 'Chụp ảnh khu vệ sinh', 9),
    ('GRP-CSVC', 'TC-VC-10', 'Hệ thống âm thanh phát nhạc đúng playlist chuẩn thương hiệu, âm lượng vừa phải', 1, 'Nghe kiểm tra tại sảnh và quầy bar', 'Chụp ảnh bảng điều khiển âm thanh', 10),
    ('GRP-CSVC', 'TC-VC-11', 'Biển hiệu nhà hàng sáng đủ đèn, sạch sẽ, không rách bạt hoặc nứt vỡ', 2, 'Quan sát mặt tiền nhà hàng vào buổi tối', 'Chụp ảnh biển hiệu bên ngoài', 11),
    ('GRP-CSVC', 'TC-VC-12', 'Tủ điện tổng có nắp che chắn, dán nhãn phân lộ aptomat rõ ràng', 3, 'Kiểm tra tủ điện tổng và tiếp địa an toàn', 'Chụp ảnh tủ điện mở nắp', 12),
    ('GRP-CSVC', 'TC-VC-13', 'Bếp từ và bếp nướng tại bàn hoạt động tốt, không rò điện', 3, 'Dùng bút thử điện kiểm tra vỏ bếp nướng/lẩu', 'Chụp ảnh bút thử điện kiểm tra', 13),
    ('GRP-CSVC', 'TC-VC-14', 'Dụng cụ sơ cứu y tế (băng gạc, sát trùng, bông, kéo) đầy đủ trong tủ thuốc', 1, 'Kiểm tra tủ thuốc sơ cấp cứu nhà hàng', 'Chụp ảnh tủ thuốc sơ cấp cứu', 14),
    ('GRP-CSVC', 'TC-VC-15', 'Hệ thống lọc nước tinh khiết định kỳ thay lõi đúng lịch', 2, 'Kiểm tra sổ theo dõi thay lõi lọc nước và đồng hồ áp', 'Chụp ảnh hệ thống lọc nước', 15),
    ('GRP-BEP', 'TC-BP-01', 'Nhân viên bếp đeo khẩu trang, mũ trùm tóc và găng tay đúng quy cách', 2, 'Quan sát trực tiếp nhân viên bếp và line ra đồ', 'Chụp ảnh nhân viên tại khu bếp', 1),
    ('GRP-BEP', 'TC-BP-02', 'Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đủ ca hàng ngày', 1, 'Kiểm tra sổ theo dõi tại quầy sơ chế', 'Chụp ảnh 2 trang sổ gần nhất', 2),
    ('GRP-BEP', 'TC-BP-03', 'Cân định lượng nguyên liệu chính xác theo định mức công thức chuẩn (SOP)', 2, 'Cân thử ngẫu nhiên 3 phần ăn chuẩn bị ra bàn', 'Chụp ảnh cân hiển thị trọng lượng', 3),
    ('GRP-BEP', 'TC-BP-04', 'Nước dùng lẩu / nước dùng phở nấu đúng thời gian và vị chuẩn', 2, 'Thử vị và đo nồng độ khúc xạ kế Brix / nhiệt độ sôi', 'Chụp ảnh nồi nước dùng', 4),
    ('GRP-BEP', 'TC-BP-05', 'Rau sống, rau lẩu được ngâm rửa qua 3 bước và quay ráo nước trước khi lên bàn', 2, 'Kiểm tra bồn rửa rau và máy quay vắt ráo rau', 'Chụp ảnh rổ rau đã sơ chế', 5),
    ('GRP-BEP', 'TC-BP-06', 'Thịt bò/heo/cừu thái đúng độ dày quy định, không dập nát, bày đĩa chuẩn định dạng', 1, 'Kiểm tra khay thịt thành phẩm trên line', 'Chụp ảnh đĩa thịt hoàn thiện', 6),
    ('GRP-BEP', 'TC-BP-07', 'Gia vị ướp tẩm chuẩn công thức, dán nhãn ca làm và người thực hiện', 2, 'Kiểm tra khay thịt ướp trong tủ trữ', 'Chụp ảnh khay thực phẩm ướp', 7),
    ('GRP-BEP', 'TC-BP-08', 'Thời gian hoàn thành món ăn đúng quy chuẩn thời gian ca cao điểm (< 10 phút)', 2, 'Bấm giờ theo dõi từ lúc nhận order POS đến khi ra món', 'Chụp ảnh màn hình KDS hiển thị thời gian', 8),
    ('GRP-BEP', 'TC-BP-09', 'Khu vực ra món (Pass đồ) sạch sẽ, thức ăn ra đĩa có chuông báo hoặc nắp đậy', 1, 'Quan sát bàn pass đồ và nhiệt độ món ăn', 'Chụp ảnh bàn giao nhận món', 9),
    ('GRP-BEP', 'TC-BP-10', 'Dụng cụ ăn uống (chén, dĩa, thìa, đũa) rửa bằng máy sấy nhiệt độ đạt > 80°C', 3, 'Đo nhiệt độ tráng máy rửa bát công nghiệp', 'Chụp ảnh đồng hồ nhiệt máy rửa bát', 10),
    ('GRP-BEP', 'TC-BP-11', 'Tuyệt đối không sử dụng bát đĩa sứt mẻ, ố vàng hoặc trầy xước nặng', 1, 'Kiểm tra ngẫu nhiên kho bát đĩa sạch', 'Chụp ảnh bát đĩa trên kệ', 11),
    ('GRP-BEP', 'TC-BP-12', 'Hàng tồn kho cuối ca được bọc màng thực phẩm và kiểm kê đúng số lượng', 2, 'Kiểm tra tủ lưu trữ cuối ca làm việc', 'Chụp ảnh tủ đồ tồn cuối ca', 12),
    ('GRP-BEP', 'TC-BP-13', 'Bếp trưởng hoặc Bếp phó trực tiếp kiểm tra món ăn trước khi chuyển ra phục vụ', 1, 'Quan sát quy trình kiểm duyệt tại bàn pass', 'Chụp ảnh bếp trưởng kiểm tra đĩa thức ăn', 13),
    ('GRP-BEP', 'TC-BP-14', 'Dầu thừa thải bỏ được thu gom vào can riêng, không đổ trực tiếp ra cống', 2, 'Kiểm tra khu chứa can dầu mỡ thải', 'Chụp ảnh can dầu thải', 14),
    ('GRP-BEP', 'TC-BP-15', 'Vệ sinh tổng thể khu bếp cuối ngày (tẩy sàn, cọ bếp, lau chụp hút) đúng checklist', 2, 'Kiểm tra hiện trường sau ca đóng cửa', 'Chụp ảnh toàn cảnh bếp sau dọn dẹp', 15),
    ('GRP-DV', 'TC-DV-01', 'Nhân viên phục vụ mặc đồng phục sạch sẽ, đeo bảng tên, tác phong chỉn chu', 1, 'Quan sát nhân viên tiếp đón và phục vụ bàn', 'Chụp ảnh nhân viên sảnh', 1),
    ('GRP-DV', 'TC-DV-02', 'Chào đón khách trong vòng 10 giây kể từ khi khách bước vào cửa nhà hàng', 1, 'Quan sát tại quầy lễ tân / đón tiếp', 'Chụp ảnh lễ tân đón khách', 2),
    ('GRP-DV', 'TC-DV-03', 'Giới thiệu chương trình khuyến mãi và menu combo chuẩn xác cho khách', 1, 'Lắng nghe nhân viên tư vấn gọi món tại bàn', 'Chụp ảnh nhân viên tư vấn khách', 3),
    ('GRP-DV', 'TC-DV-04', 'Đặt bàn chuẩn bị đủ chén đĩa, khăn ướt, đũa muỗng trước khi khách ngồi', 1, 'Kiểm tra các bàn đã set-up sẵn', 'Chụp ảnh bàn ăn set-up', 4),
    ('GRP-DV', 'TC-DV-05', 'Châm thêm nước dùng lẩu / thay vỉ nướng chủ động không để khách phải gọi nhắc', 2, 'Quan sát tần suất nhân viên chăm sóc bàn ăn', 'Chụp ảnh nhân viên thay vỉ nướng', 5),
    ('GRP-DV', 'TC-DV-06', 'Dọn dẹp đĩa trống tại bàn nhanh chóng, không để bàn ăn bừa bộn', 1, 'Quan sát quy trình thu dọn bàn ăn trong ca', 'Chụp ảnh bàn ăn của khách', 6),
    ('GRP-DV', 'TC-DV-07', 'Xử lý phàn nàn của khách hàng nhã nhặn, đúng quy trình xử lý khủng hoảng (LAST)', 3, 'Kiểm tra nhật ký ghi nhận phàn nàn và xử lý', 'Chụp ảnh biên bản xử lý khiếu nại khách', 7),
    ('GRP-DV', 'TC-DV-08', 'Hỏi thăm trải nghiệm của khách về chất lượng món ăn và dịch vụ trước khi về', 1, 'Lắng nghe nhân viên chăm sóc khách lúc thanh toán', 'Chụp ảnh nhân viên tiễn khách', 8),
    ('GRP-DV', 'TC-DV-09', 'Cảm ơn và cúi chào khách khi khách ra về', 1, 'Quan sát tại cửa ra vào nhà hàng', 'Chụp ảnh nhân viên mở cửa chào khách', 9),
    ('GRP-DV', 'TC-DV-10', 'Dọn bàn và set-up bàn mới trong vòng 3 phút sau khi khách rời bàn', 1, 'Theo dõi thời gian dọn dẹp và set-up bàn', 'Chụp ảnh bàn ăn mới hoàn tất', 10),
    ('GRP-DV', 'TC-DV-11', 'Bảo quản tư trang của khách bỏ quên đúng quy trình ghi sổ Lost & Found', 2, 'Kiểm tra tủ lưu đồ thất lạc và sổ nhật ký', 'Chụp ảnh sổ Lost & Found', 11),
    ('GRP-DV', 'TC-DV-12', 'Cung cấp ghế trẻ em và dụng cụ ăn uống cho trẻ em nhanh chóng khi có yêu cầu', 1, 'Kiểm tra khu để ghế trẻ em sạch sẽ', 'Chụp ảnh ghế trẻ em', 12),
    ('GRP-BAR-POS', 'TC-TN-01', 'Kiểm kê két tiền đầu ca và bàn giao quỹ tiền mặt chuẩn xác, khớp sổ sách', 3, 'Kiểm tra biên bản bàn giao két tiền mặt', 'Chụp ảnh sổ quỹ tiền mặt', 1),
    ('GRP-BAR-POS', 'TC-TN-02', 'Mật khẩu tài khoản POS không được dán công khai hoặc dùng chung ca', 3, 'Quan sát quầy thu ngân và màn hình POS', 'Chụp ảnh khu vực máy POS', 2),
    ('GRP-BAR-POS', 'TC-TN-03', 'Hóa đơn thanh toán in đủ chi tiết món, thuế VAT và thông tin khuyến mãi', 2, 'Kiểm tra ngẫu nhiên 3 hóa đơn thanh toán', 'Chụp ảnh bill thanh toán', 3),
    ('GRP-BAR-POS', 'TC-TN-04', 'Không có sai lệch tiền mặt thực tế so với báo cáo tổng kết POS cuối ngày', 3, 'Đối chiếu biên bản chốt ca và sao kê POS', 'Chụp ảnh báo cáo Z-report', 4),
    ('GRP-BAR-POS', 'TC-TN-05', 'Camera an ninh khu vực thu ngân và quầy bar hoạt động 24/7, góc nhìn chuẩn', 3, 'Kiểm tra màn hình hiển thị camera tại phòng quản lý', 'Chụp ảnh màn hình camera', 5),
    ('GRP-BAR-POS', 'TC-TN-06', 'Syrup và nguyên liệu pha chế quầy Bar đậy kín nắp, dán nhãn hạn sử dụng', 2, 'Kiểm tra kệ chai lọ syrup và tủ lạnh quầy bar', 'Chụp ảnh chai lọ quầy bar', 6),
    ('GRP-BAR-POS', 'TC-TN-07', 'Máy pha cà phê và máy xay sinh tố vệ sinh sạch sẽ sau mỗi lần sử dụng', 1, 'Kiểm tra cối xay và vòi đánh sữa', 'Chụp ảnh máy pha cafe', 7),
    ('GRP-BAR-POS', 'TC-TN-08', 'Ly cốc quầy Bar lau bằng khăn chuyên dụng, úp ráo nước, không có mùi lạ', 1, 'Kiểm tra kệ úp ly cốc và khăn lau quầy bar', 'Chụp ảnh giá để ly', 8),
    ('GRP-BAR-POS', 'TC-TN-09', 'Tuyệt đối không bán đồ uống có cồn cho người dưới 18 tuổi', 3, 'Kiểm tra quy trình xác nhận độ tuổi của nhân viên', 'Chụp ảnh biển thông báo quy định cồn', 9),
    ('GRP-BAR-POS', 'TC-TN-10', 'Dụng cụ đong đếm (jigger, bình lắc shaker) tráng rửa sạch ngay sau khi pha chế', 1, 'Quan sát bồn rửa quầy bar trong lúc pha chế', 'Chụp ảnh dụng cụ pha chế', 10)
) AS v(group_code, code, name, impact, check_method, evidence, sort_order)
JOIN criterion_groups g ON lower(g.code) = lower(v.group_code)
ON CONFLICT (lower(code)) DO NOTHING;

-- 6. MẪU PHIẾU CHUẨN KSVH (MP-KSVH-70)
INSERT INTO inspection_templates (code, name, inspection_type, description, active)
VALUES ('MP-KSVH-70', 'Phiếu Kiểm tra Định kỳ Chuẩn KSVH F&B (70 Tiêu chí)', 'Định kỳ', 'Mẫu phiếu chuẩn toàn diện cho toàn hệ thống nhà hàng Golden Gate & Redsun', true)
ON CONFLICT (lower(code)) DO NOTHING;

-- Gắn 70 tiêu chí vào mẫu phiếu MP-KSVH-70
INSERT INTO template_criteria (template_id, criterion_id, sort_order)
SELECT t.id, c.id, c.sort_order
FROM criteria c
CROSS JOIN inspection_templates t
WHERE lower(t.code) = 'mp-ksvh-70'
ON CONFLICT (template_id, criterion_id) DO NOTHING;

-- 7. KẾ HOẠCH KIỂM TRA THÁNG 11/2026 (APPROVED)
INSERT INTO inspection_plans (plan_code, title, start_date, end_date, status, created_by, approved_by, approved_at)
VALUES ('KH-202611-001', 'Kế hoạch kiểm soát chất lượng vận hành Tháng 11/2026', '2026-11-01', '2026-11-30', 'APPROVED',
       (SELECT id FROM users WHERE username = 'lead' LIMIT 1),
       (SELECT id FROM users WHERE username = 'manager' LIMIT 1),
       '2026-11-01 09:00:00+07')
ON CONFLICT (lower(plan_code)) DO NOTHING;

-- 8. PHÂN CÔNG KẾ HOẠCH CHO 6 NHÀ HÀNG
INSERT INTO inspection_plan_assignments (plan_id, restaurant_id, inspector_id, template_id, scheduled_date, sort_order)
SELECT p.id, r.id, u.id, t.id, '2026-11-15'::date, row_number() over ()
FROM org_units r
CROSS JOIN inspection_plans p
CROSS JOIN users u
CROSS JOIN inspection_templates t
WHERE r.unit_type = 'RESTAURANT'
  AND lower(p.plan_code) = 'kh-202611-001'
  AND u.username = 'inspector'
  AND lower(t.code) = 'mp-ksvh-70'
ON CONFLICT (plan_id, restaurant_id) DO NOTHING;
"""

process = subprocess.run(
    ["psql", "-U", "postgres", "-d", "ksvh_qc", "-c", sql_content],
    capture_output=True, text=True
)

print(process.stdout)
if process.stderr:
    print("Errors / Warnings:", process.stderr)
