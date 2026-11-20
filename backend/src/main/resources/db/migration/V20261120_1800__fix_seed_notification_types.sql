-- ====================================================================
-- SỬA LOẠI THÔNG BÁO TRONG DỮ LIỆU MẪU
-- Seed V20261120_0200 / V20261120_0230 chèn thông báo với các loại không có trong enum
-- NotificationType (Java) → Hibernate lỗi khi đọc (đăng nhập, chuông thông báo trả 500).
-- Đổi về loại thật gần nghĩa nhất, rồi thêm CHECK để DB từ chối loại lạ từ nay về sau
-- (quy ước dự án: enum @Enumerated(STRING) + CHECK).
-- ====================================================================

UPDATE notifications SET type = 'APPEAL_MEETING_REQUIRED' WHERE type = 'APPEAL_MEETING';
UPDATE notifications SET type = 'FINDING_APPEALED'        WHERE type = 'APPEAL_SUBMITTED';
UPDATE notifications SET type = 'FINDING_REMINDER_DUE'    WHERE type = 'FINDING_DEADLINE';
UPDATE notifications SET type = 'FINDING_M4_ALERT'        WHERE type = 'FINDING_ESCALATED';   -- cảnh báo nâng mức / tái phạm
UPDATE notifications SET type = 'INSPECTION_SUBMITTED'    WHERE type = 'INSPECTION_AWAITING'; -- biên bản chờ CHT ký nhận
UPDATE notifications SET type = 'SYSTEM'                  WHERE type = 'INSPECTION_COMPLETED';
UPDATE notifications SET type = 'INSPECTION_ASSIGNED'     WHERE type = 'PLAN_ASSIGNED';
UPDATE notifications SET type = 'SYSTEM'                  WHERE type = 'SYSTEM_BACKUP';
UPDATE notifications SET type = 'FINDING_VERIFIED'        WHERE type = 'VERIFY_PASSED';

-- Loại nào còn sót (ngoài enum) → SYSTEM, để ràng buộc dưới không lỗi
UPDATE notifications
SET type = 'SYSTEM'
WHERE type NOT IN ('PLAN_SUBMITTED', 'PLAN_APPROVED', 'PLAN_REJECTED', 'INSPECTION_ASSIGNED', 'INSPECTION_SUBMITTED',
                   'FINDING_APPEALED', 'APPEAL_MEETING_REQUIRED', 'FINDING_APPEAL_CONCLUDED', 'REMEDIATION_SUBMITTED',
                   'FINDING_VERIFIED', 'FINDING_REMINDER_DUE', 'FINDING_OVERDUE', 'FINDING_M4_ALERT', 'SYSTEM');

ALTER TABLE notifications
    ADD CONSTRAINT chk_notifications_type CHECK (type IN (
        'PLAN_SUBMITTED', 'PLAN_APPROVED', 'PLAN_REJECTED', 'INSPECTION_ASSIGNED', 'INSPECTION_SUBMITTED',
        'FINDING_APPEALED', 'APPEAL_MEETING_REQUIRED', 'FINDING_APPEAL_CONCLUDED', 'REMEDIATION_SUBMITTED',
        'FINDING_VERIFIED', 'FINDING_REMINDER_DUE', 'FINDING_OVERDUE', 'FINDING_M4_ALERT', 'SYSTEM'));
