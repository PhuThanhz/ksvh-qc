# Kịch Bản & Checklist Nghiệm Thu Người Dùng (UAT)
## Hệ Thống Kiểm Soát Vận Hành (KSVH QC)

Tài liệu kiểm thử nghiệm thu người dùng theo 6 bước quy trình vận hành chuẩn (PDF quy định Phòng KSVH) dành cho 6 nhóm vai trò:
1. **Trưởng nhóm KSVH (`KSVH_LEAD`)**
2. **Quản lý KSVH (`KSVH_MANAGER`)**
3. **Chuyên viên KSVH (`KSVH_INSPECTOR`)**
4. **Cửa hàng trưởng (`STORE_MANAGER`)**
5. **Quản lý Vận hành Khu vực (`OBM`)**
6. **Ban Giám đốc (`EXECUTIVE`)**

---

### BƯỚC 1: Lập Kế Hoạch & Phân Công Kiểm Tra

| STT | Vai trò | Thao tác thực hiện | Kết quả mong đợi | Kết quả kiểm thử |
|---|---|---|---|:---:|
| 1.1 | Trưởng nhóm KSVH | Đăng nhập tài khoản `lead` / `Admin@123`, truy cập menu **Kế hoạch kiểm tra**, bấm **"Tạo kế hoạch mới"**, chọn tháng, công ty, thêm các dòng phân công nhà hàng + Chuyên viên + mẫu phiếu chấm. | Kế hoạch được tạo ở trạng thái **Dự thảo (`DRAFT`)**, hiển thị đúng danh sách các phân công. Cảnh báo lỗi tồn đọng tháng trước (`PriorFindingsWarning`) hiển thị trực quan nếu nhà hàng còn lỗi chưa nghiệm thu. | [ ] Đạt<br>[ ] Chưa đạt |
| 1.2 | Trưởng nhóm KSVH | Bấm nút **"Gửi duyệt kế hoạch"**. | Trạng thái kế hoạch chuyển sang **Chờ duyệt (`PENDING_APPROVAL`)**. Hệ thống gửi chuông thông báo và email đến Quản lý KSVH. | [ ] Đạt<br>[ ] Chưa đạt |
| 1.3 | Quản lý KSVH | Đăng nhập tài khoản `manager` / `Admin@123`, mở kế hoạch chờ duyệt, bấm **"Phê duyệt kế hoạch"**. | Kế hoạch chuyển sang **Đã duyệt (`APPROVED`)**. Hệ thống tự động sinh các phiếu kiểm tra định kỳ mã `PER-<yyMM>-<mã NH>-<stt>` và gửi thông báo giao việc đến từng Chuyên viên KSVH. | [ ] Đạt<br>[ ] Chưa đạt |

---

### BƯỚC 2: Chuyên Viên KSVH Chấm Điểm Hiện Trường

| STT | Vai trò | Thao tác thực hiện | Kết quả mong đợi | Kết quả kiểm thử |
|---|---|---|---|:---:|
| 2.1 | Chuyên viên KSVH | Đăng nhập tài khoản `inspector` / `Admin@123` trên trình duyệt điện thoại (`/qc`), xem danh sách việc chấm, chọn phiếu kiểm tra được giao. | Màn hình hiển thị thông tin nhà hàng, loại kiểm tra và mẫu phiếu chấm. Nút **"Bắt đầu kiểm tra (GPS)"** sẵn sàng. | [ ] Đạt<br>[ ] Chưa đạt |
| 2.2 | Chuyên viên KSVH | Bấm **"Bắt đầu kiểm tra"**. | Trình duyệt yêu cầu quyền truy cập GPS. Hệ thống tính khoảng cách thực tế tới nhà hàng, gắn nhãn vị trí (`VERIFIED` nếu $\le 150m$ hoặc `OUTSIDE_RADIUS`), chuyển trạng thái phiếu sang **Đang chấm (`IN_PROGRESS`)**. | [ ] Đạt<br>[ ] Chưa đạt |
| 2.3 | Chuyên viên KSVH | Đánh giá từng tiêu chí: Chọn **Đạt**, **Không đạt** (bắt buộc chụp ảnh và ghi chú mô tả), hoặc **N/A** (bắt buộc ghi lý do ngoại cảnh). | Ảnh chụp được tự động nén, gắn watermark (thời gian, toạ độ GPS, chuyên viên, nhà hàng) và tải lên kho MinIO. Hỗ trợ quay video ngắn $\le 50MB$. | [ ] Đạt<br>[ ] Chưa đạt |
| 2.4 | Chuyên viên KSVH | Thử ngắt kết nối mạng (Bật chế độ máy bay) khi đang chấm và chụp ảnh/video. | Hệ thống thông báo banner màu cam: *"⚠️ Đang offline. Dữ liệu và ảnh được lưu nháp an toàn trên máy"*. Ảnh được lưu vào hàng đợi IndexedDB, không làm mất dữ liệu. | [ ] Đạt<br>[ ] Chưa đạt |
| 2.5 | Chuyên viên KSVH | Bật lại mạng Internet và bấm **"Hoàn thành & Nộp phiếu chấm"**. | Ảnh/video ngoại tuyến tự động đồng bộ lên máy chủ. Nút nộp phiếu chỉ kích hoạt khi đã đồng bộ xong 100%. Phiếu chuyển sang **Đã nộp (`SUBMITTED`)**, tự động tính điểm tuân thủ và sinh các lỗi vi phạm (`Finding`). | [ ] Đạt<br>[ ] Chưa đạt |

---

### BƯỚC 3: Cửa Hàng Trưởng Xác Nhận Biên Bản & Khiếu Nại

| STT | Vai trò | Thao tác thực hiện | Kết quả mong đợi | Kết quả kiểm thử |
|---|---|---|---|:---:|
| 3.1 | Cửa hàng trưởng | Đăng nhập tài khoản `store` / `Admin@123` trên điện thoại hoặc máy tính. Xem thông báo chuông và email thông báo có kết quả kiểm tra mới. | Nhận được thông báo đầy đủ. Mục **"Việc của tôi"** hiển thị danh sách các lỗi vi phạm cần xử lý của nhà hàng. | [ ] Đạt<br>[ ] Chưa đạt |
| 3.2 | Cửa hàng trưởng | Đối với lỗi vi phạm đúng thực tế: Bấm **"Xác nhận lỗi"**. | Lỗi chuyển sang trạng thái **Đã xác nhận (`CONFIRMED`)**, tăng tần suất vi phạm (+1). Chuyển sang giai đoạn lập kế hoạch khắc phục. | [ ] Đạt<br>[ ] Chưa đạt |
| 3.3 | Cửa hàng trưởng | Đối với lỗi do yếu tố khách quan: Bấm **"Khiếu nại"**, nhập lý do, đính kèm ảnh bằng chứng giải trình, và chọn Hội đồng thẩm định ($N \in [2, 5]$ người gồm đại diện KSVH và OBM). | Lỗi chuyển sang trạng thái **Đang khiếu nại (`APPEALED`)**. Không bị tăng tần suất. Hệ thống gửi thông báo mời thẩm định đến các thành viên trong hội đồng. | [ ] Đạt<br>[ ] Chưa đạt |
| 3.4 | Cửa hàng trưởng | Đối với phiếu kiểm tra đạt 100% không có lỗi vi phạm: Bấm **"Xác nhận đã xem"**. | Phiếu kiểm tra chuyển ngay sang trạng thái **Hoàn thành (`COMPLETED`)**. Lưu vết người và thời điểm xác nhận. | [ ] Đạt<br>[ ] Chưa đạt |

---

### BƯỚC 4: Hội Đồng Xử Lý Khiếu Nại

| STT | Vai trò | Thao tác thực hiện | Kết quả mong đợi | Kết quả kiểm thử |
|---|---|---|---|:---:|
| 4.1 | Thẩm định viên (KSVH & OBM) | Đăng nhập tài khoản `lead` / `obm`, mở tab **"Chờ tôi thẩm định"**, xem giải trình và bằng chứng của CHT, bấm **"Đánh giá khiếu nại"** (chọn *Lỗi đúng* hoặc *Lỗi sai* kèm ý kiến). | Ý kiến đánh giá được ghi nhận vào biên bản thẩm định. Hệ thống hiển thị tiến độ bỏ phiếu của hội đồng. | [ ] Đạt<br>[ ] Chưa đạt |
| 4.2 | Hệ thống tự động | Trường hợp 100% thành viên bỏ phiếu *Lỗi sai* (Chấp thuận khiếu nại). | Lỗi chuyển sang **Bỏ lỗi (`DISMISSED`)**, không bị phạt tần suất, không phải khắc phục. Kết quả chấm gốc của Chuyên viên giữ nguyên `FAIL` (bất biến), điểm tuân thủ sau khiếu nại được tự động tính lại. | [ ] Đạt<br>[ ] Chưa đạt |
| 4.3 | Hệ thống tự động | Trường hợp 100% thành viên bỏ phiếu *Lỗi đúng* (Bác khiếu nại). | Lỗi chuyển sang **Đã xác nhận (`CONFIRMED`)**, tần suất +1. Hạn khắc phục được tính lại từ ngày chốt để nhà hàng không bị phạt quá hạn oan. | [ ] Đạt<br>[ ] Chưa đạt |
| 4.4 | Quản lý KSVH | Trường hợp có bất đồng ý kiến (người chọn Đạt, người chọn Không đạt): Trạng thái chuyển sang **Họp khiếu nại (`APPEAL_MEETING`)**. Quản lý KSVH chủ trì họp và bấm **"Kết luận khiếu nại"** kèm biên bản họp. | Lỗi được chốt kết luận dứt điểm theo quyết định của Quản lý KSVH. Ghi nhật ký kiểm toán và thông báo kết quả cho CHT. | [ ] Đạt<br>[ ] Chưa đạt |

---

### BƯỚC 5: Khắc Phục Lỗi & Nghiệm Thu

| STT | Vai trò | Thao tác thực hiện | Kết quả mong đợi | Kết quả kiểm thử |
|---|---|---|---|:---:|
| 5.1 | Cửa hàng trưởng | Mở lỗi đã xác nhận, bấm **"Lập kế hoạch khắc phục"**, nhập biện pháp xử lý và chọn ngày hẹn hoàn thành (không được vượt hạn tối đa của mức rủi ro). | Lỗi chuyển sang trạng thái **Đang khắc phục (`REMEDIATING`)**. Cập nhật hạn hẹn khắc phục. | [ ] Đạt<br>[ ] Chưa đạt |
| 5.2 | Cửa hàng trưởng | Sau khi xử lý xong tại nhà hàng: Bấm **"Gửi bằng chứng khắc phục"**, chụp/tải ảnh hoặc video sau khắc phục. | Lỗi chuyển sang trạng thái **Chờ nghiệm thu (`PENDING_VERIFICATION`)**. Hệ thống gửi thông báo cho Chuyên viên KSVH. | [ ] Đạt<br>[ ] Chưa đạt |
| 5.3 | Chuyên viên KSVH | Chuyên viên vào kiểm tra bằng chứng (hoặc tạo phiếu kiểm tra kết quả khắc phục `VERIFICATION`): Chấm **Nghiệm thu Đạt**. | Lỗi vi phạm chuyển sang **Đã đóng (`CLOSED`)**. Khi tất cả các lỗi trong phiếu đã đóng $\rightarrow$ Phiếu kiểm tra chuyển sang **Hoàn thành (`COMPLETED`)**. | [ ] Đạt<br>[ ] Chưa đạt |
| 5.4 | Chuyên viên KSVH | Trường hợp khắc phục chưa triệt để: Chấm **Nghiệm thu Chưa đạt**. | Hệ thống tự động phạt **tần suất +1** vi phạm, mở chu kỳ khắc phục mới, yêu cầu CHT lập lại kế hoạch. | [ ] Đạt<br>[ ] Chưa đạt |
| 5.5 | Hệ thống tự động (Job) | Đến 00:05 sáng hàng ngày, nếu lỗi quá hạn mà chưa gửi bằng chứng nghiệm thu đạt. | Job `FindingOverdueJob` tự động phạt **tần suất +1**, tính lại điểm rủi ro, cấp hạn mới ở tương lai và ghi nhật ký hệ thống. | [ ] Đạt<br>[ ] Chưa đạt |

---

### BƯỚC 6: Báo Cáo, Hồ Sơ Rủi Ro & Điều Hành

| STT | Vai trò | Thao tác thực hiện | Kết quả mong đợi | Kết quả kiểm thử |
|---|---|---|---|:---:|
| 6.1 | Ban Giám đốc & Quản lý | Truy cập menu **Báo cáo & Thống kê**, lọc theo khoảng ngày, công ty. Xem 5 tab báo cáo điều hành. | Hiển thị đầy đủ: 1. Tổng hợp tháng, 2. Xếp hạng nhà hàng, 3. Biểu đồ Pareto 80/20, 4. Tiến độ khắc phục, 5. Năng suất chuyên viên. Dữ liệu chuẩn xác, biểu đồ trực quan. | [ ] Đạt<br>[ ] Chưa đạt |
| 6.2 | Ban Giám đốc & Quản lý | Bấm nút **"Xuất Excel"** tại từng tab báo cáo. | File Excel `.xlsx` tải về ngay lập tức, định dạng kẻ bảng chuyên nghiệp, có dòng Tổng cộng và logo KSVH. | [ ] Đạt<br>[ ] Chưa đạt |
| 6.3 | Bất kỳ vai trò đủ quyền | Mở chi tiết phiếu kiểm tra bất kỳ, bấm **"Tải PDF"**. | Tải về file PDF phiếu kiểm tra đầy đủ thông tin, tọa độ GPS, kết quả từng tiêu chí, ảnh vi phạm và chữ ký hai bên. Tiếng Việt hiển thị chuẩn đẹp bằng font **Be Vietnam Pro**. | [ ] Đạt<br>[ ] Chưa đạt |
| 6.4 | Ban Giám đốc | Khi phát sinh lỗi vi phạm đặc biệt nghiêm trọng M4: Mở chi tiết lỗi, bấm **"Biên bản M4 (PDF)"**. | Tải về biên bản sự cố khẩn cấp M4 có tiêu đề đỏ, mô tả chi tiết và khung ký phê duyệt của Ban Giám đốc. | [ ] Đạt<br>[ ] Chưa đạt |
| 6.5 | Quản lý KSVH | Truy cập menu **Hồ sơ rủi ro nhà hàng**, chọn 1 nhà hàng bất kỳ để xem lịch sử tích lũy rủi ro. | Hiển thị hồ sơ rủi ro từng tiêu chí, mức gốc vs mức hiệu lực, số tháng sạch lỗi và ngày dự kiến được tự động hạ mức về ban đầu. | [ ] Đạt<br>[ ] Chưa đạt |

---

### KẾT LUẬN NGHIỆM THU TỔNG THỂ

* **Tổng số kịch bản kiểm thử:** 21 kịch bản
* **Số kịch bản ĐẠT:** ______ / 21
* **Số kịch bản CHƯA ĐẠT:** ______ / 21
* **Đánh giá chung của Hội đồng Nghiệm thu:**  
  [ ] Hệ thống đáp ứng đầy đủ yêu cầu kỹ thuật và quy trình vận hành kiểm soát chất lượng.  
  [ ] Cho phép đưa vào vận hành thử nghiệm (Pilot 1 tháng) tại các cụm nhà hàng chỉ định.  

| Đại diện Phòng KSVH | Đại diện Vận hành (OBM) | Đại diện Ban Giám đốc |
|:---:|:---:|:---:|
| *(Ký, ghi rõ họ tên)* | *(Ký, ghi rõ họ tên)* | *(Ký, ghi rõ họ tên)* |
