# Kế hoạch: Khiếu nại nhiều người thẩm định + Thông báo nhắc việc

Trạng thái: **chờ trả lời câu hỏi rồi mới code** (lập 17/11/2026). Nguồn: DOMAIN_SPEC §4 bước 4, §8 Q6/Q9; PDF s.6, s.9–13.

---

## A. Khiếu nại có N người thẩm định (PDF s.12)

### Hiện trạng
CHT khiếu nại → **một** người có quyền `finding:conclude-appeal` chốt luôn Giữ lỗi / Bỏ lỗi.

### Luồng theo PDF
1. CHT gửi khiếu nại, **chọn N người thẩm định**; danh sách **bắt buộc có ≥ 1 đại diện KSVH**.
2. Mỗi người đánh giá: lỗi **đúng** hay **sai** (kèm nhận xét).
3. Tất cả thống nhất → tự chốt kết luận. Không thống nhất → **họp**, Quản lý KSVH chủ trì, nhập kết luận cuộc họp.
4. Kết luận: khiếu nại đúng → bỏ lỗi (DISMISSED, không +1); khiếu nại sai → giữ lỗi (CONFIRMED, +1).

### Thiết kế đề xuất
- **Bảng mới `appeal_reviews`**: `finding_id`, `reviewer_id`, `is_ksvh_rep`, `verdict` (`PENDING` / `FINDING_VALID` / `FINDING_INVALID`), `comment`, `reviewed_at`; unique (`finding_id`, `reviewer_id`).
- `findings` thêm `appeal_round` để khiếu nại lại (nếu cho phép) không lẫn phiếu đánh giá cũ.
- Trạng thái lỗi: giữ `APPEALED`; thêm trạng thái con **`APPEAL_MEETING`** khi có ý kiến trái chiều.
- API: CHT gửi khiếu nại kèm `reviewerIds`; người thẩm định `POST /findings/{id}/appeal-reviews` (chỉ người có tên trong danh sách); Quản lý KSVH `POST /findings/{id}/conclude-appeal` **chỉ khi** đang `APPEAL_MEETING` (nhập biên bản họp).
- Server tự chốt khi đủ phiếu và đồng thuận; mọi bước ghi `finding_events` (người, thời điểm).
- Giao diện: CHT chọn người thẩm định trong form khiếu nại; mục "Khiếu nại chờ tôi thẩm định"; Quản lý xem các phiếu cần họp.

### Câu hỏi cần Phòng KSVH trả lời (Q6)
1. CHT chọn người thẩm định từ **danh sách nào**? (vd: mọi người có vai trò KSVH + OBM của nhà hàng?)
2. **N tối thiểu / tối đa** là bao nhiêu? Ai được tính là "đại diện KSVH" (vai trò nào)?
3. Có **hạn xử lý khiếu nại** không? Quá hạn mà người thẩm định chưa đánh giá thì sao?
4. Chuyên viên đã chấm lỗi đó **có được** làm người thẩm định không (xung đột lợi ích)?
5. Một lỗi được khiếu nại **mấy lần**?

---

## B. Thông báo / nhắc việc (PDF s.9–13)

### Sự kiện cần thông báo
| Sự kiện | Người nhận |
|---|---|
| Kế hoạch gửi duyệt / bị từ chối / được duyệt | Quản lý KSVH / Trưởng nhóm |
| Phiếu được giao | Chuyên viên |
| Phiếu đã gửi, có lỗi / không lỗi | CHT (+ OBM) |
| Khiếu nại mới, cần thẩm định, cần họp | Người thẩm định, Quản lý KSVH |
| Lỗi sắp đến hạn khắc phục (vd trước 1 ngày), quá hạn (+1) | CHT, OBM |
| Bằng chứng khắc phục chờ nghiệm thu | Chuyên viên phụ trách |
| Lỗi mức M4 | Ban Giám đốc (Q12) |

### Thiết kế đề xuất (bước 1: trong ứng dụng)
- Module `notification`: bảng `notifications` (`user_id`, `type`, `title`, `body`, `link`, `read_at`, `created_at`).
- Các module phát **sự kiện miền** (Spring Modulith `ApplicationEvent`); `notification` lắng nghe và ghi thông báo, nên module nghiệp vụ không phụ thuộc trực tiếp module thông báo.
- API: danh sách của tôi, số chưa đọc, đánh dấu đã đọc. Giao diện: chuông trên header `/admin` và `/qc`.
- Job nhắc hạn: chạy cùng job quá hạn (00:05 hằng ngày).
- Bước 2 (sau khi chốt Q9): thêm kênh email / Zalo qua cùng sự kiện.

### Câu hỏi cần trả lời (Q9, Q12)
1. Kênh nào cần ngay: **chỉ trong ứng dụng**, hay thêm email / Zalo / SMS?
2. Nhắc trước hạn khắc phục **bao nhiêu ngày**? Nhắc lặp lại không?
3. Lỗi M4 có cần **tự sinh biên bản PDF** và gửi Ban Giám đốc không (Q12)?
4. OBM có nhận mọi thông báo của nhà hàng mình phụ trách không?
