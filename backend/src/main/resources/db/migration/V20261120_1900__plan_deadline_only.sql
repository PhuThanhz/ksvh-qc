-- ====================================================================
-- KẾ HOẠCH CHỈ GIAO HẠN HOÀN THÀNH
-- Kế hoạch chỉ còn "hạn hoàn thành" (end_date); start_date do server đặt = ngày tạo kế hoạch.
-- Dòng phân công không còn ngày kiểm tra cụ thể: chuyên viên tự sắp lịch, miễn xong trước hạn.
-- Kế hoạch cũ vẫn giữ ngày đã nhập (cột cho phép trống, không xoá dữ liệu).
-- ====================================================================

ALTER TABLE inspection_plan_assignments ALTER COLUMN scheduled_date DROP NOT NULL;

COMMENT ON COLUMN inspection_plan_assignments.scheduled_date IS
    'Ngày kiểm tra dự kiến (tuỳ chọn, kế hoạch cũ). Trống = chỉ cần xong trước hạn hoàn thành của kế hoạch (inspection_plans.end_date)';
COMMENT ON COLUMN inspection_plans.end_date IS 'Hạn hoàn thành kế hoạch: mọi phiếu chấm phải xong trước ngày này';
COMMENT ON COLUMN inspection_plans.start_date IS 'Ngày tạo kế hoạch (server đặt), dùng làm mốc đầu kỳ';
