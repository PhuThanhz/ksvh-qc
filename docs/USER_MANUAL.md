# Sổ tay Hướng dẫn Sử dụng Hệ thống KSVH QC

Hệ thống Quản lý và Kiểm soát Vận hành (KSVH QC) chuẩn hoá toàn bộ quy trình kiểm soát chất lượng vận hành nhà hàng, từ lập kế hoạch, chấm điểm hiện trường bằng thiết bị di động, khiếu nại hội đồng thẩm định, theo dõi khắc phục đến báo cáo điều hành và phân tích rủi ro.

---

## 1. Phân quyền và Trách nhiệm theo 8 Vai trò

| Vai trò | Mã quyền | Trách nhiệm chính |
|---|---|---|
| **Quản trị hệ thống** | `SYSTEM_ADMIN` | Quản trị tài khoản người dùng, phân quyền vai trò, giám sát nhật ký kiểm toán hệ thống. |
| **Quản trị nghiệp vụ** | `BUSINESS_ADMIN` | Cấu hình danh mục công ty, nhà hàng, tổ chức, hồ sơ nhân viên. |
| **Trưởng nhóm KSVH** | `KSVH_LEAD` | Lập kế hoạch kiểm tra tháng, phân công chuyên viên, quản lý danh mục tiêu chí và mẫu phiếu. |
| **Quản lý KSVH** | `KSVH_MANAGER` | Phê duyệt kế hoạch kiểm tra tháng, chủ trì giải quyết bất đồng khiếu nại, giám sát báo cáo và hồ sơ rủi ro. |
| **Chuyên viên KSVH** | `KSVH_INSPECTOR` | Check-in GPS tại nhà hàng, chấm điểm tiêu chí, chụp ảnh vi phạm đóng dấu hiện trường, nghiệm thu kết quả khắc phục. |
| **Cửa hàng trưởng** | `STORE_MANAGER` | Ký xác nhận biên bản kiểm tra, khiếu nại lỗi vi phạm trong 24h, cập nhật phương án và bằng chứng khắc phục. |
| **Quản lý khu vực (OBM)** | `OBM` | Tham gia hội đồng thẩm định khiếu nại, đôn đốc nhà hàng khắc phục vi phạm, theo dõi xếp hạng khu vực. |
| **Ban Giám đốc** | `EXECUTIVE` | Xem bảng điều hành tổng hợp, nhận cảnh báo lỗi nghiêm trọng M4, theo dõi phân tích rủi ro và Pareto vi phạm. |

---

## 2. Quy trình Vận hành 6 Giai đoạn

### Giai đoạn 1: Lập Kế hoạch Kiểm tra Tháng & Phân công
- **Người thực hiện:** Trưởng nhóm KSVH (`KSVH_LEAD`).
- **Thao tác:**
  1. Vào menu **Kế hoạch kiểm tra** $\rightarrow$ bấm **Tạo kế hoạch mới**.
  2. Chọn tháng/năm, công ty và mẫu phiếu áp dụng.
  3. Chọn danh sách nhà hàng cần kiểm tra. Hệ thống tự động hiển thị thẻ cảnh báo nếu nhà hàng còn lỗi vi phạm tồn đọng chưa nghiệm thu.
  4. Phân công Chuyên viên KSVH phụ trách từng nhà hàng và chỉ định ngày kiểm tra dự kiến.
  5. Bấm **Gửi phê duyệt** để chuyển kế hoạch sang Quản lý KSVH.

### Giai đoạn 2: Phê duyệt Kế hoạch Kiểm tra
- **Người thực hiện:** Quản lý KSVH (`KSVH_MANAGER`).
- **Thao tác:**
  1. Nhận thông báo chuông hoặc email về kế hoạch mới chờ duyệt.
  2. Vào chi tiết kế hoạch kiểm tra để xem danh sách nhà hàng và chuyên viên được phân công.
  3. Chọn **Phê duyệt**: Hệ thống tự động tạo toàn bộ các phiếu kiểm tra định kỳ tương ứng cho các chuyên viên.
  4. Hoặc chọn **Từ chối**: Nhập lý do từ chối để Trưởng nhóm điều chỉnh lại.

### Giai đoạn 3: Thực hiện Chấm điểm Kiểm tra tại Hiện trường (Mobile)
- **Người thực hiện:** Chuyên viên KSVH (`KSVH_INSPECTOR`).
- **Thao tác trên điện thoại di động (`/qc`):**
  1. Đăng nhập vào hệ thống trên trình duyệt Safari / Chrome.
  2. Tại trang chủ mobile, chọn phiếu kiểm tra được phân công.
  3. **Check-in GPS:** Bấm nút check-in; hệ thống tự động đo khoảng cách thực tế giữa vị trí chuyên viên và toạ độ nhà hàng. Chuyên viên chỉ được chấm điểm khi nằm trong bán kính cho phép.
  4. **Chấm điểm tiêu chí:** Lướt qua từng nhóm tiêu chí. Với tiêu chí KHÔNG ĐẠT:
     - Chọn mức độ vi phạm.
     - Chụp ảnh bằng chứng trực tiếp bằng camera điện thoại. Hệ thống tự động gắn watermark (thời gian thực, toạ độ GPS, tên chuyên viên và tên nhà hàng).
     - Nhập mô tả lỗi vi phạm chi tiết.
  5. *Cơ chế lưu nháp ngoại tuyến:* Mọi thao tác chấm điểm được tự động lưu vào máy (`localStorage`). Nếu mất sóng hoặc tải lại trang, bài chấm không bị mất.
  6. Sau khi hoàn tất chấm tất cả tiêu chí $\rightarrow$ Cửa hàng trưởng ký tên xác nhận $\rightarrow$ Chuyên viên bấm **Nộp phiếu kiểm tra**.

### Giai đoạn 4: Xác nhận Biên bản & Quy trình Khiếu nại Hội đồng
- **Người thực hiện:** Cửa hàng trưởng (`STORE_MANAGER`), Hội đồng thẩm định (`KSVH` + `OBM`), Quản lý KSVH.
- **Thao tác:**
  1. Cửa hàng trưởng nhận thông báo biên bản kiểm tra mới.
  2. Có thời hạn **24 giờ** để xem xét từng lỗi vi phạm:
     - Nếu đồng ý: Bấm **Xác nhận lỗi**.
     - Nếu không đồng ý: Bấm **Khiếu nại**, nhập lý do, đính kèm ảnh phản biện và chọn Hội đồng thẩm định từ 2 đến 5 người (bắt buộc gồm đại diện KSVH và OBM, loại trừ chuyên viên đã chấm).
  3. **Thẩm định khiếu nại:** Từng thẩm định viên vào tab "Chờ tôi thẩm định" để bỏ phiếu:
     - 100% đồng thuận Bỏ lỗi $\rightarrow$ Lỗi được huỷ bỏ, tiêu chí chuyển thành ĐẠT.
     - 100% đồng thuận Giữ lỗi $\rightarrow$ Lỗi được giữ nguyên, tiếp tục quy trình khắc phục.
     - Có ý kiến bất đồng $\rightarrow$ Chuyển trạng thái **Họp khiếu nại**.
  4. **Chủ trì họp khiếu nại:** Quản lý KSVH chủ trì họp, ghi nhận biên bản và đưa ra phán quyết cuối cùng (Giữ nguyên lỗi hoặc Chấp nhận khiếu nại).

### Giai đoạn 5: Khắc phục Lỗi Vi phạm & Nghiệm thu Kết quả
- **Người thực hiện:** Cửa hàng trưởng & Chuyên viên KSVH.
- **Thao tác:**
  1. Cửa hàng trưởng cập nhật Phương án khắc phục và tải lên Ảnh bằng chứng đã hoàn thành trước thời hạn quy định (M1: 7 ngày, M2: 5 ngày, M3: 3 ngày, M4: 1 ngày).
  2. Bấm **Nộp kết quả khắc phục**.
  3. Chuyên viên KSVH kiểm tra bằng chứng (hoặc tạo phiếu Nghiệm thu `VERIFICATION` để tái kiểm tra thực tế):
     - **Nghiệm thu ĐẠT:** Lỗi được đóng (`CLOSED`).
     - **Nghiệm thu CHƯA ĐẠT:** Hệ thống tự động ghi nhận thêm 1 lần tần suất vi phạm và mở chu kỳ khắc phục mới.
  4. Nếu quá hạn khắc phục mà nhà hàng chưa hoàn thành, hệ thống tự động cộng +1 lần tần suất vi phạm.

### Giai đoạn 6: Báo cáo Thống kê & Phân tích Rủi ro
- **Người thực hiện:** Ban Giám đốc, Quản lý KSVH, Trưởng nhóm.
- **Tính năng:**
  1. **Báo cáo Tổng hợp tháng:** Xem tỷ lệ tuân thủ, số lỗi M1-M4, xuất file Excel tổng hợp.
  2. **Xếp hạng Nhà hàng:** Phân loại Xuất sắc, Tốt, Trung bình, Cần cải thiện.
  3. **Phân tích Pareto vi phạm:** Biểu đồ kết hợp cột và đường luỹ kế xác định 20% nguyên nhân gốc rễ gây ra 80% vi phạm.
  4. **Tiến độ Khắc phục & Năng suất Chuyên viên:** Giám sát thời gian hoàn thành, tỷ lệ đúng hạn.
  5. **Xuất PDF:**
     - Tải PDF Biên bản kiểm tra hoàn chỉnh kèm chữ ký số và hình ảnh.
     - Tải PDF Biên bản vi phạm đặc biệt nghiêm trọng M4 để trình Ban Giám đốc xử lý khẩn cấp.
  6. **Hồ sơ rủi ro Nhà hàng:** Xem lịch sử nâng/hạ mức của từng tiêu chí và ngày dự kiến được hạ mức.
  7. **Nhật ký hệ thống (Audit Log):** Tra cứu toàn bộ lịch sử các thao tác nhạy cảm trên hệ thống với đầy đủ thông tin IP, thời gian và dữ liệu chi tiết.
