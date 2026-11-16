-- Quản trị người dùng / vai trò trên giao diện và hồ sơ nhân viên.
-- docs/DOMAIN_SPEC.md §2, §3 (danh mục 3–4).

-- 1. Vai trò: đánh dấu 8 vai trò gốc (nghiệp vụ dựa vào mã của chúng, không được xoá / đổi mã)
--    và ghi người sửa cuối.
ALTER TABLE roles ADD COLUMN system_role BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE roles ADD COLUMN updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX idx_roles_updated_by ON roles (updated_by);
COMMENT ON COLUMN roles.system_role IS 'Vai trò gốc theo tài liệu nghiệp vụ: không xoá, không đổi mã';
COMMENT ON COLUMN roles.updated_by IS 'Người sửa cuối (tên, mô tả, quyền)';

UPDATE roles
SET system_role = TRUE
WHERE code IN ('SYSTEM_ADMIN', 'BUSINESS_ADMIN', 'KSVH_LEAD', 'KSVH_MANAGER',
               'KSVH_INSPECTOR', 'STORE_MANAGER', 'OBM', 'EXECUTIVE');

-- 2. Người dùng: ghi người sửa cuối.
ALTER TABLE users ADD COLUMN updated_by BIGINT REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX idx_users_updated_by ON users (updated_by);
COMMENT ON COLUMN users.updated_by IS 'Người sửa cuối (thông tin, vai trò, khoá/mở, đặt lại mật khẩu)';

-- 3. Nhân viên: hồ sơ nhân sự, tách khỏi tài khoản đăng nhập. Một nhân viên có tối đa một tài khoản.
CREATE TABLE employees
(
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_code VARCHAR(30)  NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    job_title     VARCHAR(150),
    org_unit_id   BIGINT REFERENCES org_units (id) ON DELETE RESTRICT,
    phone         VARCHAR(20),
    email         VARCHAR(150),
    user_id       BIGINT UNIQUE REFERENCES users (id) ON DELETE RESTRICT,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by    BIGINT REFERENCES users (id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX uq_employees_code ON employees (lower(employee_code));
CREATE INDEX idx_employees_org_unit_id ON employees (org_unit_id);
CREATE INDEX idx_employees_updated_by ON employees (updated_by);
COMMENT ON TABLE employees IS 'Nhân viên: mã NV, chức danh, nhà hàng / phòng ban; có thể liên kết một tài khoản đăng nhập';

-- 4. Quyền mới cho nhân viên.
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM roles r
         JOIN (VALUES ('SYSTEM_ADMIN', 'employee:read'), ('SYSTEM_ADMIN', 'employee:manage'),
                      ('KSVH_LEAD', 'employee:read'),
                      ('KSVH_MANAGER', 'employee:read'))
    AS p(role_code, permission) ON p.role_code = r.code;
