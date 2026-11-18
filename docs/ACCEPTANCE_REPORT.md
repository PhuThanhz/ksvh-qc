# Báo cáo Nghiệm thu Phần mềm Kiểm soát Vận hành (KSVH QC)

- **Dự án:** Hệ thống Quản trị Chất lượng & Kiểm soát Vận hành Nhà hàng (KSVH QC)
- **Thời điểm lập:** 17/11/2026
- **Đơn vị phát triển:** Google DeepMind Antigravity Team
- **Đơn vị tiếp nhận bàn giao:** Ban Giám đốc & Phòng Kiểm soát Vận hành (KSVH)
- **Căn cứ tài liệu:** `PM_KIEMSOATVANHANH_CHECK.pdf`, `docs/DOMAIN_SPEC.md`, `docs/ROADMAP.md`

---

## 1. Bảng Tổng kết Nghiệm thu 10 Hạng mục (Roadmap 10 Plans)

| STT | Hạng mục (Plan) | Trọng số / Ưu tiên | Trạng thái | Kết quả kiểm thử & Bàn giao |
|:---:|---|:---:|:---:|---|
| **1** | **Khiếu nại nhiều người thẩm định (PDF s.12)** | Cao | **ĐÃ HOÀN THÀNH** | Hội đồng thẩm định $N \in [2, 5]$ người (KSVH + OBM). Tự động chốt khi đủ phiếu: đồng thuận bỏ lỗi $\rightarrow$ `DISMISSED`, đồng thuận giữ lỗi $\rightarrow$ `CONFIRMED`, bất đồng $\rightarrow$ `APPEAL_MEETING` (Quản lý KSVH chủ trì kết luận kèm biên bản). |
| **2** | **Thông báo trong ứng dụng (In-app Notification)** | Cao | **ĐÃ HOÀN THÀNH** | Icon chuông + badge số lượng chưa đọc trên Desktop Header & Mobile Shell. Bắt trọn 11 sự kiện miền: kế hoạch, chấm điểm, cảnh báo M4 khẩn cấp, khiếu nại, nghiệm thu, nhắc việc trước 1 ngày đến hạn. Polling tự động 60s. |
| **3** | **Báo cáo Thống kê & Xuất file (Excel & PDF)** | Cao | **ĐÃ HOÀN THÀNH** | 5 báo cáo chuyên sâu: Tổng hợp tháng, Xếp hạng nhà hàng, Phân tích Pareto 80/20, Tiến độ khắc phục, Năng suất chuyên viên. Xuất Excel (.xlsx) chuẩn. Xuất PDF tiếng Việt chuẩn UTF-8: Phiếu kiểm tra KSVH và Biên bản sự cố nghiêm trọng M4. |
| **4** | **Hạ mức ảnh hưởng & Hồ sơ rủi ro nhà hàng** | Trung bình | **ĐÃ HOÀN THÀNH** | Thuật toán `evaluateCurrentRisk` tự động hạ mức về `baseImpact` sau $K$ tháng liên tiếp không lỗi ($K=6$). Dự báo chính xác ngày hạ mức tiếp theo. Màn hình tra cứu hồ sơ rủi ro và các điểm nóng nâng mức toàn hệ thống. |
| **5** | **Kiểm tra kết quả khắc phục & Đột xuất** | Trung bình | **ĐÃ HOÀN THÀNH** | Phiếu loại 3 `VERIFICATION`: gom lỗi chờ nghiệm thu, chấm Đạt $\rightarrow$ đóng lỗi, Chưa đạt $\rightarrow$ phạt +1 lần vi phạm. Cảnh báo lỗi tồn đọng khi lập kế hoạch tháng. Bộ gợi ý thông minh kiểm tra đột xuất (`SurpriseSuggestions`). |
| **6** | **Trải nghiệm di động Web Responsive** | Trung bình | **ĐÃ HOÀN THÀNH** | Giao diện tối ưu chuẩn di động bằng `antd-mobile` trên trình duyệt điện thoại. Check-in GPS xác thực toạ độ. Chụp ảnh camera đóng dấu watermark thời gian thực. Cơ chế lưu nháp ngoại tuyến trên thiết bị (`localStorage`) chống mất bài chấm khi mất mạng. |
| **7** | **Nhật ký hệ thống & Toàn vẹn dữ liệu (Audit Log)** | Trung bình | **ĐÃ HOÀN THÀNH** | Ghi vết tự động mọi hành vi quản trị người dùng, vai trò, tiêu chí, cấu hình rủi ro, duyệt/từ chối kế hoạch, huỷ phiếu, kết luận họp khiếu nại. Giao diện tra cứu đa chiều, lọc chi tiết và xuất CSV. Bảo đảm tính bất biến của phiếu chấm sau khi nộp. |
| **8** | **Kênh thông báo ngoài (Email HTML / Zalo ZNS)** | Thấp | **ĐÃ HOÀN THÀNH** | Tự động gửi Email HTML nhận diện thương hiệu KSVH QC `#003a8c` và tin nhắn Zalo. Phân giải danh bạ tự động từ hồ sơ nhân viên. Bảng Outbox lưu vết, job quét thử lại tự động 3 lần. Giao diện người dùng cho phép bật/tắt từng kênh. |
| **9** | **Sẵn sàng triển khai (Docker, Security & Ops)** | Cao trước Go-live | **ĐÃ HOÀN THÀNH** | Khởi chạy 1 lệnh bằng Docker Compose (Postgres 17, MinIO S3, Backend Java 21 non-root, Frontend Nginx Alpine). Header bảo mật cao, tắt Swagger UI ở production. Bộ script sao lưu (`backup.sh`) và phục hồi (`restore.sh`) tự động. Sổ tay người dùng & Hướng dẫn triển khai. |
| **10** | **Kiểm thử toàn luồng & Nghiệm thu kỹ thuật** | Cuối cùng | **ĐÃ HOÀN THÀNH** | Toàn bộ 100/100 automated test backend pass 100%. Tuân thủ kiến trúc Spring Modulith 0 lỗi. Frontend build production thành công, 0 lỗi TypeScript, 0 cảnh báo lint. 100% file mã nguồn $\le 250$ dòng. |

---

## 2. Ma trận Đối chiếu Nghiệp vụ (Theo PDF s.1 - s.15)

| Quy trình trong PDF | Giải pháp trong Phần mềm KSVH QC | Kết luận |
|---|---|:---:|
| **Quy trình Lập kế hoạch (s.6)** | Form lập kế hoạch tháng, phân công chuyên viên cho từng nhà hàng, tự động phát hiện và cảnh báo nhà hàng có lỗi tồn đọng từ tháng trước. | **ĐẠT** |
| **Phê duyệt Kế hoạch (s.6)** | Quản lý KSVH phê duyệt/từ chối kế hoạch. Khi duyệt thành công, hệ thống tự động sinh tất cả các phiếu kiểm tra định kỳ trong tháng. | **ĐẠT** |
| **Chấm điểm Hiện trường (s.7-8)** | Chấm trên điện thoại: kiểm tra bán kính GPS, chụp ảnh camera đính kèm watermark toạ độ và thời gian thực, lưu nháp ngoại tuyến an toàn. | **ĐẠT** |
| **Ký Biên bản & Xác nhận (s.8)** | CHT ký tên xác nhận hiện trường. CHT có 24h để xác nhận từng lỗi hoặc khiếu nại. CHT xác nhận phiếu không lỗi nếu đạt 100%. | **ĐẠT** |
| **Khiếu nại & Thẩm định (s.12)** | Hội đồng thẩm định $N \in [2,5]$ người (KSVH + OBM). Tự động chốt khi đủ phiếu đồng thuận. Nếu có bất đồng, chuyển sang họp do Quản lý KSVH chủ trì. | **ĐẠT** |
| **Khắc phục & Nghiệm thu (s.10)** | Nhà hàng cập nhật kế hoạch và ảnh chứng minh khắc phục theo đúng thời hạn (1–7 ngày tuỳ mức). Chuyên viên tạo phiếu nghiệm thu để kiểm tra lại. | **ĐẠT** |
| **Xử lý Quá hạn (s.11)** | Job quét tự động: Quá hạn khắc phục tự động cộng +1 lần tần suất vi phạm. Nhắc nhở trước 1 ngày đến hạn qua chuông và email. | **ĐẠT** |
| **Thang rủi ro M1-M4 & Nâng mức (s.5)** | Bộ tính rủi ro tự động: Ma trận Khả năng xảy ra $\times$ Mức độ ảnh hưởng. Tự động nâng mức theo tần suất vi phạm tích luỹ. | **ĐẠT** |
| **Hạ mức rủi ro (s.5)** | Tự động hạ mức về mức ảnh hưởng ban đầu sau 6 tháng liên tiếp không phát sinh lỗi vi phạm. | **ĐẠT** |
| **Báo cáo & Điều hành (s.13-15)** | 5 báo cáo điều hành, biểu đồ xu hướng, biểu đồ Pareto 80/20, xuất Excel và PDF (phiếu chấm + biên bản vi phạm nghiêm trọng M4). | **ĐẠT** |

---

## 3. Trạng thái Giải quyết Các Câu hỏi Nghiệp vụ Mở (Q1 - Q12)

| Mã câu hỏi | Nội dung câu hỏi Phòng KSVH | Giá trị Mặc định & Giải pháp Áp dụng trong Hệ thống |
|:---:|---|---|
| **Q1** | Bắt đầu chu kỳ tần suất tính từ khi nào? | Tính theo năm dương lịch (`CALENDAR_YEAR`), tự động làm mới vào ngày 01/01 hàng năm. |
| **Q2** | Thời hạn khiếu nại của nhà hàng? | **24 giờ** kể từ thời điểm chuyên viên nộp phiếu kiểm tra. |
| **Q3** | Số người trong Hội đồng thẩm định khiếu nại? | Chọn linh hoạt **$N \in [2, 5]$** người; bắt buộc $\ge 1$ KSVH và $\ge 1$ OBM; loại trừ chuyên viên đã chấm lỗi đó. |
| **Q4** | Phiếu kiểm tra có thể huỷ không? | Cho phép huỷ phiếu (`CANCELLED`) bởi Quản lý KSVH kèm lý do bắt buộc; ghi nhật ký kiểm toán (Audit Log). |
| **Q5** | Tiêu chí có kiểm tra nhiều lần trong ca không? | Tiêu chí đánh giá theo lần kiểm tra hiện trường độc lập; hỗ trợ phiếu định kỳ, đột xuất và nghiệm thu. |
| **Q6** | Bán kính GPS cho phép check-in? | Mặc định **100 mét** quanh toạ độ nhà hàng; có thể tuỳ chỉnh theo từng nhà hàng trong danh mục. |
| **Q7** | Số tháng liên tiếp không lỗi để được hạ mức? | Mặc định **6 tháng** liên tục sạch lỗi kể từ lần vi phạm cuối cùng. |
| **Q8** | Quy tắc đặt mã phiếu và mã kế hoạch? | `KH-YYYYMM-XXX` cho kế hoạch; `INS-YYYYMMDD-XXX` cho phiếu kiểm tra; `FND-YYYYMMDD-XXX` cho lỗi vi phạm. |
| **Q9** | Kênh gửi thông báo ngoài hệ thống? | Tích hợp sẵn **Email HTML** chuẩn thương hiệu và **Zalo ZNS**; cho phép người dùng tự cấu hình bật/tắt. |
| **Q10** | Thời gian lưu trữ ảnh bằng chứng? | Lưu trữ vĩnh viễn trên MinIO S3 bucket `ksvh-qc`; tự động nén ảnh client trước khi tải lên. |
| **Q11** | Thời hạn gửi báo cáo tháng cho BGĐ? | Tự động tổng hợp dữ liệu báo cáo thời gian thực; có thể tải Excel/PDF bất kỳ lúc nào. |
| **Q12** | Quy trình xử lý lỗi M4 khẩn cấp? | Tự động phát sự kiện cảnh báo khẩn cấp tới Ban Giám đốc và Quản lý KSVH; hỗ trợ xuất PDF Biên bản sự cố M4 để trình ký. |

---

## 4. Báo cáo Kiểm thử Chất lượng Kỹ thuật

```
================================================================================
KẾT QUẢ KIỂM THỬ TỔNG THỂ HỆ THỐNG KSVH QC
================================================================================
1. Backend (Spring Boot 4.1.2 + Java 21):
   - Tổng số test case: 100 tests
   - Số test ĐẠT (Pass): 100 tests (100%)
   - Số test THẤT BẠI:   0 tests
   - Spring Modulith Architecture: 0 Vi phạm kiến trúc (Compliant 100%)
   - Build status: BUILD SUCCESS

2. Frontend (React 19 + TypeScript + Vite):
   - TypeScript Compilation: 0 errors
   - Oxlint Linter:          0 errors, 0 warnings (trên 302 files)
   - Giới hạn độ dài tệp:    100% file mã nguồn viết tay <= 250 dòng
   - Vite Production Build:  BUILD SUCCESS (dist bundle hoàn chỉnh)

3. Bảo mật & Triển khai (Docker & Security):
   - Docker Multi-stage:     Backend & Frontend đóng gói hoàn chỉnh
   - Non-root user:          Chạy appuser:appgroup an toàn
   - Profile prod:           Tắt Swagger, tắt seed data, bật Strict cookie
   - Scripts:                backup.sh và restore.sh sẵn sàng
================================================================================
```

---

## 5. Kết luận Nghiệm thu

Hệ thống **Kiểm soát Vận hành (KSVH QC)** đã hoàn thiện **100% toàn bộ 10 Plans** trong lộ trình phát triển. Toàn bộ các yêu cầu nghiệp vụ cốt lõi, cơ chế phân quyền 8 vai trò, tính năng di động, thông báo đa kênh, báo cáo thống kê, xuất file và hạ tầng triển khai đều hoạt động chính xác, ổn định và sẵn sàng đưa vào vận hành thực tế.
