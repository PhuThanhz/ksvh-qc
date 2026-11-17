# Phiếu Lấy Ý Kiến Nghiệp Vụ – Phòng Kiểm Soát Vận Hành (KSVH)

Tài liệu này tổng hợp 9 câu hỏi nghiệp vụ còn mở trong quá trình xây dựng hệ thống KSVH QC.
Kính gửi Phòng KSVH xem xét và cho ý kiến xác nhận đối với các giả định hiện tại của phần mềm.

---

### Câu hỏi Q2: Đếm tần suất vi phạm trong cùng một kỳ
* **Nội dung:** Một tiêu chí bị lỗi nhiều lần trong cùng tháng (chấm lại, nghiệm thu chưa đạt, quá hạn) thì tính tần suất như thế nào? Trong cùng một vòng, nếu vừa quá hạn khắc phục vừa bị nghiệm thu chưa đạt thì có bị phạt cộng dồn (+2) không?
* **Phần mềm đang làm theo giả định:**
  - Mỗi sự kiện vi phạm được ghi thành một bản ghi độc lập (`finding_occurrence`): `INSPECTION_FAIL` (chấm ban đầu không đạt), `OVERDUE` (quá hạn khắc phục), `VERIFY_FAILED` (nghiệm thu không đạt), `APPEAL_UPHELD` (bác khiếu nại, giữ lỗi).
  - Mỗi sự kiện đều tính +1 lần vi phạm. Nếu vừa quá hạn vừa nghiệm thu chưa đạt thì tính 2 lần (+2).
* **Ví dụ minh hoạ:** Nhà hàng A bị lỗi tiêu chí X vào ngày 01/03 (+1). Đến hạn 08/03 chưa nộp khắc phục $\rightarrow$ Job quá hạn phạt (+1). Ngày 10/03 nộp khắc phục nhưng Chuyên viên nghiệm thu không đạt $\rightarrow$ Phạt (+1). Tổng tần suất trong tháng = 3 lần.
* **Ý kiến Phòng KSVH:**
  - [ ] Đồng ý với giả định của phần mềm (+1 cho mỗi sự kiện vi phạm độc lập).
  - [ ] Mỗi chu kỳ khắc phục chỉ tính tối đa +1 lần vi phạm (quá hạn hoặc nghiệm thu chưa đạt).
  - [ ] Ý kiến khác: __________________________________________________________________

---

### Câu hỏi Q3: Cách xác định kỳ đếm tần suất cuốn chiếu
* **Nội dung:** Kỳ đếm tần suất để xét nâng mức rủi ro (ví dụ chu kỳ 6 tháng) được tính cuốn chiếu theo **tháng dương lịch** (ví dụ tháng 3 đến tháng 8) hay theo **số ngày chính xác** (180 ngày gần nhất tính từ ngày kiểm tra)?
* **Phần mềm đang làm theo giả định:**
  - Đang tính cuốn chiếu theo **tháng dương lịch**: Lấy từ ngày đầu tiên của tháng `(Tháng hiện tại - N tháng)` đến thời điểm đánh giá.
* **Ví dụ minh hoạ:** Kiểm tra ngày 20/08/2026 với chu kỳ 6 tháng: Phần mềm quét toàn bộ vi phạm từ ngày 01/03/2026 đến 20/08/2026 (trọn vẹn 6 tháng dương lịch T3, T4, T5, T6, T7, T8).
* **Ý kiến Phòng KSVH:**
  - [ ] Đồng ý tính theo trọn vẹn các tháng dương lịch.
  - [ ] Phải tính đúng chính xác 180 ngày gần nhất (`now - 180 ngày`).
  - [ ] Ý kiến khác: __________________________________________________________________

---

### Câu hỏi Q5: Thời hạn Cửa hàng trưởng (CHT) phản hồi lỗi
* **Nội dung:** Cửa hàng trưởng có giới hạn thời gian bắt buộc phải Xác nhận hoặc Khiếu nại lỗi sau khi Chuyên viên gửi phiếu chấm không? Nếu quá thời hạn đó mà CHT chưa phản hồi thì hệ thống xử lý thế nào?
* **Phần mềm đang làm theo giả định:**
  - Hiện tại chưa áp đặt thời hạn cưỡng chế; phiếu ở trạng thái `OPEN` chờ CHT thao tác; Chuyên viên và Quản lý KSVH có thể theo dõi danh sách để đôn đốc.
* **Ví dụ minh hoạ:** Phiếu nộp lúc 11:00 ngày 15/08. CHT có 24 giờ (đến 11:00 ngày 16/08) để phản hồi. Nếu không làm gì, hệ thống tự động xác nhận lỗi và bắt đầu tính hạn khắc phục.
* **Ý kiến Phòng KSVH:**
  - [ ] Giữ như hiện tại (không tự động chốt, để con người đôn đốc).
  - [ ] Quy định thời hạn 24 giờ: Hết 24 giờ tự động coi như CHT đã xác nhận lỗi.
  - [ ] Quy định thời hạn 48 giờ.
  - [ ] Ý kiến khác: __________________________________________________________________

---

### Câu hỏi Q6: Quy trình Hội đồng thẩm định khiếu nại
* **Nội dung:** CHT chọn người thẩm định từ danh sách nào? Số lượng tối thiểu/tối đa? Ai là người nhập kết luận khi họp thống nhất bất đồng? Có thời hạn xử lý khiếu nại không?
* **Phần mềm đang làm theo giả định:**
  - CHT chọn từ 2 đến 5 người thẩm định gồm các Trưởng nhóm/Quản lý KSVH và OBM phụ trách nhà hàng đó (loại trừ Chuyên viên đã chấm lỗi); bắt buộc phải có ít nhất 1 đại diện Phòng KSVH.
  - 100% đồng thuận $\rightarrow$ Tự động chốt kết quả (Bỏ lỗi hoặc Giữ lỗi).
  - Bất đồng ý kiến $\rightarrow$ Quản lý KSVH chủ trì họp thống nhất và nhập biên bản kết luận.
* **Ví dụ minh hoạ:** CHT chọn 1 Trưởng nhóm KSVH + 1 OBM. Nếu Trưởng nhóm KSVH bỏ phiếu "Lỗi đúng", OBM bỏ phiếu "Lỗi sai" $\rightarrow$ Hệ thống chuyển sang trạng thái "Họp khiếu nại" để Quản lý KSVH chủ trì chốt.
* **Ý kiến Phòng KSVH:**
  - [ ] Hoàn toàn đồng ý với quy trình hội đồng thẩm định và phân quyền hiện tại.
  - [ ] Cần bổ sung thời hạn thẩm định khiếu nại (ví dụ trong vòng 48 giờ phải có kết luận).
  - [ ] Ý kiến khác: __________________________________________________________________

---

### Câu hỏi Q7: Công thức tính Tỷ lệ Tuân thủ (%) và Tiêu chí N/A
* **Nội dung:** Điểm tuân thủ (%) trên Dashboard và Báo cáo tính như thế nào? Tiêu chí đánh giá N/A (không áp dụng) và tiêu chí có khiếu nại thành công (được bỏ lỗi) được xử lý ra sao?
* **Phần mềm đang làm theo giả định:**
  - $\text{Tỷ lệ Tuân thủ (\%)} = \frac{\sum \text{Trọng số tiêu chí Đạt (bao gồm cả lỗi đã bỏ do khiếu nại đúng)}}{\sum \text{Trọng số tiêu chí (Đạt + Không đạt)}} \times 100$.
  - Tiêu chí đánh giá `N/A` được loại bỏ hoàn toàn khỏi cả tử số và mẫu số.
  - Kết quả chấm gốc của Chuyên viên giữ nguyên là `FAIL` (bất biến dữ liệu lịch sử); hệ thống tính thêm trường `adjustedComplianceScore` (Điểm sau khiếu nại) cho phiếu.
* **Ví dụ minh hoạ:** Phiếu có 70 tiêu chí, tổng trọng số 150. Có 2 tiêu chí N/A (trọng số 6) $\rightarrow$ Mẫu số còn 144. Có 1 lỗi trọng số 4 được khiếu nại chấp thuận $\rightarrow$ Tính là đạt trong điểm sau khiếu nại.
* **Ý kiến Phòng KSVH:**
  - [ ] Hoàn toàn đồng ý với công thức tính điểm và cách loại trừ tiêu chí N/A.
  - [ ] Ý kiến khác: __________________________________________________________________

---

### Câu hỏi Q9: Kênh gửi thông báo và cấu hình mặc định
* **Nội dung:** Hệ thống gửi thông báo nhắc việc qua những kênh nào? Mặc định bật những kênh nào cho từng vai trò?
* **Phần mềm đang làm theo giả định:**
  - Chuông thông báo trong ứng dụng (In-app notification) luôn bật 100% cho mọi người dùng.
  - Kênh ngoài: Email HTML (chuẩn nhận diện KSVH) và Zalo ZNS (sẵn sàng tích hợp API). Mặc định bật gửi Email cho CHT và Quản lý KSVH; người dùng có thể tự cấu hình bật/tắt trong tài khoản cá nhân.
* **Ý kiến Phòng KSVH:**
  - [ ] Đồng ý kênh In-app + Email HTML + Zalo ZNS.
  - [ ] Cần tích hợp thêm tin nhắn SMS Brandname cho các cảnh báo sự cố khẩn cấp M4.
  - [ ] Ý kiến khác: __________________________________________________________________

---

### Câu hỏi Q10: Quy định về Bằng chứng Video và Thiết bị sử dụng
* **Nội dung:** Dung lượng và thời lượng tối đa cho mỗi video quay bằng chứng vi phạm? Cửa hàng trưởng và OBM chủ yếu sử dụng điện thoại hay máy tính?
* **Phần mềm đang làm theo giả định:**
  - Ảnh: Nén tự động tối đa 10MB, đóng dấu thời gian + toạ độ GPS + tên Chuyên viên + tên nhà hàng.
  - Video: Nhận định dạng MP4/MOV, dung lượng tối đa 50MB (khoảng 60 giây quay thực tế).
  - Hỗ trợ đầy đủ cả giao diện Web trên máy tính (`/admin`) lẫn giao diện Web Mobile / PWA trên điện thoại (`/qc`).
* **Ý kiến Phòng KSVH:**
  - [ ] Đồng ý mức giới hạn video 50MB (~60 giây).
  - [ ] Muốn tăng/giảm dung lượng video: _________________________________________________
  - [ ] Ý kiến khác: __________________________________________________________________

---

### Câu hỏi Q11: Chữ ký và tính bất biến của Biên bản kiểm tra
* **Nội dung:** Chuyên viên KSVH có được sửa kết quả chấm sau khi bấm nộp phiếu không? Có bắt buộc phải có chữ ký tay của Cửa hàng trưởng trên màn hình điện thoại tại thời điểm chấm không?
* **Phần mềm đang làm theo giả định:**
  - Phiếu chấm từ thời điểm nộp (`SUBMITTED`) là **bất biến tuyệt đối**. Không ai (kể cả Chuyên viên hay Quản trị viên) được sửa kết quả tiêu chí gốc.
  - Không dùng chữ ký vẽ tay trên màn hình cảm ứng (dễ nguệch ngoạc và khó xác thực pháp lý). Thay vào đó, CHT đăng nhập bằng tài khoản định danh riêng của mình trên ứng dụng để bấm nút "Xác nhận biên bản" hoặc "Khiếu nại", hệ thống lưu vết `acknowledged_by` và `acknowledged_at`.
* **Ý kiến Phòng KSVH:**
  - [ ] Hoàn toàn đồng ý với cơ chế xác thực qua tài khoản định danh của CHT.
  - [ ] Vẫn cần thêm ô vẽ chữ ký tay tại chỗ của CHT trước khi Chuyên viên rời nhà hàng.
  - [ ] Ý kiến khác: __________________________________________________________________

---

### Câu hỏi Q12: Xử lý sự cố vi phạm đặc biệt nghiêm trọng M4
* **Nội dung:** Khi phát hiện lỗi vi phạm M4 (nguy cơ ngộ độc thực phẩm, cháy nổ, đình chỉ hoạt động...), quy trình báo cáo lãnh đạo và lập biên bản xử lý như thế nào?
* **Phần mềm đang làm theo giả định:**
  - Hệ thống tự động kích hoạt cảnh báo khẩn cấp: Bắn chuông thông báo và gửi Email tức thì đến Trưởng phòng KSVH, OBM khu vực và Ban Giám đốc.
  - Tự động sinh Biên bản vi phạm M4 định dạng PDF chuẩn mẫu in, có sẵn mã số, thông tin sự cố, mô tả bằng chứng và khung ký duyệt của Ban Giám đốc.
* **Ý kiến Phòng KSVH:**
  - [ ] Đồng ý với quy trình cảnh báo tức thời và mẫu biên bản M4 PDF tự động.
  - [ ] Ý kiến khác: __________________________________________________________________

---

**Đại diện Phòng KSVH ký xác nhận:**  
*(Ký, ghi rõ họ tên và ngày xác nhận)*
