# Đề xuất cải thiện logic nghiệp vụ và phần Cấu hình

> Ngày lập: 20/11/2026. Trạng thái: **đề xuất, chưa triển khai** – cần Phòng KSVH và Ban Giải pháp duyệt.
> Căn cứ đối chiếu: [PM_KIEMSOATVANHANH_CHECK.pdf](PM_KIEMSOATVANHANH_CHECK.pdf), file Word "Ví dụ quy trình kiểm tra … YS-LTT", file Excel "Câu hỏi check list 70 điểm", và code tại commit `876eec0`.
> Đọc kèm: [DOMAIN_SPEC.md](DOMAIN_SPEC.md) §6, §8 và [RISK_SCORING.md](RISK_SCORING.md).
> Mọi con số trong tài liệu này là **ví dụ để thảo luận**, không phải quy định. Số chính thức do Phòng KSVH quyết định.

---

## 1. Tóm tắt

Luồng 5 bước và cơ chế cấu hình (phiên bản theo ngày hiệu lực, đếm tần suất từ bảng lần lỗi, một chỗ tính duy nhất) đã làm chắc. Vấn đề nằm ở chỗ **bộ số mặc định và mô hình điểm chưa được thử trên 70 tiêu chí thật**, và có **hai lỗ hổng trong luồng xử lý lỗi**.

| # | Vấn đề | Mức độ | Đề xuất | Loại thay đổi |
|---|---|---|---|---|
| 1 | Hai lỗ hổng luồng: quá hạn cộng điểm không giới hạn; CHT không phản hồi thì thoát | Cao | §3.1, §3.2 | Code + schema |
| 2 | Bảng mức không phân biệt được 70 tiêu chí; M1 không bao giờ xảy ra | Cao | §4.1, §4.2 | Quyết định nghiệp vụ + cấu hình |
| 3 | Lỗi nặng lần đầu chỉ ra M2, hạn 30 ngày | Cao | §4.3 | Schema + code |
| 4 | Nâng mức vô hiệu với 42/70 tiêu chí | Trung bình | §4.4 | Quyết định nghiệp vụ + code |
| 5 | Danh mục tiêu chí thiếu "Tần suất kiểm soát" và "Bộ phận" | Trung bình | §5 | Schema + code |
| 6 | Màn cấu hình thiếu kiểm tra và mô phỏng trên dữ liệu thật | Trung bình | §6 | Code |
| 7 | Dữ liệu dev chỉ có 9 tiêu chí ví dụ | Thấp | §7 | Dữ liệu mẫu + test |
| 8 | Ngày ghi nhận lần lỗi, thay phiên bản cùng ngày | Thấp | §8 | Code |

---

## 2. Số liệu làm căn cứ

### 2.1 Phân bố mức ảnh hưởng trong 70 tiêu chí thật

| Mức ảnh hưởng | Số tiêu chí |
|---|---|
| 5 | 42 |
| 4 | 26 |
| 3 | 2 |
| 1–2 | 0 |

### 2.2 Đường đi của một tiêu chí với cấu hình mặc định

Cấu hình: kỳ đếm 6 tháng, ngưỡng nâng 3 lần, +1 bậc, trần 5; bảng mức M1 [0,1), M2 [1,6), M3 [6,12), M4 ≥ 12.

| Ảnh hưởng gốc | Lần 1 | Lần 2 | Lần 3 |
|---|---|---|---|
| 5 | 5 → M2, 30 ngày | 10 → M3, 7 ngày | 15 → M4, 1 ngày |
| 4 | 4 → M2 | 8 → M3 | nâng lên 5: 15 → M4 |
| 3 | 3 → M2 | 6 → M3 | nâng lên 4: 12 → M4 |

Hệ quả: cả 70 tiêu chí đi cùng một đường M2 → M3 → M4; M1 không dùng tới; mức ảnh hưởng gần như không còn tác dụng phân loại.

### 2.3 Một lỗi ảnh hưởng 5 không được khắc phục

Job quá hạn cộng 1 lần lỗi rồi đặt hạn mới theo mức mới (`FindingRemediationService.markOverdueFindings`).

| Ngày | Sự kiện | Tần suất | Điểm | Mức | Hạn mới |
|---|---|---|---|---|---|
| 0 | CHT xác nhận | 1 | 5 | M2 | ngày 30 |
| 31 | Quá hạn | 2 | 10 | M3 | ngày 38 |
| 39 | Quá hạn | 3 | 15 | M4 | ngày 40 |
| 41 | Quá hạn | 4 | 20 | M4 | ngày 42 |
| 43, 45, … | Cứ 2 ngày một lần | +1 mỗi lần | +5 mỗi lần | M4 | +1 ngày |
| 61 | – | khoảng 14 | khoảng 70 | M4 | – |

Các lần cộng này nằm trong kỳ đếm 6 tháng, nên lần kiểm tra sau nếu tiêu chí này lỗi lại, tần suất bắt đầu từ khoảng 15 chứ không phải 2.

### 2.4 Ba tài liệu chưa thống nhất

| Nội dung | PDF (code đang theo) | Word / Excel |
|---|---|---|
| Thừa số thứ hai | Số lần lỗi đếm trong kỳ, không giới hạn | "Khả năng" thang 1–5 |
| Điểm tối đa | Không có trần | 20–25 |
| Ngưỡng mức | 1 → M2, 6 → M3, 12 → M4 | 1 = M1, 6 = M2, 12 = M3, 20 = M4 |
| Tái phạm | Nâng bậc ảnh hưởng | Hệ số 1,00 / 1,25 / 1,50 / 2,00 |
| Hạ mức | Sau một kỳ hạ (ví dụ 6 tháng) không lỗi | Sau 2 kỳ liên tiếp không tái phạm |

---

## 3. Ưu tiên 1 – Vá hai lỗ hổng luồng xử lý lỗi

### 3.1 Giới hạn số lần cộng do quá hạn

**Hiện trạng:** không có trần, xem §2.3. "Tần suất" biến thành "số ngày trễ hạn".

**Đề xuất:**

1. Thêm tham số cấu hình **"Số lần cộng tối đa do quá hạn cho một lỗi"** (ví dụ 1 hoặc 2).
2. Khi lỗi đã chạm trần: không cộng thêm lần lỗi, giữ trạng thái quá hạn, gửi thông báo leo thang cho Quản lý KSVH và OBM, và hiển thị số ngày trễ trên dashboard.
3. Không tính quá hạn cho lỗi đang **chờ nghiệm thu** (`PENDING_VERIFICATION`): lúc này nhà hàng đã gửi bằng chứng, việc chậm thuộc về Chuyên viên. Thay bằng nhắc việc cho Chuyên viên.

**Phương án khác đã cân nhắc:** hạn mới tối thiểu N ngày cho mỗi vòng. Đơn giản hơn nhưng vẫn cộng mãi, chỉ chậm hơn.

**Cần KSVH chốt:** trần là mấy lần; ai nhận thông báo leo thang; mục 3 có đồng ý không (đang là câu hỏi mở trong [RISK_SCORING.md](RISK_SCORING.md) §9).

### 3.2 Hạn phản hồi cho Cửa hàng trưởng

**Hiện trạng:** lỗi ở trạng thái `OPEN` không có hạn. Job quá hạn chỉ xét `CONFIRMED`, `REMEDIATING`, `PENDING_VERIFICATION`. CHT không bấm gì thì lỗi không cộng tần suất, không chạy hạn khắc phục, phiếu không bao giờ hoàn thành. Đây là câu hỏi mở Q5.

**Đề xuất:**

1. Thêm tham số cấu hình **"Hạn phản hồi của Cửa hàng trưởng (ngày)"** (ví dụ 3 ngày).
2. Nhắc việc trước hạn 1 ngày.
3. Quá hạn: hệ thống **tự xác nhận lỗi**, ghi lịch sử với người thực hiện là hệ thống và hành động riêng (ví dụ `AUTO_CONFIRMED`), cộng 1 lần lỗi như xác nhận thường, hạn khắc phục tính từ ngày tự xác nhận.
4. Áp dụng tương tự cho phiếu không lỗi đang chờ "xác nhận đã xem" (tự hoàn thành sau hạn).

**Cần KSVH chốt:** số ngày; tự xác nhận hay chuyển lên OBM xử lý thay; có cần hạn cho người thẩm định khiếu nại không (Q6).

---

## 4. Ưu tiên 2 – Hiệu chỉnh mô hình điểm

### 4.1 Chốt một thang điểm duy nhất

Đây là quyết định nghiệp vụ, phải chốt trước các mục 4.2–4.4.

| Phương án | Mô tả | Ưu điểm | Nhược điểm |
|---|---|---|---|
| A – Giữ PDF | Điểm = ảnh hưởng × số lần lỗi, không trần | Không đổi code | Điểm không có trần, bảng mức 0–20 bị vượt nhanh |
| **B – PDF có trần tần suất (khuyến nghị)** | Điểm = ảnh hưởng × min(số lần lỗi, trần), trần cấu hình được (ví dụ 5) | Điểm tối đa 25, khớp thang "Khả năng 1–5" của Excel mà KSVH quen dùng; đổi code ít | Sau lần thứ 5 điểm không tăng nữa |
| C – Theo Word | Trọng số × hệ số tái phạm, ma trận tần suất × ảnh hưởng | Sát cách làm tay hiện tại | Word tự mô tả 3 cách khác nhau; phải viết lại bộ tính và test |

Với phương án B, số lần lỗi thực tế vẫn lưu và hiển thị đầy đủ; trần chỉ áp vào phép nhân.

### 4.2 Hiệu chỉnh lại bảng mức theo dữ liệu thật

Sau khi chốt thang điểm, Phòng KSVH đặt lại khoảng điểm sao cho cả 4 mức đều dùng tới. Bảng dưới chỉ minh hoạ cách kiểm tra một bộ số, áp dụng với phương án B, **không phải đề xuất con số**:

| Mức | Khoảng ví dụ | Ảnh hưởng 3 | Ảnh hưởng 4 | Ảnh hưởng 5 |
|---|---|---|---|---|
| M1 | [0, 5) | lần 1 | lần 1 | – |
| M2 | [5, 10) | lần 2, 3 | lần 2 | lần 1 |
| M3 | [10, 20) | lần 4, 5 | lần 3, 4 | lần 2, 3 |
| M4 | ≥ 20 | – | lần 5 | lần 4, 5 |

Công cụ để KSVH tự thử nhiều bộ số: xem §6.2.

### 4.3 Lỗi nặng phải vào mức cao ngay lần đầu

**Hiện trạng:** mức rủi ro chỉ tăng nhờ lặp lại. Lối thoát hiểm bị chặn, QR chuyển sai tài khoản, giấy phép ATTP hết hạn lần đầu đều là M2 với hạn 30 ngày. File Word mô tả M4 là lỗi "có thể gây tổn thất lớn, đóng cửa, nguy hiểm", xử lý trong 0–24 giờ – tức mức độ do **bản chất** lỗi, không chỉ do số lần.

**Đề xuất:** thêm trên tiêu chí trường tuỳ chọn **"Mức rủi ro tối thiểu"** (trống = không áp dụng). Mức của lỗi = mức cao hơn giữa mức tính theo điểm và mức tối thiểu. Điểm rủi ro vẫn tính và hiển thị như cũ.

- Chỉ thêm một cột trên `criteria` và một bước `max` sau khi tra bảng mức trong `RiskCalculator`.
- Lỗi lưu thêm cờ "mức do sàn tiêu chí" để màn hình giải thích được vì sao điểm 5 mà là M4.
- Không ảnh hưởng tiêu chí không khai báo.

**Cần KSVH chốt:** danh sách tiêu chí có mức tối thiểu M3 / M4 trong 70 tiêu chí.

### 4.4 Quy tắc nâng mức cho tiêu chí đã ở mức trần

**Hiện trạng:** 42 tiêu chí ảnh hưởng 5 không nâng được vì trần là 5. Ngoài ra nâng mức chỉ áp một lần: lỗi 3 lần hay 10 lần đều +1 bậc, trong khi PDF ghi "+1 bậc, tối đa đến mức trần".

**Các hướng, cần KSVH chọn một:**

| Hướng | Mô tả |
|---|---|
| 1 | Giữ nguyên. Chấp nhận tiêu chí ảnh hưởng 5 không nâng, vì điểm đã cao sẵn. Ghi rõ điều này trên màn cấu hình |
| 2 | Nâng dồn: mỗi lần đủ thêm một ngưỡng (3, 6, 9 lần) nâng thêm một bậc cho tới trần. Có ích cho tiêu chí ảnh hưởng 3–4 |
| 3 | Tiêu chí đã ở trần mà chạm ngưỡng thì nâng thẳng **một mức rủi ro** (M2 → M3) thay vì nâng ảnh hưởng |

Hướng 1 không đổi code. Hướng 2 và 3 sửa `RiskCalculator` và thêm test.

---

## 5. Ưu tiên 3 – Bổ sung danh mục tiêu chí theo file Excel

File Excel có hai cột mà bảng `criteria` chưa có:

| Cột Excel | Ví dụ | Đề xuất |
|---|---|---|
| Tần suất | Hàng ngày, Hàng tuần, Hàng quý, Theo sự cố, Mở mới | Thêm trường **"Tần suất kiểm soát"** (văn bản, hiển thị cho Chuyên viên khi chấm; chưa dùng để tính) |
| Bộ phận | QLNH, Kế toán/IT, Thu mua, Pháp chế, Nhân sự | Thêm trường **"Bộ phận chịu trách nhiệm"** |

Về "Bộ phận": nhiều tiêu chí không thuộc quyền xử lý của Cửa hàng trưởng (sao lưu dữ liệu – IT; đổi tài khoản nhà cung cấp – Kế toán/Thu mua; kênh tố giác – Nhân sự/KSVH). Hiện mọi lỗi đều giao CHT khắc phục. Đề xuất làm hai bước:

1. **Bước 1 (nhỏ):** lưu và hiển thị bộ phận trên lỗi, trên báo cáo, và cho lọc theo bộ phận. CHT vẫn là đầu mối.
2. **Bước 2 (lớn, cần lên kế hoạch riêng):** giao lỗi cho người phụ trách của bộ phận khối văn phòng. Kéo theo vai trò mới, phân quyền, thông báo – đúng với phần "kế hoạch khắc phục có người phụ trách" mà file Word nêu và đặc tả ghi là chưa làm.

Cần cập nhật theo: mẫu import Excel (`CriteriaExcelService`, [03_danh_muc_70_tieu_chi_ksvh.xlsx](excel-templates/03_danh_muc_70_tieu_chi_ksvh.xlsx)).

Các cột "Giá trị/lần", "Số lần/tháng", "Xác suất tổn thất", "Thiệt hại ước tính/tháng" của Excel: **chưa đề xuất đưa vào**, vì file mẫu để trống và chưa rõ KSVH có dùng không. Cần hỏi.

---

## 6. Ưu tiên 3 – Màn Cấu hình: kiểm tra và mô phỏng

### 6.1 Kiểm tra khi lưu

| Kiểm tra | Hành vi đề xuất |
|---|---|
| Mức không thể đạt tới với danh mục tiêu chí hiện có (như M1 hiện nay) | Cảnh báo, vẫn cho lưu |
| Hạn khắc phục của mức cao dài hơn mức thấp | Cảnh báo, vẫn cho lưu |
| Mức trần nâng mức ≤ mức ảnh hưởng của phần lớn tiêu chí | Cảnh báo kèm số tiêu chí không được nâng |
| Thay phiên bản bảng mức có ngày hiệu lực hôm nay khi đã có lỗi tính theo nó | Chặn, giống cách tần suất và nâng mức đang chặn |

### 6.2 Mô phỏng trước khi lưu

Mở rộng `GET /api/v1/risk/preview` (đã dùng chung bộ tính) để trả về bảng tổng hợp trên **toàn bộ tiêu chí đang hoạt động**: với bộ số đang nhập, lần lỗi thứ 1 đến thứ 5 có bao nhiêu tiêu chí rơi vào từng mức. Hiển thị ngay trên form trước khi bấm lưu, dạng:

| Lần lỗi | M1 | M2 | M3 | M4 |
|---|---|---|---|---|
| 1 | 0 | 70 | 0 | 0 |
| 2 | 0 | 0 | 70 | 0 |
| 3 | 0 | 0 | 0 | 70 |

Bảng trên chính là kết quả của cấu hình mặc định hiện tại – nhìn là thấy ngay vấn đề ở §2.2. Giao diện không tự tính, chỉ hiển thị kết quả từ server.

---

## 7. Dữ liệu mẫu và test

- Dữ liệu dev ([sample_data.sql](../backend/src/main/resources/db/dev-seed/sample_data.sql)) có 9 tiêu chí ví dụ, ảnh hưởng 1–3, nên không lộ các vấn đề ở §2. Đề xuất nạp đủ 70 tiêu chí thật (10 nhóm, mã `CTRL-001` … `CTRL-070`) và một mẫu phiếu định kỳ đủ 70 tiêu chí.
- Thêm test cho `RiskCalculator`: phân bố mức của 70 tiêu chí theo lần lỗi; chuỗi quá hạn liên tiếp có trần (§3.1); tiêu chí có mức tối thiểu (§4.3).
- Thêm test luồng: CHT quá hạn phản hồi → tự xác nhận (§3.2).

---

## 8. Việc nhỏ

| Việc | Hiện trạng | Đề xuất |
|---|---|---|
| Ngày của lần lỗi | Ghi theo thời điểm CHT xác nhận. Lỗi phát hiện cuối tháng 9, xác nhận đầu tháng 10 bị đếm vào tháng 10 | Ghi theo ngày gửi phiếu kiểm tra; thời điểm xác nhận vẫn lưu trong lịch sử |
| Hai phiếu cùng lỗi một tiêu chí trước khi phiếu đầu được xác nhận | Phiếu sau tính thiếu một lần | Tính lại điểm tại lúc xác nhận (đang là câu hỏi mở trong RISK_SCORING §9) |
| Phiếu định kỳ phải đủ 70 điểm (NT01 trong Word) | Hệ thống bắt chấm đủ tiêu chí của mẫu, nhưng không kiểm tra mẫu định kỳ có đủ mọi tiêu chí đang hoạt động | Cảnh báo khi mẫu định kỳ thiếu tiêu chí đang hoạt động |

Chưa đưa vào đợt này (đặc tả đã ghi nhận, cần kế hoạch riêng): giải trình nhiều cấp, kế hoạch khắc phục chi tiết (nguyên nhân gốc, biện pháp), trạng thái "mở lại", hệ số tái phạm trong điểm tuân thủ.

---

## 9. Câu hỏi cần Phòng KSVH chốt

| # | Câu hỏi | Liên quan |
|---|---|---|
| C1 | Chọn thang điểm A, B hay C? Nếu B, trần tần suất là mấy? | §4.1 |
| C2 | Khoảng điểm và hạn khắc phục chính thức của M1–M4? | §4.2 |
| C3 | Tiêu chí nào phải vào thẳng M3 / M4 ngay lần đầu? | §4.3 |
| C4 | Tiêu chí đã ở mức trần xử lý theo hướng 1, 2 hay 3? Nâng mức một lần hay nâng dồn? | §4.4 |
| C5 | Quá hạn cộng tối đa mấy lần cho một lỗi? Chạm trần thì báo ai? | §3.1 |
| C6 | Lỗi chờ nghiệm thu mà quá hạn có cộng lần lỗi cho nhà hàng không? | §3.1 |
| C7 | CHT có mấy ngày để phản hồi? Quá hạn thì tự xác nhận hay chuyển OBM? | §3.2 |
| C8 | Lỗi thuộc IT / Kế toán / Thu mua / Pháp chế ai khắc phục? | §5 |
| C9 | Có dùng các cột ước tính thiệt hại của Excel không? | §5 |
| C10 | Hạ mức theo "6 tháng không lỗi" (PDF) hay "2 kỳ liên tiếp" (Word)? | §2.4 |

---

## 10. Thứ tự triển khai đề xuất

| Đợt | Nội dung | Phụ thuộc |
|---|---|---|
| 1 | §3.1 trần quá hạn, §3.2 hạn phản hồi CHT | C5, C6, C7 |
| 2 | §6 kiểm tra và mô phỏng trên màn cấu hình; §7 nạp 70 tiêu chí thật | Không phụ thuộc quyết định nghiệp vụ – làm được ngay |
| 3 | §4.1–4.4 hiệu chỉnh mô hình điểm | C1–C4, C10; dùng công cụ mô phỏng của đợt 2 để KSVH chọn số |
| 4 | §5 bổ sung danh mục tiêu chí (bước 1), §8 việc nhỏ | C8, C9 |
| Sau | §5 bước 2 và các mục "chưa đưa vào đợt này" | Kế hoạch riêng |

Đợt 2 nên làm trước đợt 3: có bảng mô phỏng thì Phòng KSVH tự thấy hệ quả của từng bộ số và chốt C1–C4 nhanh hơn.

Lưu ý quy trình: các mục đổi schema (§3, §4.3, §5) đi bằng Flyway migration mới; đổi công thức phải sửa `RiskCalculator` kèm test; đổi API phải chạy lại `npm run api:types`.
