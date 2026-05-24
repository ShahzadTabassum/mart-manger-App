-- ============================================================
--  MartManager — Phase 3: Customers & Employees
--  Run: mysql -u root -p --default-character-set=utf8mb4 mart_manager < phase3_customers_employees.sql
-- ============================================================

USE mart_manager;

-- ------------------------------------------------------------
-- 1. CUSTOMERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150)  NOT NULL,
  phone         VARCHAR(30)   NOT NULL UNIQUE,
  loyalty_points INT          NOT NULL DEFAULT 0,
  total_spent   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  visit_count   INT           NOT NULL DEFAULT 0,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. LOYALTY TRANSACTIONS
--    Full audit log of every points earn / redeem
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT          NOT NULL,
  sale_id      INT          DEFAULT NULL,
  type         ENUM('EARN','REDEEM','ADJUSTMENT') NOT NULL,
  points       INT          NOT NULL,
  note         VARCHAR(255),
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id)     REFERENCES sales(id)     ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 3. Add customer_id + loyalty fields to sales
-- ------------------------------------------------------------
ALTER TABLE sales
  ADD COLUMN customer_id       INT           DEFAULT NULL AFTER served_by,
  ADD COLUMN loyalty_earned    INT           DEFAULT 0,
  ADD COLUMN loyalty_redeemed  INT           DEFAULT 0,
  ADD FOREIGN KEY fk_sale_customer (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 4. EMPLOYEES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  phone      VARCHAR(30),
  role       ENUM('ADMIN','MANAGER','CASHIER') NOT NULL DEFAULT 'CASHIER',
  pin        VARCHAR(6)   NOT NULL,             -- 4-6 digit PIN
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default admin employee
INSERT INTO employees (name, phone, role, pin) VALUES
  ('Admin', '', 'ADMIN', '1234');

-- ------------------------------------------------------------
-- 5. USEFUL VIEWS
-- ------------------------------------------------------------

-- Customer summary with loyalty
CREATE OR REPLACE VIEW v_customers AS
  SELECT
    c.id,
    c.name,
    c.phone,
    c.loyalty_points,
    c.total_spent,
    c.visit_count,
    c.is_active,
    c.created_at
  FROM customers c
  WHERE c.is_active = TRUE
  ORDER BY c.name;

-- Top customers
CREATE OR REPLACE VIEW v_top_customers AS
  SELECT
    c.id,
    c.name,
    c.phone,
    c.loyalty_points,
    c.total_spent,
    c.visit_count
  FROM customers c
  WHERE c.is_active = TRUE
  ORDER BY c.total_spent DESC
  LIMIT 20;

