#!/usr/bin/env python3
"""
Tạo 3 file Excel mẫu chuẩn nghiệp vụ KSVH QC:
1. docs/excel-templates/01_danh_muc_cong_ty_nha_hang.xlsx
2. docs/excel-templates/02_danh_muc_nhan_vien.xlsx
3. docs/excel-templates/03_danh_muc_70_tieu_chi_ksvh.xlsx
"""

import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

os.makedirs('docs/excel-templates', exist_ok=True)

header_fill = PatternFill(start_color='003A8C', end_color='003A8C', fill_type='solid')
header_font = Font(name='Arial', size=11, bold=True, color='FFFFFF')
title_font = Font(name='Arial', size=14, bold=True, color='003A8C')
regular_font = Font(name='Arial', size=10)
thin_border = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)

# -------------------------------------------------------------
# 1. FILE: Công ty & Nhà hàng
# -------------------------------------------------------------
wb1 = openpyxl.Workbook()

# Sheet Công ty
ws1_co = wb1.active
ws1_co.title = "Công ty"
ws1_co.append(["Mã công ty", "Tên công ty", "Hoạt động"])
for cell in ws1_co[1]:
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center', vertical='center')

companies_data = [
    ["GGG", "CÔNG TY CP THƯƠNG MẠI DỊCH VỤ CỔNG VÀNG (Golden Gate Group)", "Có"],
    ["REDSUN", "CÔNG TY CP ĐẦU TƯ THƯƠNG MẠI QUỐC TẾ MẶT TRỜI ĐỎ (Redsun ITI)", "Có"]
]
for row in companies_data:
    ws1_co.append(row)

# Sheet Nhà hàng - Phòng ban
ws1_unit = wb1.create_sheet(title="Nhà hàng - Phòng ban")
ws1_unit.append([
    "Mã đơn vị", "Tên đơn vị", "Mã công ty", "Loại đơn vị", "Địa chỉ",
    "Tài khoản CHT", "Tài khoản OBM", "Vĩ độ", "Kinh độ", "Bán kính GPS (m)", "Hoạt động"
])
for cell in ws1_unit[1]:
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center', vertical='center')

units_data = [
    ["KICHI-01", "Kichi-Kichi Vincom Đồng Khởi", "GGG", "Nhà hàng", "Tầng B3-01, Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM", "store", "obm", 10.7774, 106.7022, 100, "Có"],
    ["GOGI-01", "Gogi House Nguyễn Thị Thập", "GGG", "Nhà hàng", "521 Nguyễn Thị Thập, Tân Phong, Quận 7, TP.HCM", "store", "obm", 10.7381, 106.7115, 100, "Có"],
    ["MANWAH-01", "Manwah Taiwanese Hotpot Aeon Mall Tân Phú", "GGG", "Nhà hàng", "Tầng 1, Aeon Mall, 30 Bờ Bao Tân Thắng, Sơn Kỳ, Tân Phú, TP.HCM", "store", "obm", 10.8009, 106.6156, 120, "Có"],
    ["ISUSHI-01", "iSushi Buffet Nhật Bản Landmark 81", "GGG", "Nhà hàng", "Tầng B1, Vinhomes Central Park, 720A Điện Biên Phủ, Bình Thạnh, TP.HCM", "store", "obm", 10.7951, 106.7218, 100, "Có"],
    ["KBBQ-01", "King BBQ Diamond Plaza", "REDSUN", "Nhà hàng", "Tầng 4, Diamond Plaza, 34 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM", "store", "obm", 10.7801, 106.6994, 100, "Có"],
    ["HPS-01", "Hotpot Story Saigon Centre", "REDSUN", "Nhà hàng", "Tầng 5, Saigon Centre, 65 Lê Lợi, Bến Nghé, Quận 1, TP.HCM", "store", "obm", 10.7738, 106.7011, 100, "Có"],
    ["PK-SVH", "Phòng Kiểm Soát Vận Hành", "GGG", "Phòng ban", "Trụ sở Golden Gate Tower, 60 Giang Văn Minh, Ba Đình, Hà Nội", None, None, None, None, None, "Có"]
]
for row in units_data:
    ws1_unit.append(row)

wb1.save('docs/excel-templates/01_danh_muc_cong_ty_nha_hang.xlsx')

# -------------------------------------------------------------
# 2. FILE: Nhân viên
# -------------------------------------------------------------
wb2 = openpyxl.Workbook()
ws2 = wb2.active
ws2.title = "Nhân viên"
ws2.append(["Mã nhân viên", "Họ tên", "Chức danh", "Mã đơn vị", "Điện thoại", "Email", "Tài khoản đăng nhập", "Hoạt động"])
for cell in ws2[1]:
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center', vertical='center')

employees_data = [
    ["NV001", "Quản trị hệ thống", "Chuyên viên Quản trị Hệ thống", "PK-SVH", "0901234567", "admin@ksvh.vn", "admin", "Có"],
    ["NV002", "Quản trị nghiệp vụ", "Chuyên viên Quản lý Tiêu chuẩn F&B", "PK-SVH", "0902345678", "bizadmin@ksvh.vn", "bizadmin", "Có"],
    ["NV003", "Trưởng nhóm KSVH", "Trưởng nhóm Kiểm Soát Vận Hành", "PK-SVH", "0903456789", "lead@ksvh.vn", "lead", "Có"],
    ["NV004", "Quản lý KSVH", "Trưởng phòng KSVH & Đảm bảo Chất lượng", "PK-SVH", "0904567890", "manager@ksvh.vn", "manager", "Có"],
    ["NV005", "Chuyên viên KSVH 01", "Thanh tra viên KSVH", "PK-SVH", "0905678901", "inspector@ksvh.vn", "inspector", "Có"],
    ["NV006", "Cửa hàng trưởng Demo", "Cửa hàng trưởng Nhà hàng", "KICHI-01", "0906789012", "store@ksvh.vn", "store", "Có"],
    ["NV007", "Giám sát Vận hành OBM", "Giám sát Vận hành Vùng (OBM)", "PK-SVH", "0907890123", "obm@ksvh.vn", "obm", "Có"],
    ["NV008", "Đại diện Ban Giám đốc", "Phó Tổng Giám đốc Vận hành", "PK-SVH", "0908901234", "executive@ksvh.vn", "executive", "Có"]
]
for row in employees_data:
    ws2.append(row)

wb2.save('docs/excel-templates/02_danh_muc_nhan_vien.xlsx')

# -------------------------------------------------------------
# 3. FILE: 70 Tiêu chí Chuẩn KSVH F&B
# -------------------------------------------------------------
wb3 = openpyxl.Workbook()

# Sheet Nhóm tiêu chí
ws3_grp = wb3.active
ws3_grp.title = "Nhóm tiêu chí"
ws3_grp.append(["Mã nhóm", "Tên nhóm", "Thứ tự", "Mã công ty", "Hoạt động"])
for cell in ws3_grp[1]:
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center', vertical='center')

groups_data = [
    ["GRP-VSATTP", "Vệ sinh An toàn Thực phẩm (VSATTP)", 1, None, "Có"],
    ["GRP-CSVC", "Cơ sở vật chất & An toàn PCCC", 2, None, "Có"],
    ["GRP-BEP", "Quy trình chế biến & Vận hành Bếp", 3, None, "Có"],
    ["GRP-DV", "Tiêu chuẩn dịch vụ & Phục vụ khách hàng", 4, None, "Có"],
    ["GRP-BAR-POS", "Quản lý Quầy Bar, Thu ngân & An ninh", 5, None, "Có"]
]
for row in groups_data:
    ws3_grp.append(row)

# Sheet Tiêu chí (70 tiêu chí)
ws3_cri = wb3.create_sheet(title="Tiêu chí")
ws3_cri.append(["Mã tiêu chí", "Tên tiêu chí", "Mã nhóm", "Mức ảnh hưởng", "Cách kiểm tra", "Bằng chứng yêu cầu", "Thứ tự", "Hoạt động"])
for cell in ws3_cri[1]:
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center', vertical='center')

criteria_data = [
    # GRP-VSATTP (18 tiêu chí)
    ["TC-VS-01", "Thực phẩm sống/chín phân tách độc lập, có tem nhãn date rõ ràng", "GRP-VSATTP", 3, "Quan sát tủ trữ đông và bàn sơ chế thực phẩm", "Chụp ảnh tủ bảo quản và nhãn thực phẩm", 1, "Có"],
    ["TC-VS-02", "Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)", "GRP-VSATTP", 3, "Dùng nhiệt kế kiểm chuẩn đo nhiệt độ trung tâm tủ", "Chụp ảnh màn hình nhiệt kế", 2, "Có"],
    ["TC-VS-03", "Nhiệt độ tủ mát bảo quản thực phẩm chín đạt chuẩn (0°C đến 4°C)", "GRP-VSATTP", 3, "Dùng nhiệt kế kiểm chuẩn đo nhiệt độ tủ mát", "Chụp ảnh màn hình nhiệt kế", 3, "Có"],
    ["TC-VS-04", "Chất lượng dầu chiên đạt chuẩn, chỉ số phân cực TPM < 24%", "GRP-VSATTP", 2, "Dùng máy đo chất lượng dầu Testo", "Chụp ảnh màn hình máy đo hiển thị chỉ số", 4, "Có"],
    ["TC-VS-05", "Thớt và dao phân biệt màu sắc theo chủng loại thực phẩm (đỏ: thịt, xanh: rau)", "GRP-VSATTP", 2, "Kiểm tra khu sơ chế hải sản, thịt gia cầm, rau củ", "Chụp ảnh giá để dao thớt", 5, "Có"],
    ["TC-VS-06", "Thực phẩm rã đông đúng quy trình, không ngâm trực tiếp trong nước", "GRP-VSATTP", 3, "Quan sát phương pháp rã đông tại bồn rửa và tủ mát", "Chụp ảnh khay thực phẩm đang rã đông", 6, "Có"],
    ["TC-VS-07", "Tuyệt đối không sử dụng phụ gia hoặc phẩm màu ngoài danh mục Bộ Y Tế", "GRP-VSATTP", 4, "Kiểm tra kho gia vị và phụ gia tại bếp", "Chụp ảnh nhãn mác gia vị", 7, "Có"],
    ["TC-VS-08", "Mẫu lưu thực phẩm đủ định lượng và lưu tối thiểu 24 giờ", "GRP-VSATTP", 3, "Kiểm tra tủ lưu mẫu và nhật ký lưu mẫu thức ăn", "Chụp ảnh khay lưu mẫu và sổ ký", 8, "Có"],
    ["TC-VS-09", "Khăn lau bàn và khăn lau ly chén phân biệt và giặt khử trùng hàng ngày", "GRP-VSATTP", 1, "Kiểm tra thau ngâm khăn và giá phơi khăn", "Chụp ảnh khu giặt phơi khăn", 9, "Có"],
    ["TC-VS-10", "Dụng cụ chứa đựng thực phẩm làm bằng inox hoặc nhựa thực phẩm nguyên sinh", "GRP-VSATTP", 2, "Kiểm tra đáy hộp, khay GN và xô chậu trong bếp", "Chụp ảnh khay hộp", 10, "Có"],
    ["TC-VS-11", "Bồn rửa tay nhân viên có đầy đủ xà phòng diệt khuẩn, cồn sát khuẩn và khăn giấy", "GRP-VSATTP", 2, "Kiểm tra bồn rửa tay trước cửa bếp", "Chụp ảnh bồn rửa tay", 11, "Có"],
    ["TC-VS-12", "Nhân viên trực tiếp chế biến có giấy khám sức khỏe và tập huấn VSATTP còn hạn", "GRP-VSATTP", 3, "Kiểm tra hồ sơ lưu trữ nhân sự tại nhà hàng", "Chụp ảnh hồ sơ sức khỏe", 12, "Có"],
    ["TC-VS-13", "Khu vực thùng rác bếp có nắp đậy kín, đạp chân và lót túi rác đạt chuẩn", "GRP-VSATTP", 1, "Kiểm tra các vị trí thùng rác trong bếp", "Chụp ảnh thùng rác", 13, "Có"],
    ["TC-VS-14", "Hệ thống thoát nước sàn bếp có lưới chắn rác và bẫy mỡ định kỳ vệ sinh", "GRP-VSATTP", 2, "Mở nắp hố ga và bẫy mỡ kiểm tra độ đọng mỡ", "Chụp ảnh rãnh thoát nước và bẫy mỡ", 14, "Có"],
    ["TC-VS-15", "Không có dấu vết côn trùng, ruồi, gián, chuột trong khu vực kho và chế biến", "GRP-VSATTP", 3, "Kiểm tra góc tường, gầm kệ kho và bẫy dính", "Chụp ảnh khu vực nghi vấn", 15, "Có"],
    ["TC-VS-16", "Nước đá dùng cho đồ uống đảm bảo nguồn gốc nước đá sạch có kiểm nghiệm định kỳ", "GRP-VSATTP", 3, "Kiểm tra thùng trữ đá quầy bar và chứng từ giao nhận đá", "Chụp ảnh thùng đá và phiếu giao", 16, "Có"],
    ["TC-VS-17", "Gia vị và nước sốt pha chế trong ngày dán nhãn hạn sử dụng rõ ràng", "GRP-VSATTP", 2, "Kiểm tra chai lọ gia vị tại line ra đồ", "Chụp ảnh tem nhãn sốt", 17, "Có"],
    ["TC-VS-18", "Tủ cơm và thiết bị hấp giữ nhiệt trên 65°C trước khi phục vụ", "GRP-VSATTP", 2, "Đo nhiệt độ thực phẩm trong tủ giữ nóng", "Chụp ảnh nhiệt kế", 18, "Có"],

    # GRP-CSVC (15 tiêu chí)
    ["TC-VC-01", "Hệ thống hút mùi và bếp hoạt động ổn định, không khói mờ", "GRP-CSVC", 2, "Kiểm tra lưu lượng hút tại chụp hút và quạt tổng", "Chụp ảnh chụp hút và khu chế biến", 1, "Có"],
    ["TC-VC-02", "Đèn diệt côn trùng và bẫy chuột hoạt động đúng vị trí quy định", "GRP-CSVC", 2, "Kiểm tra vị trí đèn diệt côn trùng và nhật ký thay bẫy", "Chụp ảnh đèn và phiếu kiểm tra", 2, "Có"],
    ["TC-VC-03", "Bình chữa cháy còn hạn kiểm định, đồng hồ áp suất ở vạch xanh", "GRP-CSVC", 3, "Quan sát tem kiểm định và áp kế bình PCCC", "Chụp ảnh tem kiểm định và đồng hồ áp", 3, "Có"],
    ["TC-VC-04", "Lối thoát hiểm thông thoáng, đèn Exit và đèn chiếu sáng sự cố sáng tốt", "GRP-CSVC", 4, "Kiểm tra hành lang thoát hiểm và ngắt điện thử đèn Exit", "Chụp ảnh cửa thoát hiểm và đèn", 4, "Có"],
    ["TC-VC-05", "Hệ thống gas trung tâm có van ngắt tự động và còi báo rò rỉ gas hoạt động", "GRP-CSVC", 4, "Kiểm tra tủ điều khiển gas và đầu dò gas", "Chụp ảnh bảng điều khiển gas", 5, "Có"],
    ["TC-VC-06", "Sàn nhà khu vực khách và bếp khô ráo, không trơn trượt, có biển cảnh báo", "GRP-CSVC", 2, "Kiểm tra mặt sàn và gạch chống trượt", "Chụp ảnh mặt sàn", 6, "Có"],
    ["TC-VC-07", "Hệ thống điều hòa và quạt thông gió sảnh khách mát mẻ (23°C - 26°C)", "GRP-CSVC", 1, "Đo nhiệt độ trung tâm khu vực bàn khách", "Chụp ảnh nhiệt kế sảnh", 7, "Có"],
    ["TC-VC-08", "Bàn ghế, sofa, rèm cửa sạch sẽ, không rách, không lung lay ọp ẹp", "GRP-CSVC", 1, "Kiểm tra ngẫu nhiên 5 bộ bàn ghế", "Chụp ảnh bàn ghế", 8, "Có"],
    ["TC-VC-09", "Nhà vệ sinh khách sạch sẽ, không mùi hôi, đủ giấy vệ sinh và nước rửa tay", "GRP-CSVC", 2, "Kiểm tra bồn cầu, gương, lavabo nhà vệ sinh", "Chụp ảnh khu vệ sinh", 9, "Có"],
    ["TC-VC-10", "Hệ thống âm thanh phát nhạc đúng playlist chuẩn thương hiệu, âm lượng vừa phải", "GRP-CSVC", 1, "Nghe kiểm tra tại sảnh và quầy bar", "Chụp ảnh bảng điều khiển âm thanh", 10, "Có"],
    ["TC-VC-11", "Biển hiệu nhà hàng sáng đủ đèn, sạch sẽ, không rách bạt hoặc nứt vỡ", "GRP-CSVC", 2, "Quan sát mặt tiền nhà hàng vào buổi tối", "Chụp ảnh biển hiệu bên ngoài", 11, "Có"],
    ["TC-VC-12", "Tủ điện tổng có nắp che chắn, dán nhãn phân lộ aptomat rõ ràng", "GRP-CSVC", 3, "Kiểm tra tủ điện tổng và tiếp địa an toàn", "Chụp ảnh tủ điện mở nắp", 12, "Có"],
    ["TC-VC-13", "Bếp từ và bếp nướng tại bàn hoạt động tốt, không rò điện", "GRP-CSVC", 3, "Dùng bút thử điện kiểm tra vỏ bếp nướng/lẩu", "Chụp ảnh bút thử điện kiểm tra", 13, "Có"],
    ["TC-VC-14", "Dụng cụ sơ cứu y tế (băng gạc, sát trùng, bông, kéo) đầy đủ trong tủ thuốc", "GRP-CSVC", 1, "Kiểm tra tủ thuốc sơ cấp cứu nhà hàng", "Chụp ảnh tủ thuốc sơ cấp cứu", 14, "Có"],
    ["TC-VC-15", "Hệ thống lọc nước tinh khiết định kỳ thay lõi đúng lịch", "GRP-CSVC", 2, "Kiểm tra sổ theo dõi thay lõi lọc nước và đồng hồ áp", "Chụp ảnh hệ thống lọc nước", 15, "Có"],

    # GRP-BEP (15 tiêu chí)
    ["TC-BP-01", "Nhân viên bếp đeo khẩu trang, mũ trùm tóc và găng tay đúng quy cách", "GRP-BEP", 2, "Quan sát trực tiếp nhân viên bếp và line ra đồ", "Chụp ảnh nhân viên tại khu bếp", 1, "Có"],
    ["TC-BP-02", "Sổ ghi chép nhiệt độ thiết bị và kiểm thực 3 bước ký đủ ca hàng ngày", "GRP-BEP", 1, "Kiểm tra sổ theo dõi tại quầy sơ chế", "Chụp ảnh 2 trang sổ gần nhất", 2, "Có"],
    ["TC-BP-03", "Cân định lượng nguyên liệu chính xác theo định mức công thức chuẩn (SOP)", "GRP-BEP", 2, "Cân thử ngẫu nhiên 3 phần ăn chuẩn bị ra bàn", "Chụp ảnh cân hiển thị trọng lượng", 3, "Có"],
    ["TC-BP-04", "Nước dùng lẩu / nước dùng phở nấu đúng thời gian và vị chuẩn", "GRP-BEP", 2, "Thử vị và đo nồng độ khúc xạ kế Brix / nhiệt độ sôi", "Chụp ảnh nồi nước dùng", 4, "Có"],
    ["TC-BP-05", "Rau sống, rau lẩu được ngâm rửa qua 3 bước và quay ráo nước trước khi lên bàn", "GRP-BEP", 2, "Kiểm tra bồn rửa rau và máy quay vắt ráo rau", "Chụp ảnh rổ rau đã sơ chế", 5, "Có"],
    ["TC-BP-06", "Thịt bò/heo/cừu thái đúng độ dày quy định, không dập nát, bày đĩa chuẩn định dạng", "GRP-BEP", 1, "Kiểm tra khay thịt thành phẩm trên line", "Chụp ảnh đĩa thịt hoàn thiện", 6, "Có"],
    ["TC-BP-07", "Gia vị ướp tẩm chuẩn công thức, dán nhãn ca làm và người thực hiện", "GRP-BEP", 2, "Kiểm tra khay thịt ướp trong tủ trữ", "Chụp ảnh khay thực phẩm ướp", 7, "Có"],
    ["TC-BP-08", "Thời gian hoàn thành món ăn đúng quy chuẩn thời gian ca cao điểm (< 10 phút)", "GRP-BEP", 2, "Bấm giờ theo dõi từ lúc nhận order POS đến khi ra món", "Chụp ảnh màn hình KDS hiển thị thời gian", 8, "Có"],
    ["TC-BP-09", "Khu vực ra món (Pass đồ) sạch sẽ, thức ăn ra đĩa có chuông báo hoặc nắp đậy", "GRP-BEP", 1, "Quan sát bàn pass đồ và nhiệt độ món ăn", "Chụp ảnh bàn giao nhận món", 9, "Có"],
    ["TC-BP-10", "Dụng cụ ăn uống (chén, dĩa, thìa, đũa) rửa bằng máy sấy nhiệt độ đạt > 80°C", "GRP-BEP", 3, "Đo nhiệt độ tráng máy rửa bát công nghiệp", "Chụp ảnh đồng hồ nhiệt máy rửa bát", 10, "Có"],
    ["TC-BP-11", "Tuyệt đối không sử dụng bát đĩa sứt mẻ, ố vàng hoặc trầy xước nặng", "GRP-BEP", 1, "Kiểm tra ngẫu nhiên kho bát đĩa sạch", "Chụp ảnh bát đĩa trên kệ", 11, "Có"],
    ["TC-BP-12", "Hàng tồn kho cuối ca được bọc màng thực phẩm và kiểm kê đúng số lượng", "GRP-BEP", 2, "Kiểm tra tủ lưu trữ cuối ca làm việc", "Chụp ảnh tủ đồ tồn cuối ca", 12, "Có"],
    ["TC-BP-13", "Bếp trưởng hoặc Bếp phó trực tiếp kiểm tra món ăn trước khi chuyển ra phục vụ", "GRP-BEP", 1, "Quan sát quy trình kiểm duyệt tại bàn pass", "Chụp ảnh bếp trưởng kiểm tra đĩa thức ăn", 13, "Có"],
    ["TC-BP-14", "Dầu thừa thải bỏ được thu gom vào can riêng, không đổ trực tiếp ra cống", "GRP-BEP", 2, "Kiểm tra khu chứa can dầu mỡ thải", "Chụp ảnh can dầu thải", 14, "Có"],
    ["TC-BP-15", "Vệ sinh tổng thể khu bếp cuối ngày (tẩy sàn, cọ bếp, lau chụp hút) đúng checklist", "GRP-BEP", 2, "Kiểm tra hiện trường sau ca đóng cửa", "Chụp ảnh toàn cảnh bếp sau dọn dẹp", 15, "Có"],

    # GRP-DV (12 tiêu chí)
    ["TC-DV-01", "Nhân viên phục vụ mặc đồng phục sạch sẽ, đeo bảng tên, tác phong chỉn chu", "GRP-DV", 1, "Quan sát nhân viên tiếp đón và phục vụ bàn", "Chụp ảnh nhân viên sảnh", 1, "Có"],
    ["TC-DV-02", "Chào đón khách trong vòng 10 giây kể từ khi khách bước vào cửa nhà hàng", "GRP-DV", 1, "Quan sát tại quầy lễ tân / đón tiếp", "Chụp ảnh lễ tân đón khách", 2, "Có"],
    ["TC-DV-03", "Giới thiệu chương trình khuyến mãi và menu combo chuẩn xác cho khách", "GRP-DV", 1, "Lắng nghe nhân viên tư vấn gọi món tại bàn", "Chụp ảnh nhân viên tư vấn khách", 3, "Có"],
    ["TC-DV-04", "Đặt bàn chuẩn bị đủ chén đĩa, khăn ướt, đũa muỗng trước khi khách ngồi", "GRP-DV", 1, "Kiểm tra các bàn đã set-up sẵn", "Chụp ảnh bàn ăn set-up", 4, "Có"],
    ["TC-DV-05", "Châm thêm nước dùng lẩu / thay vỉ nướng chủ động không để khách phải gọi nhắc", "GRP-DV", 2, "Quan sát tần suất nhân viên chăm sóc bàn ăn", "Chụp ảnh nhân viên thay vỉ nướng", 5, "Có"],
    ["TC-DV-06", "Dọn dẹp đĩa trống tại bàn nhanh chóng, không để bàn ăn bừa bộn", "GRP-DV", 1, "Quan sát quy trình thu dọn bàn ăn trong ca", "Chụp ảnh bàn ăn của khách", 6, "Có"],
    ["TC-DV-07", "Xử lý phàn nàn của khách hàng nhã nhặn, đúng quy trình xử lý khủng hoảng (LAST)", "GRP-DV", 3, "Kiểm tra nhật ký ghi nhận phàn nàn và xử lý", "Chụp ảnh biên bản xử lý khiếu nại khách", 7, "Có"],
    ["TC-DV-08", "Hỏi thăm trải nghiệm của khách về chất lượng món ăn và dịch vụ trước khi về", "GRP-DV", 1, "Lắng nghe nhân viên chăm sóc khách lúc thanh toán", "Chụp ảnh nhân viên tiễn khách", 8, "Có"],
    ["TC-DV-09", "Cảm ơn và cúi chào khách khi khách ra về", "GRP-DV", 1, "Quan sát tại cửa ra vào nhà hàng", "Chụp ảnh nhân viên mở cửa chào khách", 9, "Có"],
    ["TC-DV-10", "Dọn bàn và set-up bàn mới trong vòng 3 phút sau khi khách rời bàn", "GRP-DV", 1, "Theo dõi thời gian dọn dẹp và set-up bàn", "Chụp ảnh bàn ăn mới hoàn tất", 10, "Có"],
    ["TC-DV-11", "Bảo quản tư trang của khách bỏ quên đúng quy trình ghi sổ Lost & Found", "GRP-DV", 2, "Kiểm tra tủ lưu đồ thất lạc và sổ nhật ký", "Chụp ảnh sổ Lost & Found", 11, "Có"],
    ["TC-DV-12", "Cung cấp ghế trẻ em và dụng cụ ăn uống cho trẻ em nhanh chóng khi có yêu cầu", "GRP-DV", 1, "Kiểm tra khu để ghế trẻ em sạch sẽ", "Chụp ảnh ghế trẻ em", 12, "Có"],

    # GRP-BAR-POS (10 tiêu chí)
    ["TC-TN-01", "Kiểm kê két tiền đầu ca và bàn giao quỹ tiền mặt chuẩn xác, khớp sổ sách", "GRP-BAR-POS", 3, "Kiểm tra biên bản bàn giao két tiền mặt", "Chụp ảnh sổ quỹ tiền mặt", 1, "Có"],
    ["TC-TN-02", "Mật khẩu tài khoản POS không được dán công khai hoặc dùng chung ca", "GRP-BAR-POS", 3, "Quan sát quầy thu ngân và màn hình POS", "Chụp ảnh khu vực máy POS", 2, "Có"],
    ["TC-TN-03", "Hóa đơn thanh toán in đủ chi tiết món, thuế VAT và thông tin khuyến mãi", "GRP-BAR-POS", 2, "Kiểm tra ngẫu nhiên 3 hóa đơn thanh toán", "Chụp ảnh bill thanh toán", 3, "Có"],
    ["TC-TN-04", "Không có sai lệch tiền mặt thực tế so với báo cáo tổng kết POS cuối ngày", "GRP-BAR-POS", 3, "Đối chiếu biên bản chốt ca và sao kê POS", "Chụp ảnh báo cáo Z-report", 4, "Có"],
    ["TC-TN-05", "Camera an ninh khu vực thu ngân và quầy bar hoạt động 24/7, góc nhìn chuẩn", "GRP-BAR-POS", 3, "Kiểm tra màn hình hiển thị camera tại phòng quản lý", "Chụp ảnh màn hình camera", 5, "Có"],
    ["TC-TN-06", "Syrup và nguyên liệu pha chế quầy Bar đậy kín nắp, dán nhãn hạn sử dụng", "GRP-BAR-POS", 2, "Kiểm tra kệ chai lọ syrup và tủ lạnh quầy bar", "Chụp ảnh chai lọ quầy bar", 6, "Có"],
    ["TC-TN-07", "Máy pha cà phê và máy xay sinh tố vệ sinh sạch sẽ sau mỗi lần sử dụng", "GRP-BAR-POS", 1, "Kiểm tra cối xay và vòi đánh sữa", "Chụp ảnh máy pha cafe", 7, "Có"],
    ["TC-TN-08", "Ly cốc quầy Bar lau bằng khăn chuyên dụng, úp ráo nước, không có mùi lạ", "GRP-BAR-POS", 1, "Kiểm tra kệ úp ly cốc và khăn lau quầy bar", "Chụp ảnh giá để ly", 8, "Có"],
    ["TC-TN-09", "Tuyệt đối không bán đồ uống có cồn cho người dưới 18 tuổi", "GRP-BAR-POS", 3, "Kiểm tra quy trình xác nhận độ tuổi của nhân viên", "Chụp ảnh biển thông báo quy định cồn", 9, "Có"],
    ["TC-TN-10", "Dụng cụ đong đếm (jigger, bình lắc shaker) tráng rửa sạch ngay sau khi pha chế", "GRP-BAR-POS", 1, "Quan sát bồn rửa quầy bar trong lúc pha chế", "Chụp ảnh dụng cụ pha chế", 10, "Có"]
]

for row in criteria_data:
    ws3_cri.append(row)

# Auto adjust column width
for ws in [ws3_grp, ws3_cri]:
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 50)

wb3.save('docs/excel-templates/03_danh_muc_70_tieu_chi_ksvh.xlsx')
print(f"✓ Đã tạo thành công 3 file Excel mẫu chuẩn tại docs/excel-templates/:")
print(f"  - 01_danh_muc_cong_ty_nha_hang.xlsx ({len(units_data)} đơn vị)")
print(f"  - 02_danh_muc_nhan_vien.xlsx ({len(employees_data)} nhân viên)")
print(f"  - 03_danh_muc_70_tieu_chi_ksvh.xlsx ({len(groups_data)} nhóm, {len(criteria_data)} tiêu chí)")
