-- First, ensure the ADMIN role exists
INSERT INTO roles (name, description, created_at, updated_at)
SELECT 'ROLE_ADMIN', 'Administrator with full access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_ADMIN');

-- Then insert the admin user with hashed password
-- Password: admin2273 (hashed with BCrypt, cost=10)
INSERT INTO users (email, phone, password_hash, name, role_id, status, email_verified, created_at, updated_at)
SELECT 
    'admin2273@gmail.com',
    '1234567890',
    '$2a$10$XptfskLsT1l/bRTLRiiCgejHqOwNGxq0Vft3nmHdBPi6u2np5ZDPm', -- bcrypt hash of 'admin2273'
    'Admin User',
    (SELECT id FROM roles WHERE name = 'ROLE_ADMIN' LIMIT 1),
    'ACTIVE',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin2273@gmail.com');
