-- ============================================================
--  MartManager Phase 4: Auth
--  Run: mysql -u root -p --default-character-set=utf8mb4 mart_manager < phase4_auth.sql
-- ============================================================

USE mart_manager;

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  phone      VARCHAR(30)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('ADMIN','MANAGER','CASHIER') NOT NULL DEFAULT 'CASHIER',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Delete old admin if exists, re-insert with correct hash
DELETE FROM users WHERE phone = '0000000000';

INSERT INTO users (name, phone, password, role) VALUES
  ('Admin', '0000000000', '$2b$12$2jqHfnpEeYI58Dzfeknx2eimYvP9AbjNE2c4BTndjMpcJ32R9X8ha', 'ADMIN');

SELECT id, name, phone, role FROM users;
