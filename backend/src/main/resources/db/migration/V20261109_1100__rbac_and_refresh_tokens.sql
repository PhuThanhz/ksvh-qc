-- RBAC: một user nhiều role, role → nhiều permission (mã định nghĩa trong security.permission.Permission).
-- Refresh token: chỉ lưu SHA-256, xoay vòng theo family để phát hiện token bị đánh cắp.

CREATE TABLE roles
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(50)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE roles IS 'Vai trò người dùng';

CREATE TABLE role_permissions
(
    role_id    BIGINT       NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_id, permission)
);
COMMENT ON TABLE role_permissions IS 'Quyền của từng vai trò (mã dạng module:action)';

CREATE TABLE user_roles
(
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles (id) ON DELETE RESTRICT,
    PRIMARY KEY (user_id, role_id)
);
CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);
COMMENT ON TABLE user_roles IS 'Gán vai trò cho người dùng (một người nhiều vai trò)';

INSERT INTO roles (code, name)
VALUES ('ADMIN', 'Quản trị hệ thống'),
       ('MANAGER', 'Quản lý'),
       ('AUDITOR', 'Người chấm QC');

-- Bộ quyền khởi đầu; sẽ điều chỉnh theo tài liệu nghiệp vụ.
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM roles r
         JOIN (VALUES ('ADMIN', 'user:read'), ('ADMIN', 'user:manage'),
                      ('ADMIN', 'location:read'), ('ADMIN', 'location:manage'),
                      ('ADMIN', 'checklist:read'), ('ADMIN', 'checklist:manage'),
                      ('ADMIN', 'audit:read:own'), ('ADMIN', 'audit:read:all'),
                      ('ADMIN', 'audit:create'), ('ADMIN', 'audit:approve'),
                      ('ADMIN', 'report:read'), ('ADMIN', 'report:export'), ('ADMIN', 'media:upload'),

                      ('MANAGER', 'user:read'),
                      ('MANAGER', 'location:read'), ('MANAGER', 'location:manage'),
                      ('MANAGER', 'checklist:read'), ('MANAGER', 'checklist:manage'),
                      ('MANAGER', 'audit:read:all'), ('MANAGER', 'audit:approve'),
                      ('MANAGER', 'report:read'), ('MANAGER', 'report:export'), ('MANAGER', 'media:upload'),

                      ('AUDITOR', 'location:read'), ('AUDITOR', 'checklist:read'),
                      ('AUDITOR', 'audit:read:own'), ('AUDITOR', 'audit:create'), ('AUDITOR', 'media:upload'))
    AS p(role_code, permission) ON p.role_code = r.code;

-- Chuyển cột role cũ sang bảng user_roles rồi bỏ cột.
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
         JOIN roles r ON r.code = u.role;
ALTER TABLE users DROP COLUMN role;

-- Mật khẩu cũ là bcrypt thuần; thêm tiền tố {bcrypt} cho DelegatingPasswordEncoder.
UPDATE users SET password_hash = '{bcrypt}' || password_hash WHERE password_hash NOT LIKE '{%';

CREATE TABLE refresh_tokens
(
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash        VARCHAR(64) NOT NULL UNIQUE,
    family_id         UUID        NOT NULL,
    expires_at        TIMESTAMPTZ NOT NULL,
    family_expires_at TIMESTAMPTZ NOT NULL,
    rotated_at        TIMESTAMPTZ,
    revoked_at        TIMESTAMPTZ,
    user_agent        VARCHAR(255),
    ip_address        VARCHAR(45),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens (family_id);
CREATE INDEX idx_refresh_tokens_family_expires_at ON refresh_tokens (family_expires_at);
COMMENT ON TABLE refresh_tokens IS 'Refresh token (chỉ lưu SHA-256), xoay vòng theo family';
