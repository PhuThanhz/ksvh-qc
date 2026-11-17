# Kế hoạch tối ưu nghiệp vụ theo từng vai trò – KSVH QC

Lập 18/11/2026. Thay và mở rộng mục **O4** trong `PLAN_OPTIMIZATION.md`. Căn cứ: `PM_KIEMSOATVANHANH_CHECK.pdf` (slide 6–16),
`DOMAIN_SPEC.md`, phương án tạm trong `QUESTIONS_FOR_KSVH.md`, và **danh sách API hiện có** (rà 18/11).

## 0. Nguyên tắc
1. **Không lệch quy trình gốc PDF** (6 bước s.7). Tối ưu = bớt thao tác, bớt quên, bớt sai – không bỏ bước kiểm soát.
2. **Thao tác hàng loạt vẫn ghi lịch sử từng lỗi**: mỗi lỗi có `finding_events` riêng (người, thời điểm) – quy tắc bắt buộc số 4.
   Một lỗi trong lô không hợp lệ → **không làm hỏng cả lô**: trả kết quả từng lỗi (thành công / lý do lỗi).
3. **Server tự kiểm**: quyền, trạng thái, hạn, ảnh bằng chứng – như thao tác đơn (quy tắc số 1). API hàng loạt chỉ là vòng lặp gọi đúng logic đơn.
4. Mục đánh dấu **[Cần duyệt]** đổi hành vi nghiệp vụ → người dùng duyệt trước khi code; mục **[Không đổi luật]** làm được ngay.
5. Mọi con số (số ngày nhắc, số dòng tối đa…) qua cấu hình, ghi "tạm áp dụng".

## 1. Hiện trạng đo được
| Điểm | Hiện tại |
|---|---|
| Xử lý lỗi | Mọi thao tác **từng lỗi một**: `confirm`, `appeal`, `remediation-plan`, `submit-remediation`, `verify` (`/findings/{id}/…`). Không có API hàng loạt. |
| Ngày dự kiến kiểm tra | Chỉ nằm trong dòng phân công kế hoạch (`inspection_plan_assignments.scheduled_date`) và **ghi chú** của phiếu; bảng `inspections` **không có cột ngày dự kiến** → không sắp xếp / nhắc theo ngày. |
| Phiếu giao quá hạn chưa chấm | Không có xử lý. Kế hoạch hết `endDate` còn phiếu `ASSIGNED`/`IN_PROGRESS` – không cảnh báo. |
| Lập kế hoạch tháng | Nhập tay từng dòng phân công; không sao chép tháng trước; đã có API cảnh báo nhà hàng còn lỗi (`/inspection-plans/restaurant-warnings`). |
| Duyệt kế hoạch | Duyệt / từ chối cả kế hoạch; không xem trước số phiếu sẽ sinh, xung đột (chuyên viên quá tải, trùng ngày). |
| Hàng chờ theo vai trò | CHT dùng danh sách lỗi; Chuyên viên dùng `my-tasks`, `verification-candidates`; Người thẩm định dùng `pending-reviews`; **không có** một "hộp việc" chung cho từng vai trò trên dashboard `/admin`. |
| Nhắc việc | Job 08:00 nhắc lỗi sắp đến hạn khắc phục; job 00:05 quá hạn +1. Chưa nhắc: phiếu chưa chấm, CHT chưa phản hồi (Q5 – đang làm §8), thẩm định chưa đánh giá (Q6 – §8), kế hoạch chờ duyệt lâu. |

Ước lượng thao tác hiện tại (1 phiếu có **8 lỗi**, CHT đồng ý cả 8):
CHT ≈ 8 lần Xác nhận + 8 lần Lập kế hoạch + 8 lần Gửi bằng chứng = **24 thao tác** (mỗi thao tác mở modal, chọn ngày, tải ảnh).
Chuyên viên nghiệm thu ≈ **8** lần mở/nghiệm thu. Mục tiêu sau tối ưu: CHT ≈ **3–5** thao tác, Chuyên viên ≈ **1–2** (một màn nghiệm thu theo nhà hàng).

---

## 2. Trưởng nhóm KSVH – lập kế hoạch & phân công (PDF s.9)
| ID | Vấn đề | Đề xuất | Loại |
|---|---|---|---|
| N1 | Kế hoạch tháng nhập tay từng dòng | **Sao chép kế hoạch tháng trước**: chọn kế hoạch cũ → tạo nháp mới, giữ nhà hàng/chuyên viên/mẫu, dời ngày sang tháng mới (giữ thứ trong tuần hoặc cùng ngày trong tháng), bỏ nhà hàng đã ngừng hoạt động, báo dòng bị bỏ. | Không đổi luật |
| N2 | Thêm nhiều nhà hàng mất công | **Thêm hàng loạt**: chọn nhiều nhà hàng (lọc theo công ty / OBM) → 1 mẫu phiếu, chia đều cho các chuyên viên đã chọn, rải ngày trong khoảng kế hoạch (bỏ thứ Bảy/CN tuỳ chọn). Sửa từng dòng sau. | Không đổi luật |
| N3 | Phân công không thấy tải công việc | Cột "**Số phiếu của chuyên viên trong tháng**" và cảnh báo **trùng ngày** (1 chuyên viên > N phiếu/ngày, cấu hình) ngay trong bảng phân công. | Không đổi luật |
| N4 | Cảnh báo lỗi tồn chưa hiện rõ | Đưa kết quả `restaurant-warnings` lên **từng dòng** (biểu tượng + số lỗi chưa xác minh, lỗi M3/M4 đang mở) và gợi ý "ưu tiên kiểm tra sớm". | Không đổi luật |
| N5 | Nhập phân công từ Excel | Dùng `ExcelActions`: file mẫu (mã nhà hàng, tài khoản chuyên viên, mã mẫu phiếu, ngày) → kiểm tra trước khi ghi, báo lỗi từng dòng. | Không đổi luật |
| N6 | Đột xuất phải tạo tay | Từ danh sách **gợi ý kiểm tra đột xuất** (`/inspections/surprise-suggestions`) bấm "Tạo phiếu đột xuất" → điền sẵn nhà hàng + chuyên đề (nhóm tiêu chí có lỗi M3/M4). | Không đổi luật |
| N7 | Đổi người thực hiện | PDF: huỷ phiếu + lập phiếu mới. Gộp thành **một thao tác "Giao lại"**: huỷ phiếu cũ (ghi lý do) và tạo phiếu mới cùng kế hoạch/nhà hàng/mẫu cho chuyên viên khác trong **một giao dịch**; dòng phân công trỏ sang phiếu mới. | Không đổi luật (đúng PDF, chỉ gộp bước) |

## 3. Quản lý KSVH – duyệt, khiếu nại, giám sát (PDF s.6, s.9, s.12)
| ID | Vấn đề | Đề xuất | Loại |
|---|---|---|---|
| N8 | Duyệt "mù" | **Xem trước khi duyệt**: số phiếu sẽ sinh, số nhà hàng có lỗi tồn, chuyên viên quá tải/trùng ngày, so với kế hoạch tháng trước (+/− nhà hàng). | Không đổi luật |
| N9 | Từ chối phải ghi lý do chung | Cho **ghi chú theo từng dòng phân công** khi từ chối ("đổi chuyên viên dòng 5") để Trưởng nhóm sửa nhanh; lý do chung vẫn bắt buộc. | Không đổi luật |
| N10 | Không có hộp việc | **Hộp việc Quản lý** trên dashboard: kế hoạch chờ duyệt, khiếu nại cần họp (`APPEAL_MEETING`), khiếu nại sắp hết hạn thẩm định, lỗi M4 mới, phiếu quá ngày dự kiến chưa chấm, CHT quá hạn phản hồi (Q5). Mỗi mục bấm thẳng tới màn xử lý. | Không đổi luật |
| N11 | Kết luận họp khiếu nại | Màn họp: hiện đủ ý kiến từng người thẩm định, bằng chứng CHT/Chuyên viên, lịch sử tần suất của nhà hàng–tiêu chí; nhập **biên bản họp** (người dự, kết luận) → lưu vào `finding_events`. | Không đổi luật |
| N12 | Theo dõi tiến độ kế hoạch | Màn chi tiết kế hoạch thêm **tiến độ**: % phiếu đã chấm, đã hoàn thành, quá ngày dự kiến; nút "Nhắc chuyên viên". | Không đổi luật |

## 4. Chuyên viên KSVH – chấm & nghiệm thu (PDF s.10, s.13)
| ID | Vấn đề | Đề xuất | Loại |
|---|---|---|---|
| N13 | Không biết làm phiếu nào trước | **Lưu ngày dự kiến trên phiếu** (`inspections.scheduled_date`, migration mới; điền từ dòng phân công, phiếu đột xuất = ngày tạo). `/qc` sắp xếp: hôm nay · quá ngày · sắp tới; lịch tuần. | Không đổi luật |
| N14 | Phiếu quá ngày dự kiến không ai biết | Job 08:00: phiếu `ASSIGNED` quá `scheduled_date` → nhắc Chuyên viên, sau N ngày (cấu hình) báo Trưởng nhóm. **Không** tự huỷ. | Không đổi luật |
| N15 | Nghiệm thu từng lỗi | **Nghiệm thu theo nhà hàng**: một màn liệt kê mọi lỗi chờ nghiệm thu của 1 nhà hàng (ảnh trước/sau cạnh nhau), chọn Đạt/Chưa đạt từng dòng, gửi một lần (API hàng loạt, kết quả từng lỗi). Dùng lại phiếu `VERIFICATION` khi cần đi thực tế. | Không đổi luật |
| N16 | Chấm 70 tiêu chí lâu | Màn chấm: nút **"Đạt tất cả nhóm này"** (chỉ áp cho tiêu chí chưa chấm, vẫn sửa được từng dòng trước khi gửi); nhảy tới tiêu chí chưa chấm; hiển thị lỗi lần trước của nhà hàng ở tiêu chí đó để chú ý. | **[Cần duyệt]** (đánh "Đạt tất cả" có thể làm chấm qua loa – KSVH quyết) |
| N17 | Mô tả lỗi lặp lại | **Câu mẫu mô tả lỗi** theo tiêu chí (Quản trị nghiệp vụ khai báo, vd "Tủ đông > -18°C") – bấm chèn, sửa thêm. | Không đổi luật |

## 5. Cửa hàng trưởng – xác nhận, khiếu nại, khắc phục (PDF s.11–13)
| ID | Vấn đề | Đề xuất | Loại |
|---|---|---|---|
| N18 | Xác nhận từng lỗi | **Xác nhận nhiều lỗi** cùng phiếu: chọn các lỗi đồng ý → Xác nhận một lần (mỗi lỗi vẫn +1 và ghi lịch sử riêng). Lỗi muốn khiếu nại xử lý riêng (PDF: mỗi lỗi độc lập). | Không đổi luật |
| N19 | Lập kế hoạch khắc phục từng lỗi | **Kế hoạch chung cho nhiều lỗi**: chọn nhiều lỗi đã xác nhận → một nội dung + một ngày hẹn; server kiểm **ngày hẹn ≤ hạn của từng lỗi** (lỗi nào vượt thì báo riêng). | Không đổi luật |
| N20 | Gửi bằng chứng từng lỗi | **Gửi bằng chứng nhiều lỗi**: mỗi lỗi một ảnh/video riêng nhưng trong **một màn** (danh sách lỗi + nút chụp cạnh từng dòng), gửi một lần. | Không đổi luật |
| N21 | Không rõ việc gấp | Trang chủ `/qc` CHT xếp theo **hạn**: quá hạn → còn ≤ 1 ngày → còn lại; nhãn mức M1–M4 và đếm ngược ngày. | Không đổi luật |
| N22 | Khiếu nại chọn người khó | Gợi ý sẵn danh sách thẩm định (`candidate-reviewers`): **tự chọn** OBM phụ trách nhà hàng + 1 đại diện KSVH (không phải người chấm), CHT bỏ/thêm. | Không đổi luật |

## 6. OBM – tham gia khiếu nại, theo dõi nhà hàng (PDF s.6)
| ID | Vấn đề | Đề xuất | Loại |
|---|---|---|---|
| N23 | Không có màn riêng | **Màn OBM**: nhà hàng mình phụ trách – lỗi đang mở theo mức, CHT quá hạn phản hồi/khắc phục, khiếu nại chờ mình thẩm định. | Không đổi luật |
| N24 | Đôn đốc CHT | Nút **"Nhắc CHT"** trên lỗi quá hạn (gửi thông báo, ghi lịch sử, giới hạn 1 lần/ngày). | Không đổi luật |

## 7. Ban Giám đốc – xem kết quả (PDF s.6: không chỉnh sửa)
| ID | Vấn đề | Đề xuất | Loại |
|---|---|---|---|
| N25 | Nhiều báo cáo rời | **Bản tin tháng** tự sinh ngày 1 hằng tháng: % tuân thủ (sau khiếu nại), top 5 nhà hàng rủi ro, tiêu chí vi phạm nhiều nhất, lỗi M4, tình trạng khắc phục – gửi trong app + email, kèm PDF. | Không đổi luật |
| N26 | Lỗi M4 | Thông báo tức thì + link biên bản (Q12 – §8), danh sách M4 chưa đóng trên dashboard BGĐ. | Không đổi luật |

## 8. Quản trị nghiệp vụ / Quản trị hệ thống
| ID | Vấn đề | Đề xuất | Loại |
|---|---|---|---|
| N27 | Đổi cấu hình rủi ro không thấy hệ quả | Khi tạo phiên bản bảng mức / tần suất / nâng mức mới: **mô phỏng tác động** trên dữ liệu 3 tháng gần nhất ("bao nhiêu lỗi đổi mức, nhà hàng nào bị ảnh hưởng") – chỉ để xem, không tính lại lỗi cũ. | Không đổi luật |
| N28 | Người dùng nghỉ việc | Khi khoá tài khoản: liệt kê việc đang dở (phiếu được giao, lỗi CHT, thẩm định) và **gợi ý chuyển giao** (dùng N7 cho phiếu; đổi CHT nhà hàng cho lỗi). | Không đổi luật |
| N29 | Mẫu phiếu đổi giữa tháng | Cảnh báo khi sửa/ngưng mẫu phiếu đang dùng trong kế hoạch đã duyệt (phiếu đã tạo giữ snapshot – không đổi). | Không đổi luật |

## 9. Xuyên suốt
| ID | Đề xuất | Loại |
|---|---|---|
| N30 | **Hộp việc chung "Việc của tôi"** cho mọi vai trò (`GET /me/work-queue`): gom việc theo quyền (phiếu cần chấm, lỗi cần phản hồi/khắc phục, cần nghiệm thu, cần thẩm định, kế hoạch cần duyệt…), có hạn và link. Dùng cho dashboard `/admin` và trang chủ `/qc`. | Không đổi luật |
| N31 | **Kết thúc kế hoạch**: hết `endDate` còn phiếu chưa chấm → báo Trưởng nhóm + Quản lý; trạng thái kế hoạch hiển thị "Đang thực hiện / Hoàn thành / Quá hạn" (tính từ phiếu, không lưu). | Không đổi luật |
| N32 | **Gộp thông báo**: cùng loại, cùng người nhận trong 60 phút → 1 thông báo ("5 lỗi mới tại Kichi-Kichi"); email tóm tắt cuối ngày thay vì từng email. | Không đổi luật |
| N33 | **Liên kết sâu**: mọi thông báo/email mở đúng màn xử lý (lỗi, phiếu, kế hoạch) kể cả trên điện thoại. | Không đổi luật |
| N34 | **Tìm nhanh** (Ctrl/Cmd+K): mã phiếu, mã lỗi, nhà hàng, kế hoạch. | Không đổi luật |

---

## 10. Việc cho từng agent (theo đợt)
API hàng loạt dùng chung một dạng trả về: `{ results: [{ id, ok, code?, message? }] }`, HTTP 200 kể cả có dòng lỗi; giới hạn 100 dòng/lần (cấu hình).

### Đợt 1 – Không đổi luật, giảm thao tác nhiều nhất
**Agent BE**
- N13 migration `inspections.scheduled_date` (+ index), điền khi duyệt kế hoạch / tạo phiếu; trả trong API; `my-tasks` sắp theo ngày.
- N18 `POST /findings/batch/confirm`; N19 `POST /findings/batch/remediation-plan`; N20 `POST /findings/batch/submit-remediation` (mỗi lỗi kèm khoá ảnh riêng);
  N15 `POST /findings/batch/verify` – tất cả gọi lại đúng logic đơn, ghi `finding_events` từng lỗi; test: lô có 1 lỗi sai trạng thái vẫn xử lý các lỗi còn lại.
- N30 `GET /me/work-queue` (gom theo quyền, có hạn, đếm).
- N14 + N31 job nhắc phiếu quá ngày dự kiến và kế hoạch quá hạn (cấu hình số ngày).
- N1 `POST /inspection-plans/{id}/copy` (body: khoảng ngày mới, quy tắc dời ngày).
**Agent FE**
- `/qc` CHT: chọn nhiều lỗi → Xác nhận / Lập kế hoạch chung / Gửi bằng chứng (N18–N20), trang chủ xếp theo hạn (N21), tự gợi ý người thẩm định (N22).
- `/qc` Chuyên viên: danh sách theo ngày dự kiến (N13), màn nghiệm thu theo nhà hàng (N15).
- Dashboard: hộp việc theo vai trò dùng `work-queue` (N10, N30).
- Kế hoạch: nút Sao chép (N1), cảnh báo lỗi tồn trên từng dòng (N4).

### Đợt 2 – Không đổi luật, tiện lợi
BE: N2 (chia đều phân công), N3 (tải chuyên viên), N5 (Excel phân công), N7 (Giao lại), N8 (xem trước duyệt), N9, N11 (biên bản họp), N12 (tiến độ), N24, N32.
FE: màn tương ứng + N6, N17, N23, N33, N34.

### Đợt 3 – Sau UAT / cần duyệt
N16 ("Đạt tất cả nhóm" – **[Cần duyệt]**), N25 (bản tin tháng), N26, N27 (mô phỏng cấu hình), N28 (chuyển giao khi nghỉ việc), N29.

## 11. Đo hiệu quả (ghi trước/sau vào file này)
| Chỉ số | Cách đo | Mục tiêu |
|---|---|---|
| Thao tác CHT cho phiếu 8 lỗi (đồng ý hết) | đếm bấm + modal | 24 → ≤ 5 |
| Thao tác Chuyên viên nghiệm thu 8 lỗi | đếm bấm | 8 → ≤ 2 |
| Thời gian lập kế hoạch tháng 50 nhà hàng | bấm giờ | giảm ≥ 70% (sao chép + thêm hàng loạt) |
| Phiếu quá ngày dự kiến chưa chấm | báo cáo | có số liệu, giảm theo tháng |
| CHT quá hạn phản hồi / khắc phục | báo cáo | giảm theo tháng |
| Thông báo / người / ngày | đếm bảng notifications | giảm sau N32, không mất việc |

## 12. Kiểm tra bắt buộc
- Backend: test cho từng API hàng loạt (quyền, trạng thái, lô có dòng lỗi, lịch sử từng lỗi, +1 tần suất đúng số lỗi); `./mvnw -q verify`.
- Frontend: typecheck/lint/build; mở thử ở 375px và 1440px; chạy lại 6 bước PDF bằng tài khoản dev và đếm thao tác (bảng §11).
- Đối chiếu PDF: không bước kiểm soát nào bị bỏ (xác nhận từng lỗi vẫn có ở dạng chọn nhiều; khiếu nại vẫn từng lỗi; nghiệm thu vẫn từng lỗi trong một màn).
