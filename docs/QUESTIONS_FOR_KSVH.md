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

---

## Đối chiếu với tài liệu gốc `PM_KIEMSOATVANHANH_CHECK.pdf` (rà 18/11/2026)
Tài liệu PDF là **slide họp giới thiệu** (21/10/2026, 18 trang, có trang Hỏi & Đáp) nên chỉ trả lời được một phần.
Câu nào PDF đã trả lời thì **không cần hỏi lại**; câu còn lại vẫn gửi Phòng KSVH.

| Câu | PDF trả lời? | Căn cứ trong PDF | Kết luận |
|---|---|---|---|
| Q2 – lỗi nhiều lần trong một vòng | **Một phần** | s.13: "Quá hạn **hoặc** nghiệm thu chưa đạt → phần mềm tự cộng thêm 1 lần lỗi"; s.15: "Cộng **mọi** lần lỗi… trong kỳ" | Mỗi sự kiện +1 riêng. PDF **không nói** quá hạn và nghiệm thu chưa đạt **cùng một vòng** có +2 không → vẫn hỏi (phần mềm hiện: quá hạn mở vòng mới với hạn mới nên không +2 trong cùng vòng). |
| Q3 – tháng dương lịch hay số ngày | **Có** | s.15: đang tính tại **tháng 8**, kỳ 6 tháng = **"tháng 3 → tháng 8"**, lỗi T1, T2 ra khỏi kỳ | Đếm theo **tháng dương lịch, gồm tháng hiện tại** – đúng như phần mềm đang làm. **Đóng câu hỏi.** |
| Q4 – hạn khắc phục vòng mới | **Có (đã chốt)** | s.14: "Lỗi chốt Không đạt → Tần suất +1 → Điểm tăng → **Hạn rút ngắn**" | Hạn tính lại theo mức mới – khớp quyết định 17/11. |
| Q5 – hạn CHT phản hồi | **Không** | s.11 chỉ có "Phần mềm thông báo phiếu chấm cần xác nhận" | Vẫn hỏi. |
| Q6 – hội đồng thẩm định | **Một phần** | s.12: CHT "chọn **N** người thẩm định"; "Danh sách người thẩm định **có 1 đại diện KSVH**"; không thống nhất → "tổ chức họp". s.6: **OBM** "tham gia xem xét khiếu nại"; **Quản lý KSVH** "xem xét khiếu nại, **chủ trì họp thống nhất**" | Người xét = đại diện KSVH + OBM; Quản lý KSVH chủ trì họp và nhập kết luận – khớp phần mềm. **Còn hỏi:** N tối thiểu/tối đa (phần mềm đang 2–5), "có 1 đại diện KSVH" là **đúng 1** hay **ít nhất 1** (phần mềm đang ≥ 1), hạn xử lý khiếu nại. |
| Q7 – % tuân thủ, N/A | **Không** | s.1 chỉ là hình minh hoạ ("92% tuân thủ", "6 / 9 tiêu chí") và ghi rõ "**số liệu không phải dữ liệu thực tế**" | Vẫn hỏi. Gợi ý thêm từ s.14: "**Khiếu nại chốt → Đạt → Không tính**" ⇒ lỗi bị bỏ do khiếu nại đúng nên được tính như **Đạt** trong tỷ lệ tuân thủ (phần mềm giữ kết quả chấm gốc bất biến và tính "điểm sau khiếu nại" riêng – cần KSVH xác nhận hiển thị số nào). |
| Q8 – mã phiếu, kế hoạch nhiều phiếu | **Có (đã chốt)** | s.1: mã phiếu **`PER-2610-NH002-01`**; s.9: duyệt → "Tạo phiếu chấm" | Khớp mã `PER-<yyMM>-<mã NH>-<stt>` phần mềm đang sinh. |
| Q9 – kênh thông báo | **Không** | s.9, s.11 chỉ ghi "thông báo" | Vẫn hỏi (phần mềm đã có trong app + email/Zalo theo mặc định). |
| Q10 – video | **Một phần** | s.10: Không đạt "bắt buộc mô tả lỗi, **đính kèm ảnh / video**" | Video là bắt buộc hỗ trợ – phần mềm đã có. **Còn hỏi:** giới hạn dung lượng/thời lượng (đang 50 MB ≈ 60 giây), CHT/OBM dùng điện thoại hay máy tính. |
| Q11 – sửa sau khi gửi, chữ ký CHT | **Không** | s.10: "Hoàn tất đánh giá → Gửi kết quả" | Vẫn hỏi. |
| Q12 – biên bản M4 | **Một phần** | s.14: M4 Nghiêm trọng, hạn 1 ngày, hành động "**Lập biên bản, báo cáo lãnh đạo**" | Có biên bản là đúng PDF (phần mềm đã xuất PDF biên bản M4). **Còn hỏi:** tự gửi Ban Giám đốc hay chỉ tải về; ai ký. |

### Điểm PDF khác với phần mềm hiện tại (do người dùng đã quyết định – cần KSVH biết)
1. **Kỳ đếm**: PDF s.8 và s.15 ghi "**3 hoặc 6 tháng**"; phần mềm cho nhập **1–24 tháng** (theo yêu cầu người dùng 17/11, có nút chọn nhanh 3/6/12).
2. **Mẫu phiếu theo loại nhà hàng**: PDF s.8 ghi "theo **loại nhà hàng** / loại kiểm tra"; phần mềm đã **bỏ loại nhà hàng**, mẫu phiếu chỉ theo công ty
   (theo tài liệu Word "Ví dụ quy trình kiểm tra… YS-LTT", chốt 16/11).
3. **"Lỗi bị xóa"**: PDF s.12 ghi bỏ lỗi = "lỗi bị **xóa**"; phần mềm **không xoá dòng**, chỉ chuyển trạng thái "Đã bỏ" để giữ lịch sử
   (quy tắc bắt buộc số 4 của dự án) – kết quả nghiệp vụ giống nhau: không cộng tần suất, không phải khắc phục.
4. **GPS**: PDF s.10 "GPS kiểm tra tọa độ, bán kính khi bấm Bắt đầu" (xác thực); phần mềm hiện **chỉ ghi nhận**, không chặn
   (theo tài liệu Word, chốt 16/11 – cho phép nhà hàng chưa khai toạ độ và kiểm tra từ xa).

### Câu thực sự còn phải gửi Phòng KSVH
**Q2** (một phần) · **Q5** · **Q6** (N và "đúng 1 hay ít nhất 1" đại diện KSVH, hạn) · **Q7** · **Q9** · **Q10** (giới hạn) · **Q11** · **Q12** (tự gửi hay tải về)
– và xác nhận 4 điểm khác biệt ở trên. **Q3 đã đóng theo PDF.**

---

## Phương án TẠM ÁP DỤNG trong lúc chờ Phòng KSVH (chốt bởi người dùng 18/11/2026)
Nguyên tắc chọn: **không phạt nhà hàng khi chưa có sự đồng ý của người**, mọi con số đặt trong **cấu hình** (đổi không cần sửa code),
ghi rõ "tạm áp dụng" trên giao diện cấu hình. Khi KSVH trả lời khác → chỉ đổi cấu hình hoặc sửa nhỏ.

| Câu | Phương án tạm | Phần mềm hiện tại | Cần làm thêm |
|---|---|---|---|
| **Q2** Lỗi nhiều lần trong một vòng | Mỗi **vòng khắc phục** tối đa **+1**: quá hạn hoặc nghiệm thu chưa đạt đều mở vòng mới với hạn mới, nên không +2 trong cùng vòng. Lỗi cùng tiêu chí phát hiện ở **phiếu khác** (vd đột xuất) vẫn +1 riêng ("cộng mọi lần lỗi" – PDF s.15). | Đã đúng. | Thêm test chốt: cùng vòng không +2. |
| **Q5** Hạn CHT phản hồi | CHT có **3 ngày** (cấu hình `response-days`) để Xác nhận / Khiếu nại. Ngày 2: nhắc CHT. Quá hạn: **không tự xác nhận** (tránh +1 khi CHT chưa đồng ý); gắn nhãn "Quá hạn phản hồi", báo **OBM + Quản lý KSVH** để đôn đốc. Hạn khắc phục vẫn tính từ ngày phát hiện nên chậm phản hồi là thiệt cho nhà hàng. | **Chưa có** gì. | BE: cấu hình + job + sự kiện thông báo + cờ quá hạn trong API. FE: nhãn, bộ lọc, thẻ đếm trên dashboard. |
| **Q6** Hội đồng thẩm định | N = **2–5** người (cấu hình); **ít nhất 1** đại diện KSVH (PDF "có 1" hiểu là bắt buộc có); người chấm lỗi đó không được xét; mỗi lỗi **khiếu nại 1 lần**. Mỗi người thẩm định có **3 ngày** (cấu hình); hết hạn còn người chưa đánh giá → **tự chuyển sang họp** (Quản lý KSVH chủ trì) thay vì treo. | Có N cấu hình, ≥1 KSVH, loại người chấm. **Chưa có** hạn thẩm định. | BE: cấu hình `appeal-review-days`, job chuyển họp + thông báo. FE: hiện hạn thẩm định, người chưa đánh giá. |
| **Q7** % tuân thủ, N/A | % tuân thủ = Σ trọng số Đạt / Σ trọng số (Đạt + Không đạt) × 100, **N/A loại khỏi mẫu số**; trọng số = mức ảnh hưởng gốc. "x / y tiêu chí" = số Đạt / số tiêu chí đã chấm **trừ N/A**. Dashboard và báo cáo dùng **điểm sau khiếu nại** (lỗi bỏ do khiếu nại đúng = Đạt, PDF s.14); chi tiết phiếu hiện **cả hai** (khi chấm / sau khiếu nại). | Đã có `complianceScore` và `adjustedComplianceScore`. | Kiểm tra dashboard + 5 báo cáo đều dùng điểm sau khiếu nại; FE hiện cả hai trên chi tiết phiếu; thống nhất cách đếm "x / y". |
| **Q9** Kênh thông báo | **Trong ứng dụng**: luôn bật. **Email**: bật mặc định. **Zalo**: tắt mặc định tới khi đăng ký Zalo ZNS (cần tài khoản doanh nghiệp). **SMS**: không làm. Người dùng tự bật/tắt email, Zalo. | Đã có trong app + email + Zalo. | Đặt mặc định Zalo = tắt; ẩn Zalo nếu chưa cấu hình khoá ZNS. |
| **Q10** Video, thiết bị | Video ≤ **50 MB** và ≤ **60 giây**, mp4/mov; ảnh ≤ 10 MB. **CHT** dùng điện thoại (`/qc`); **OBM** dùng máy tính (`/admin`) để xem và thẩm định khiếu nại, có thể mở trên điện thoại. | Ảnh 10 MB; video theo agent ghi 50 MB. | Kiểm tra giới hạn video ở **server** (presign) chứ không chỉ ở giao diện; giới hạn thời lượng kiểm ở giao diện. |
| **Q11** Sửa sau khi gửi, chữ ký | Chuyên viên **không sửa** sau khi gửi (bất biến). Mất mạng: lưu nháp trên máy, gửi khi có mạng (đã có). Chấm nhầm: CHT **khiếu nại** (luồng sẵn có) – không mở đường sửa riêng. **Không cần chữ ký tại chỗ**: thao tác "Xác nhận" của CHT trên ứng dụng thay chữ ký (có người, thời điểm). | Đã đúng. | Không. Ghi rõ trong hướng dẫn sử dụng. |
| **Q12** Biên bản M4 | Lỗi được xác nhận/giữ ở mức **M4**: phần mềm **tự sinh biên bản PDF** và **tự thông báo** Ban Giám đốc + Quản lý KSVH (trong app + email), kèm link tải. Biên bản có ô ký Chuyên viên và CHT để **in ký tay** khi cần (không ký số). | Có PDF biên bản M4 + sự kiện cảnh báo M4. | Kiểm tra người nhận gồm cả BGĐ và Quản lý KSVH, có link tải biên bản; thời điểm gửi = khi lỗi chốt M4 (xác nhận / giữ lỗi / nâng lên M4). |

### 4 điểm khác PDF – giữ như hiện tại
1. Kỳ đếm 1–24 tháng (mặc định 6, chọn nhanh 3/6/12). 2. Mẫu phiếu theo công ty, không theo loại nhà hàng.
3. Bỏ lỗi = đổi trạng thái, không xoá dòng. 4. GPS ghi nhận, không chặn; phiếu ngoài bán kính bị **đánh dấu** trong danh sách và báo cáo để Quản lý xem xét.
