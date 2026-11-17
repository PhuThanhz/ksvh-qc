# Việc còn thiếu so với ROADMAP (rà lại 17/11/2026)

ROADMAP.md ghi cả 10 plan "ĐÃ HOÀN THÀNH", nhưng đối chiếu code thật thì còn thiếu các mục dưới đây.
Làm **sau** `docs/PLAN_FIX_FLOW_REVIEW.md` (4 lỗi/luồng). Đọc `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md` trước.
Không thêm thư viện lớn khi chưa hỏi người dùng (CLAUDE.md). Hoàn thành mỗi mục: backend `./mvnw -q verify`, frontend `typecheck/lint/build`,
cập nhật trạng thái thật vào ROADMAP.md (ghi "ĐÃ HOÀN THÀNH" chỉ khi đủ mục).

---

## A. Plan 3 – Font PDF vi phạm bản quyền (ƯU TIÊN CAO)
- `backend/src/main/resources/fonts/Arial.ttf`, `Arial-Bold.ttf` là font thương mại của Microsoft, **không được phép phân phối** trong repo/phần mềm.
- Thay bằng font mã nguồn mở có tiếng Việt, giấy phép SIL OFL: **Be Vietnam Pro** hoặc **Noto Sans** (Regular + Bold). Hỏi người dùng chọn font.
  Thêm file `OFL.txt` cạnh font. Sửa code nạp font (tìm `Arial` trong `backend/src/main/java`). Xoá 2 file Arial khỏi repo.
- Kiểm tra: xuất PDF phiếu chấm và biên bản M4 hiển thị đúng dấu tiếng Việt.

## B. Plan 6 – Điện thoại & ngoại tuyến (mới làm một phần)
Đã có: lưu nháp kết quả chấm bằng `localStorage` (`InspectionExecutionPage`, khoá `qc_draft_ins_`). Còn thiếu so với ROADMAP:
1. **Ảnh chụp khi mất mạng**: hàng đợi ảnh chờ upload (IndexedDB – ảnh lớn, không để trong localStorage), tự upload lại khi có mạng; nút gửi phiếu
   chỉ bật khi mọi ảnh đã upload xong. Hiển thị trạng thái "Đang offline / còn N ảnh chờ".
2. **Video bằng chứng**: `MediaService` hiện chỉ nhận `image/jpeg|png|webp`. Thêm `video/mp4` (+ `video/quicktime` nếu cần), giới hạn dung lượng riêng
   (Q10 chưa chốt → mặc định 50 MB, ~60 giây, ghi rõ "chờ KSVH xác nhận"); `EvidenceService.KEY` chấp nhận đuôi video; frontend cho chọn quay video,
   hiển thị video trong `EvidenceGallery`.
3. **PWA**: `manifest.webmanifest` (tên KSVH QC, icon 192/512, `display: standalone`, `start_url: /qc`) + service worker chỉ cache tài nguyên tĩnh
   (không cache API có dữ liệu cá nhân). `vite-plugin-pwa` là thư viện mới → hỏi người dùng trước; nếu không, viết service worker tay tối giản.
4. **Màn "Việc của tôi" cho CHT** trên `/qc`: gom lỗi cần xác nhận, cần lập kế hoạch, sắp quá hạn, phiếu chờ xác nhận đã xem, khiếu nại chờ thẩm định
   (dùng API sẵn có, chỉ ghép giao diện).

## C. Plan 9 – Bảo mật triển khai (còn thiếu)
Đã có: Dockerfile, docker-compose, backup/restore, tắt Swagger ở prod, cookie `secure` + `SameSite=Strict`, `frameOptions deny`.
Còn thiếu:
1. **Giới hạn đăng nhập sai**: khoá tạm theo username + IP (vd 5 lần / 15 phút) – làm trong module `auth` bằng bảng hoặc bộ nhớ, không cần thư viện mới.
   Trả lỗi tiếng Việt, ghi audit log. Test: lần thứ 6 bị chặn.
2. **Header bảo mật**: HSTS (prod), `Content-Security-Policy` cơ bản, `Referrer-Policy`, `X-Content-Type-Options` trong `SecurityConfig` (hoặc ở reverse proxy
   trong docker-compose – ghi rõ chọn chỗ nào).
3. CORS prod chỉ cho domain thật lấy từ biến môi trường (kiểm tra `application-prod.yml`).
4. README: mục triển khai (biến môi trường bắt buộc, chạy compose, backup/restore, đổi mật khẩu admin mặc định).

## D. Plan 7 – Toàn vẹn dữ liệu
- Mục "rà quy tắc bất biến" chưa đạt: bỏ lỗi đang sửa kết quả chấm gốc → đã đưa vào `PLAN_FIX_FLOW_REVIEW.md` việc 2.
- Sau khi sửa: viết **test chốt** đảm bảo không API nào đổi `inspection_items.result/comment/evidence_urls` sau khi phiếu `SUBMITTED`
  (chạy hết luồng: xác nhận, khiếu nại giữ/bỏ, khắc phục, nghiệm thu, quá hạn → so sánh trước/sau).

## E. Plan 4 & Plan 10 – Phụ thuộc Phòng KSVH (agent KHÔNG tự đóng được)
Câu hỏi còn mở trong DOMAIN_SPEC §8: **Q2, Q3, Q5, Q6, Q7, Q9, Q10, Q11, Q12** (đã chốt Q1, Q4, Q8).
- Plan 4: cách đếm tần suất (Q2 – lỗi nhiều lần trong một vòng, Q3 – tháng dương lịch hay 180 ngày) đang chạy theo **giả định**.
- Plan 10: "nghiệm thu với Phòng KSVH", nhập dữ liệu thật (70 tiêu chí, nhà hàng, người dùng) và chạy thử 1 tháng **cần người thật**.
Việc agent làm được:
1. Sửa ROADMAP.md: Plan 4 và Plan 10 đổi thành "XONG PHẦN KỸ THUẬT – CHỜ KSVH XÁC NHẬN", liệt kê câu hỏi đang chờ.
2. Viết `docs/QUESTIONS_FOR_KSVH.md`: mỗi câu hỏi Q2…Q12 – câu hỏi ngắn gọn, phần mềm đang làm theo giả định gì, ví dụ minh hoạ, ô trả lời –
   để người dùng gửi Phòng KSVH.
3. Viết `docs/UAT_CHECKLIST.md`: kịch bản nghiệm thu theo 6 bước PDF cho từng vai trò (Trưởng nhóm, Quản lý, Chuyên viên, CHT, OBM, BGĐ),
   mỗi bước: thao tác, kết quả mong đợi, ô Đạt/Không đạt.

---

## Thứ tự
1. `PLAN_FIX_FLOW_REVIEW.md` (4 việc) → 2. Mục A (font) → 3. Mục C (bảo mật) → 4. Mục D (test bất biến) → 5. Mục B (điện thoại) → 6. Mục E (tài liệu cho KSVH).
