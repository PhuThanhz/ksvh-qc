-- ============================================================================
-- V20261120_2100__seed_massive_enterprise_rich_data.sql
-- ĐỔ ĐẦY VÀ ĐA DẠNG HOÁ DỮ LIỆU TOÀN DIỆN CHO HỆ THỐNG KSVH QC
-- Bao gồm: Lỗi theo đủ mọi trạng thái vòng đời (Chờ xác nhận, Khiếu nại, Họp phúc tra,
-- Đang khắc phục, Quá hạn, Chờ nghiệm thu, Bác bỏ), Hội đồng phúc tra (appeal_reviews),
-- Thông báo thời gian thực phong phú, và Nhật ký kiểm toán audit_logs.
-- ============================================================================

DO $$
DECLARE
    v_admin_id     BIGINT;
    v_lead_id      BIGINT;
    v_manager_id   BIGINT;
    v_inspector_id BIGINT;
    v_store_id     BIGINT;
    v_obm_id       BIGINT;
    v_exec_id      BIGINT;
BEGIN
    SELECT id INTO v_admin_id     FROM users WHERE username = 'admin' LIMIT 1;
    SELECT id INTO v_lead_id      FROM users WHERE username = 'lead' LIMIT 1;
    SELECT id INTO v_manager_id   FROM users WHERE username = 'manager' LIMIT 1;
    SELECT id INTO v_inspector_id FROM users WHERE username = 'inspector' LIMIT 1;
    SELECT id INTO v_store_id     FROM users WHERE username = 'store' LIMIT 1;
    SELECT id INTO v_obm_id       FROM users WHERE username = 'obm' LIMIT 1;
    SELECT id INTO v_exec_id      FROM users WHERE username = 'executive' LIMIT 1;

    -- ========================================================================
    -- 1. CẬP NHẬT TRẠNG THÁI VÒNG ĐỜI CHO CÁC PHÁT HIỆN GẦN ĐÂY (TỪ ID 250 - 281)
    -- ========================================================================

    -- A. NHÓM OPEN (Chờ Cửa hàng trưởng xác nhận lỗi mới phát hiện)
    UPDATE findings
    SET status = 'OPEN',
        appeal_reason = NULL,
        appeal_evidence_urls = NULL,
        remediation_plan = NULL,
        remediation_evidence_urls = NULL,
        updated_at = now() - INTERVAL '3 hours'
    WHERE id IN (278, 279, 280, 281);

    -- B. NHÓM CONFIRMED (Cửa hàng đã xác nhận, đang trong thời hạn lập kế hoạch khắc phục)
    UPDATE findings
    SET status = 'CONFIRMED',
        updated_at = now() - INTERVAL '1 day'
    WHERE id IN (271, 272, 274, 277);

    -- C. NHÓM APPEALED (Cửa hàng đã nộp đơn khiếu nại, chờ Trưởng nhóm KSVH thụ lý)
    UPDATE findings
    SET status = 'APPEALED',
        appeal_round = 1,
        appeal_reason = CASE
            WHEN id = 268 THEN 'Nhà hàng đã thay dầu chiên mới theo định kỳ vào lúc 10h sáng. Kết quả đo phân cực TPM của đoàn kiểm tra có thể do que đo dính cặn bột chiên từ mẻ trước.'
            WHEN id = 269 THEN 'Đèn diệt côn trùng vừa được gửi đi bảo hành thay bóng ngày 12/11 (có phiếu tiếp nhận của nhà cung cấp kèm theo).'
            ELSE 'Cơ sở khẳng định thiết bị kiểm thực và cân điện tử có tem kiểm định đo lường còn hạn đến hết tháng 12/2026. Đề nghị xem xét lại.'
        END,
        appeal_evidence_urls = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800',
        appeal_submitted_at = now() - INTERVAL '1 day 4 hours',
        updated_at = now() - INTERVAL '1 day'
    WHERE id IN (268, 269, 273);

    -- D. NHÓM APPEAL_MEETING (Đang trong hội đồng họp phúc tra đa bên KSVH + OBM + CHT)
    UPDATE findings
    SET status = 'APPEAL_MEETING',
        appeal_round = 1,
        appeal_reason = CASE
            WHEN id = 270 THEN 'Nhà hàng khẳng định hệ thống hút mùi và PCCC đã được tòa nhà bảo trì vào ngày 10/11. Khói xuất hiện do quạt hút bị nhảy aptomat tạm thời trong giờ cao điểm.'
            WHEN id = 275 THEN 'Sự cố mất điện cục bộ tại trung tâm thương mại khiến tủ mát tăng nhiệt độ trong 30 phút. Ngay sau đó cơ sở đã chuyển thực phẩm sang tủ dự phòng.'
            ELSE 'Thớt sơ chế thực phẩm chín đã được tiệt trùng bằng đèn UV theo đúng quy trình 5S. Vệt ố trên bề mặt là do nhựa rau củ quả tự nhiên, không phải nấm mốc hay mất vệ sinh.'
        END,
        appeal_evidence_urls = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
        appeal_submitted_at = now() - INTERVAL '2 days',
        updated_at = now() - INTERVAL '12 hours'
    WHERE id IN (270, 275, 276);

    -- E. NHÓM REMEDIATING - QUÁ HẠN (OVERDUE: Hạn khắc phục < hiện tại để kích hoạt cảnh báo đỏ trên KPI dashboard)
    UPDATE findings
    SET status = 'REMEDIATING',
        deadline_date = CURRENT_DATE - 3,
        remediation_target_date = CURRENT_DATE - 3,
        remediation_plan = 'Đang chờ hãng gửi linh kiện thay thế cảm biến nhiệt độ tủ bảo quản từ Nhật Bản.',
        updated_at = now() - INTERVAL '4 days'
    WHERE id IN (260, 261, 262, 263);

    -- F. NHÓM REMEDIATING - ĐÚNG HẠN (ON-TRACK: Đang triển khai khắc phục)
    UPDATE findings
    SET status = 'REMEDIATING',
        deadline_date = CURRENT_DATE + 5,
        remediation_target_date = CURRENT_DATE + 4,
        remediation_plan = 'Đã đặt mua thớt kháng khuẩn chuẩn màu HACCP mới và tổ chức họp chấn chỉnh toàn bộ nhân viên ca bếp.',
        updated_at = now() - INTERVAL '1 day'
    WHERE id IN (264, 265, 266, 267);

    -- G. NHÓM PENDING_VERIFICATION (Cửa hàng đã nộp báo cáo hoàn thành khắc phục, chờ KSVH nghiệm thu)
    UPDATE findings
    SET status = 'PENDING_VERIFICATION',
        remediation_plan = 'Đã tổng vệ sinh toàn bộ khu vực bẫy mỡ, bảo dưỡng đường ống thoát sàn và thay mới tấm lưới chắn rác inox 304.',
        remediation_evidence_urls = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800,https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800',
        remediation_submitted_at = now() - INTERVAL '6 hours',
        updated_at = now() - INTERVAL '6 hours'
    WHERE id IN (257, 258, 259);

    -- H. NHÓM DISMISSED (Khiếu nại thành công, Trưởng phòng KSVH đã phê duyệt bác bỏ lỗi)
    UPDATE findings
    SET status = 'DISMISSED',
        appeal_conclusion = 'DISMISSED',
        appeal_concluded_by = v_manager_id,
        updated_at = now() - INTERVAL '3 days'
    WHERE id IN (254, 255, 256);

    -- ========================================================================
    -- 2. BỔ SUNG Ý KIẾN HỘI ĐỒNG PHÚC TRA (APPEAL_REVIEWS)
    -- ========================================================================
    DELETE FROM appeal_reviews WHERE finding_id IN (270, 275, 276);

    -- Hội đồng phúc tra cho Finding 270 (MK-HN01)
    INSERT INTO appeal_reviews (finding_id, reviewer_id, is_ksvh_rep, verdict, comment, reviewed_at, appeal_round, created_at, updated_at)
    VALUES
        (270, v_obm_id, false, 'FINDING_INVALID', 'OBM xác nhận đã kiểm tra hợp đồng bảo trì PCCC của BQL tòa nhà. Đề nghị KSVH xem xét giảm mức xuống M2 hoặc huỷ lỗi.', now() - INTERVAL '1 day', 1, now() - INTERVAL '1 day', now() - INTERVAL '1 day'),
        (270, v_lead_id, true, 'PENDING', 'KSVH đang yêu cầu chuyên viên kiểm tra trích xuất video camera đối chứng tại thời điểm lập biên bản.', now() - INTERVAL '18 hours', 1, now() - INTERVAL '18 hours', now() - INTERVAL '18 hours');

    -- Hội đồng phúc tra cho Finding 275 (YSH-NTMK)
    INSERT INTO appeal_reviews (finding_id, reviewer_id, is_ksvh_rep, verdict, comment, reviewed_at, appeal_round, created_at, updated_at)
    VALUES
        (275, v_obm_id, false, 'FINDING_INVALID', 'Nhà hàng đã xuất trình biên bản cắt điện kỹ thuật đột xuất của Điện lực Quận 1. Đề nghị KSVH chấp thuận khiếu nại.', now() - INTERVAL '1 day 2 hours', 1, now() - INTERVAL '1 day 2 hours', now() - INTERVAL '1 day 2 hours'),
        (275, v_lead_id, true, 'FINDING_VALID', 'Tại thời điểm kiểm tra thực tế, thực phẩm đông lạnh đã có dấu hiệu rã đông chảy dịch, tiềm ẩn nguy cơ nhiễm khuẩn cao. Ý kiến KSVH: Giữ nguyên lỗi.', now() - INTERVAL '12 hours', 1, now() - INTERVAL '12 hours', now() - INTERVAL '12 hours');

    -- Hội đồng phúc tra cho Finding 276 (YSH-NTMK)
    INSERT INTO appeal_reviews (finding_id, reviewer_id, is_ksvh_rep, verdict, comment, reviewed_at, appeal_round, created_at, updated_at)
    VALUES
        (276, v_obm_id, false, 'FINDING_INVALID', 'Cơ sở đã giải trình rõ ràng và có hình ảnh chứng minh quy trình tiệt trùng. Đề xuất chấp thuận khiếu nại.', now() - INTERVAL '20 hours', 1, now() - INTERVAL '20 hours', now() - INTERVAL '20 hours');

    -- ========================================================================
    -- 3. BỔ SUNG LỊCH SỬ SỰ KIỆN PHÁT HIỆN (FINDING_EVENTS)
    -- ========================================================================
    INSERT INTO finding_events (finding_id, action, from_status, to_status, actor_id, note, created_at)
    VALUES
        (268, 'APPEALED', 'CONFIRMED', 'APPEALED', v_store_id, 'Cửa hàng nộp đơn khiếu nại kèm hình ảnh que đo TPM', now() - INTERVAL '1 day 4 hours'),
        (269, 'APPEALED', 'CONFIRMED', 'APPEALED', v_store_id, 'Cửa hàng nộp đơn khiếu nại kèm phiếu bảo hành đèn diệt côn trùng', now() - INTERVAL '1 day 4 hours'),
        (270, 'APPEAL_MEETING', 'APPEALED', 'APPEAL_MEETING', v_lead_id, 'Chuyển hội đồng phúc tra họp đánh giá đa bên', now() - INTERVAL '1 day'),
        (275, 'APPEAL_MEETING', 'APPEALED', 'APPEAL_MEETING', v_lead_id, 'Chuyển hội đồng phúc tra họp xem xét biên bản điện lực', now() - INTERVAL '1 day'),
        (276, 'APPEAL_MEETING', 'APPEALED', 'APPEAL_MEETING', v_lead_id, 'Chuyển hội đồng phúc tra xem xét giải trình tiệt trùng', now() - INTERVAL '1 day'),
        (260, 'OVERDUE', 'REMEDIATING', 'REMEDIATING', NULL, 'Hệ thống tự động ghi nhận quá hạn khắc phục (3 ngày)', now() - INTERVAL '3 days'),
        (261, 'OVERDUE', 'REMEDIATING', 'REMEDIATING', NULL, 'Hệ thống tự động ghi nhận quá hạn khắc phục (3 ngày)', now() - INTERVAL '3 days'),
        (257, 'REMEDIATION_SUBMITTED', 'REMEDIATING', 'PENDING_VERIFICATION', v_store_id, 'Cửa hàng nộp báo cáo hoàn tất khắc phục và ảnh nghiệm thu', now() - INTERVAL '6 hours'),
        (258, 'REMEDIATION_SUBMITTED', 'REMEDIATING', 'PENDING_VERIFICATION', v_store_id, 'Cửa hàng nộp báo cáo hoàn tất khắc phục và ảnh nghiệm thu', now() - INTERVAL '6 hours'),
        (259, 'REMEDIATION_SUBMITTED', 'REMEDIATING', 'PENDING_VERIFICATION', v_store_id, 'Cửa hàng nộp báo cáo hoàn tất khắc phục và ảnh nghiệm thu', now() - INTERVAL '6 hours'),
        (254, 'APPEAL_DISMISSED', 'APPEAL_MEETING', 'DISMISSED', v_manager_id, 'Trưởng phòng KSVH chấp thuận khiếu nại và ban hành quyết định bác bỏ lỗi', now() - INTERVAL '3 days'),
        (255, 'APPEAL_DISMISSED', 'APPEAL_MEETING', 'DISMISSED', v_manager_id, 'Trưởng phòng KSVH chấp thuận khiếu nại và ban hành quyết định bác bỏ lỗi', now() - INTERVAL '3 days');

    -- ========================================================================
    -- 4. BỔ SUNG THÔNG BÁO THỜI GIAN THỰC (NOTIFICATIONS)
    -- ========================================================================
    INSERT INTO notifications (user_id, type, title, body, link, read_at, created_at)
    VALUES
        -- Thông báo cho Quản trị viên (admin)
        (v_admin_id, 'SYSTEM', 'Sao lưu dữ liệu định kỳ hoàn tất', 'Hệ thống đã tự động sao lưu toàn bộ cơ sở dữ liệu và media lúc 02:00 sáng thành công.', '/audit-logs', now() - INTERVAL '8 hours', now() - INTERVAL '8 hours'),
        (v_admin_id, 'PLAN_SUBMITTED', 'Dự thảo Kế hoạch Tháng 12/2026 cần phê duyệt', 'Trưởng nhóm KSVH Lê Quốc Tuấn đã trình duyệt Kế hoạch KSVH Cao điểm Noel & Tết 2027.', '/plans', NULL, now() - INTERVAL '2 hours'),

        -- Thông báo cho Trưởng phòng KSVH (manager)
        (v_manager_id, 'APPEAL_MEETING_REQUIRED', 'Hội đồng phúc tra cần kết luận: YSH-NTMK', 'Lỗi [TC-VS-01] tại Yoshinoya Nguyễn Thị Minh Khai đang chờ Trưởng phòng chủ trì biểu quyết kết luận.', '/findings/275', NULL, now() - INTERVAL '1 hour'),
        (v_manager_id, 'FINDING_M4_ALERT', 'Cảnh báo vi phạm nghiêm trọng M4 tại YSH-NTMK', 'Phát hiện lỗi mức M4: Nhiệt độ bảo quản thực phẩm đông lạnh không đạt chuẩn (-18°C đến -22°C).', '/findings/276', NULL, now() - INTERVAL '1 day'),
        (v_manager_id, 'PLAN_SUBMITTED', 'Kế hoạch kiểm tra chuyên đề Kho Lạnh Tháng 12/2026', 'Trưởng nhóm KSVH đã gửi kế hoạch chuyên đề 35 nhà hàng, đang chờ phê duyệt.', '/plans', NULL, now() - INTERVAL '3 hours'),

        -- Thông báo cho Trưởng nhóm KSVH (lead)
        (v_lead_id, 'FINDING_APPEALED', 'Nhà hàng nộp đơn khiếu nại: MK-CRM', 'Marukame Udon Crescent Mall đã gửi khiếu nại cho lỗi [TC-VS-03]. Vui lòng thụ lý hồ sơ.', '/findings/268', NULL, now() - INTERVAL '4 hours'),
        (v_lead_id, 'REMEDIATION_SUBMITTED', 'Nhà hàng nộp minh chứng khắc phục: MK-BT', 'Marukame Udon Bến Thành đã hoàn thành khắc phục lỗi [TC-VC-02], chờ KSVH phân công nghiệm thu.', '/findings/257', NULL, now() - INTERVAL '5 hours'),
        (v_lead_id, 'FINDING_OVERDUE', 'Cảnh báo lỗi quá hạn khắc phục tại USS-TD', 'Lỗi an toàn thiết bị tại Ussina Thảo Điền đã quá hạn 3 ngày mà cơ sở chưa nộp báo cáo hoàn thành.', '/findings/260', NULL, now() - INTERVAL '6 hours'),

        -- Thông báo cho Chuyên viên KSVH (inspector)
        (v_inspector_id, 'INSPECTION_ASSIGNED', 'Bạn được phân công kiểm tra tại CoCo Ichibanya LM81', 'Lịch kiểm tra định kỳ đã được phê duyệt cho ngày 22/11/2026.', '/inspections', NULL, now() - INTERVAL '1 hour'),
        (v_inspector_id, 'FINDING_VERIFIED', 'Nhiệm vụ hậu kiểm nghiệm thu tại MK-BT', 'Trưởng nhóm KSVH đã giao nhiệm vụ kiểm tra nghiệm thu khắc phục lỗi vệ sinh bẫy mỡ tại MK-BT.', '/inspections', NULL, now() - INTERVAL '3 hours'),

        -- Thông báo cho Cửa hàng trưởng (store)
        (v_store_id, 'INSPECTION_SUBMITTED', 'Phiếu kiểm tra mới cần ký biên bản điện tử', 'Đoàn KSVH đã hoàn tất buổi đánh giá tại cơ sở. Vui lòng kiểm tra và xác nhận biên bản trong vòng 24h.', '/inspections', NULL, now() - INTERVAL '2 hours'),
        (v_store_id, 'FINDING_REMINDER_DUE', 'Nhắc nhở: Hạn khắc phục lỗi [TC-VS-04] còn 2 ngày', 'Vui lòng hoàn tất thay mới thớt màu theo chuẩn và tải ảnh bằng chứng trước ngày 22/11.', '/findings/278', NULL, now() - INTERVAL '4 hours'),

        -- Thông báo cho OBM (obm)
        (v_obm_id, 'FINDING_M4_ALERT', 'Cảnh báo vi phạm mức M4 trong khu vực quản lý', 'Nhà hàng Yoshinoya Nguyễn Thị Minh Khai vừa bị lập biên bản lỗi M4 về bảo quản thực phẩm.', '/findings/275', NULL, now() - INTERVAL '1 day'),
        (v_obm_id, 'APPEAL_MEETING_REQUIRED', 'Mời tham gia họp phúc tra trực tuyến', 'Cuộc họp phúc tra khiếu nại của MK-HN01 sẽ diễn ra vào lúc 14:00 chiều mai.', '/findings/270', NULL, now() - INTERVAL '2 hours'),

        -- Thông báo cho Ban Giám đốc (executive)
        (v_exec_id, 'PLAN_APPROVED', 'Kế hoạch KSVH Tháng 11/2026 đang triển khai đạt 92%', 'Toàn bộ 41/45 nhà hàng mục tiêu trong tháng 11 đã được hoàn thành kiểm tra với tỷ lệ tuân thủ bình quân 92.1%.', '/dashboard', now() - INTERVAL '1 day', now() - INTERVAL '1 day');

    -- ========================================================================
    -- 5. BỔ SUNG NHẬT KÝ KIỂM TOÁN PHONG PHÚ (AUDIT_LOGS)
    -- ========================================================================
    INSERT INTO audit_logs (created_at, user_id, username, user_full_name, action, target_type, target_id, summary, ip_address, details)
    VALUES
        (now() - INTERVAL '1 hour', v_inspector_id, 'inspector', 'Võ Thành Đạt', 'INSPECTION_SUBMIT', 'INSPECTION', '226', 'Gửi kết quả kiểm tra định kỳ tại Yoshinoya Vạn Hạnh Mall (Phát hiện 2 lỗi)', '192.168.1.45', '{"score": 94, "fail_items": 2, "checkin_distance_m": 18.5}'),
        (now() - INTERVAL '2 hours', v_store_id, 'store', 'Đặng Thu Thảo', 'FINDING_APPEAL', 'FINDING', '268', 'Cửa hàng nộp đơn khiếu nại lỗi chỉ số TPM dầu chiên tại Marukame Udon', '118.69.182.50', '{"appeal_round": 1, "evidence_count": 1}'),
        (now() - INTERVAL '3 hours', v_lead_id, 'lead', 'Lê Quốc Tuấn', 'PLAN_SUBMIT', 'INSPECTION_PLAN', 'KH-202612-001', 'Trình duyệt Kế hoạch KSVH Cao điểm Giáng Sinh Tháng 12/2026', '192.168.1.12', '{"restaurants": 48, "inspectors": 6}'),
        (now() - INTERVAL '4 hours', v_manager_id, 'manager', 'Phạm Hồng Sơn', 'APPEAL_CONCLUDE', 'FINDING', '254', 'Ban hành quyết định bác bỏ lỗi (khiếu nại được chấp thuận)', '192.168.1.10', '{"conclusion": "DISMISSED", "finding_id": 254}'),
        (now() - INTERVAL '5 hours', v_admin_id, 'admin', 'Nguyễn Hoàng Minh', 'ROLE_PERMISSION_UPDATE', 'ROLE', 'STORE_MANAGER', 'Cập nhật phân quyền xem báo cáo tuân thủ nội bộ cho vai trò Cửa hàng trưởng', '192.168.1.2', '{"role": "STORE_MANAGER", "added_permissions": ["REPORT_READ_STORE"]}'),
        (now() - INTERVAL '6 hours', v_inspector_id, 'inspector', 'Võ Thành Đạt', 'INSPECTION_CHECKIN', 'INSPECTION', '226', 'Check-in GPS hợp lệ tại toạ độ (10.7699, 106.6687), sai số 18m', '14.161.22.88', '{"latitude": 10.7699, "longitude": 106.6687, "status": "VERIFIED"}'),
        (now() - INTERVAL '8 hours', v_obm_id, 'obm', 'Hoàng Gia Bảo', 'APPEAL_REVIEW', 'FINDING', '270', 'Nộp phiếu đánh giá ý kiến phúc tra: Đề nghị KSVH xem xét huỷ lỗi', '115.79.138.22', '{"verdict": "FINDING_INVALID"}'),
        (now() - INTERVAL '12 hours', v_exec_id, 'executive', 'Lý Nhật Nam', 'DASHBOARD_EXPORT', 'REPORT', 'MONTHLY_2026_11', 'Xuất báo cáo tổng hợp chỉ số tuân thủ toàn quốc định dạng Excel', '14.241.112.5', '{"format": "XLSX", "period": "2026-11"}'),
        (now() - INTERVAL '1 day', v_manager_id, 'manager', 'Phạm Hồng Sơn', 'PLAN_APPROVE', 'INSPECTION_PLAN', 'KH-202611-002', 'Phê duyệt Kế hoạch kiểm tra Fine Dining & Miền Bắc Tháng 11/2026', '192.168.1.10', '{"plan_id": "KH-202611-002", "status": "APPROVED"}');

END $$;
