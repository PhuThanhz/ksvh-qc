-- Thêm cột last_login_at vào bảng users để theo dõi thời điểm đăng nhập gần nhất
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Khởi tạo dữ liệu thời điểm đăng nhập gần nhất từ bảng refresh_tokens
UPDATE users u
SET last_login_at = sub.max_created
FROM (
    SELECT user_id, max(created_at) as max_created
    FROM refresh_tokens
    GROUP BY user_id
) sub
WHERE u.id = sub.user_id AND u.last_login_at IS NULL;
