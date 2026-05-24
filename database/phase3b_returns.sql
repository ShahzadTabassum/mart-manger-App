-- ============================================================
--  MartManager — Returns & Exchange Schema (Fixed)
--  Run: mysql -u root -p --default-character-set=utf8mb4 mart_manager < phase3b_returns.sql
-- ============================================================

USE mart_manager;

-- Step 1: Update ALL existing employees to SALESMAN first (before changing ENUM)
UPDATE employees SET role = 'SALESMAN';

-- Step 2: Now safely change the ENUM to SALESMAN only
ALTER TABLE employees
  MODIFY COLUMN role ENUM('SALESMAN') NOT NULL DEFAULT 'SALESMAN';

-- Step 3: Remove PIN requirement (set default)
ALTER TABLE employees
  MODIFY COLUMN pin VARCHAR(6) NOT NULL DEFAULT '0000';

-- Step 4: Returns table
CREATE TABLE IF NOT EXISTS returns (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  return_number    VARCHAR(30)   NOT NULL UNIQUE,
  original_sale_id INT           DEFAULT NULL,
  type             ENUM('REFUND','EXCHANGE') NOT NULL,
  reason           VARCHAR(255),
  refund_method    ENUM('CASH','CARD','QR') DEFAULT NULL,
  refund_amount    DECIMAL(10,2) DEFAULT 0.00,
  served_by        VARCHAR(100),
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (original_sale_id) REFERENCES sales(id) ON DELETE SET NULL
);

-- Step 5: Return items (what was returned)
CREATE TABLE IF NOT EXISTS return_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  return_id    INT            NOT NULL,
  product_id   INT            NOT NULL,
  product_name VARCHAR(200)   NOT NULL,
  sku          VARCHAR(50)    NOT NULL,
  unit_price   DECIMAL(10,2)  NOT NULL,
  quantity     INT            NOT NULL,
  line_total   DECIMAL(10,2)  NOT NULL,
  FOREIGN KEY (return_id)  REFERENCES returns(id)  ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Step 6: Exchange items (what was given in exchange)
CREATE TABLE IF NOT EXISTS exchange_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  return_id    INT            NOT NULL,
  product_id   INT            NOT NULL,
  product_name VARCHAR(200)   NOT NULL,
  sku          VARCHAR(50)    NOT NULL,
  unit_price   DECIMAL(10,2)  NOT NULL,
  quantity     INT            NOT NULL,
  line_total   DECIMAL(10,2)  NOT NULL,
  FOREIGN KEY (return_id)  REFERENCES returns(id)  ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Verify
SELECT id, name, phone, role FROM employees;
SHOW TABLES;

