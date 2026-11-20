-- Bỏ phần chú thích trong ngoặc đơn ở trường full_name của users, audit_logs và employees
UPDATE users
SET full_name = trim(regexp_replace(full_name, '\s*\(.*?\)', '', 'g'))
WHERE full_name LIKE '%(%';

UPDATE audit_logs
SET user_full_name = trim(regexp_replace(user_full_name, '\s*\(.*?\)', '', 'g'))
WHERE user_full_name LIKE '%(%';

UPDATE employees
SET full_name = trim(regexp_replace(full_name, '\s*\(.*?\)', '', 'g'))
WHERE full_name LIKE '%(%';
