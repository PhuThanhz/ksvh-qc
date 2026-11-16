-- Cấp quyền criteria:manage cho SYSTEM_ADMIN để Quản trị hệ thống toàn quyền cấu hình tiêu chí & mức rủi ro
INSERT INTO role_permissions (role_id, permission)
SELECT id, 'criteria:manage'
FROM roles
WHERE code = 'SYSTEM_ADMIN'
ON CONFLICT DO NOTHING;

