-- 8 vai trò theo tài liệu nghiệp vụ (docs/DOMAIN_SPEC.md §2) và bộ permission mới (§2.1).
-- Role cũ được ĐỔI MÃ (không xoá) để người dùng đang có giữ nguyên quyền tương ứng:
--   ADMIN → SYSTEM_ADMIN, MANAGER → KSVH_MANAGER, AUDITOR → KSVH_INSPECTOR.

ALTER TABLE roles ADD COLUMN description VARCHAR(255);
COMMENT ON COLUMN roles.description IS 'Mô tả công việc của vai trò';

UPDATE roles SET code = 'SYSTEM_ADMIN', name = 'Quản trị hệ thống', updated_at = now() WHERE code = 'ADMIN';
UPDATE roles SET code = 'KSVH_MANAGER', name = 'Quản lý KSVH', updated_at = now() WHERE code = 'MANAGER';
UPDATE roles SET code = 'KSVH_INSPECTOR', name = 'Chuyên viên KSVH', updated_at = now() WHERE code = 'AUDITOR';

INSERT INTO roles (code, name)
VALUES ('BUSINESS_ADMIN', 'Quản trị nghiệp vụ'),
       ('KSVH_LEAD', 'Trưởng nhóm KSVH'),
       ('STORE_MANAGER', 'Cửa hàng trưởng'),
       ('OBM', 'OBM'),
       ('EXECUTIVE', 'Ban Giám đốc')
ON CONFLICT (code) DO NOTHING;

UPDATE roles r
SET description = d.description
FROM (VALUES ('SYSTEM_ADMIN', 'Ban Giải pháp: tạo tài khoản, phân quyền, cấu hình, theo dõi nhật ký'),
             ('BUSINESS_ADMIN', 'Phòng KSVH: cập nhật tiêu chí, mẫu phiếu chấm, mức rủi ro'),
             ('KSVH_LEAD', 'Phòng KSVH: lập kế hoạch kiểm tra, phân công Chuyên viên'),
             ('KSVH_MANAGER', 'Phòng KSVH: duyệt phân công, xem xét khiếu nại, chủ trì họp thống nhất'),
             ('KSVH_INSPECTOR', 'Phòng KSVH: chấm tiêu chí tại nhà hàng, nghiệm thu khắc phục'),
             ('STORE_MANAGER', 'Nhà hàng: xác nhận hoặc khiếu nại lỗi; lập và thực hiện khắc phục'),
             ('OBM', 'Vận hành: tham gia xem xét khiếu nại'),
             ('EXECUTIVE', 'Ban Giám đốc: xem kết quả kiểm tra, không chỉnh sửa dữ liệu'))
         AS d(code, description)
WHERE r.code = d.code;

-- Bỏ toàn bộ quyền cũ (location/checklist/audit…) rồi gán lại theo danh mục mới.
DELETE FROM role_permissions;

INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM roles r
         JOIN (VALUES
                   -- Quản trị hệ thống (Ban Giải pháp). Nhập dữ liệu tiêu chí ban đầu: gán thêm BUSINESS_ADMIN tạm thời.
                   ('SYSTEM_ADMIN', 'user:read'), ('SYSTEM_ADMIN', 'user:manage'), ('SYSTEM_ADMIN', 'role:manage'),
                   ('SYSTEM_ADMIN', 'system:config'), ('SYSTEM_ADMIN', 'system:log:read'),
                   ('SYSTEM_ADMIN', 'organization:read'), ('SYSTEM_ADMIN', 'organization:manage'),
                   ('SYSTEM_ADMIN', 'criteria:read'),

                   -- Quản trị nghiệp vụ
                   ('BUSINESS_ADMIN', 'organization:read'),
                   ('BUSINESS_ADMIN', 'criteria:read'), ('BUSINESS_ADMIN', 'criteria:manage'),
                   ('BUSINESS_ADMIN', 'inspection:read:all'), ('BUSINESS_ADMIN', 'report:read'),

                   -- Trưởng nhóm KSVH
                   ('KSVH_LEAD', 'user:read'), ('KSVH_LEAD', 'organization:read'), ('KSVH_LEAD', 'criteria:read'),
                   ('KSVH_LEAD', 'plan:read'), ('KSVH_LEAD', 'plan:create'),
                   ('KSVH_LEAD', 'inspection:read:all'),
                   ('KSVH_LEAD', 'report:read'), ('KSVH_LEAD', 'report:export'),

                   -- Quản lý KSVH
                   ('KSVH_MANAGER', 'user:read'), ('KSVH_MANAGER', 'organization:read'), ('KSVH_MANAGER', 'criteria:read'),
                   ('KSVH_MANAGER', 'plan:read'), ('KSVH_MANAGER', 'plan:approve'),
                   ('KSVH_MANAGER', 'inspection:read:all'), ('KSVH_MANAGER', 'inspection:cancel'),
                   ('KSVH_MANAGER', 'finding:review-appeal'), ('KSVH_MANAGER', 'finding:conclude-appeal'),
                   ('KSVH_MANAGER', 'report:read'), ('KSVH_MANAGER', 'report:export'),

                   -- Chuyên viên KSVH (có thể là đại diện KSVH trong hội đồng thẩm định)
                   ('KSVH_INSPECTOR', 'organization:read'), ('KSVH_INSPECTOR', 'criteria:read'),
                   ('KSVH_INSPECTOR', 'inspection:read:own'), ('KSVH_INSPECTOR', 'inspection:perform'),
                   ('KSVH_INSPECTOR', 'finding:verify'), ('KSVH_INSPECTOR', 'finding:review-appeal'),
                   ('KSVH_INSPECTOR', 'media:upload'),

                   -- Cửa hàng trưởng
                   ('STORE_MANAGER', 'inspection:read:own'),
                   ('STORE_MANAGER', 'finding:respond'), ('STORE_MANAGER', 'finding:remediate'),
                   ('STORE_MANAGER', 'media:upload'),

                   -- OBM
                   ('OBM', 'inspection:read:own'), ('OBM', 'finding:review-appeal'),

                   -- Ban Giám đốc: chỉ xem
                   ('EXECUTIVE', 'organization:read'), ('EXECUTIVE', 'criteria:read'),
                   ('EXECUTIVE', 'inspection:read:all'),
                   ('EXECUTIVE', 'report:read'), ('EXECUTIVE', 'report:export'))
    AS p(role_code, permission) ON p.role_code = r.code;
