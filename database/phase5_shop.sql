-- ============================================================
--  MartManager Phase 5: Online Shop
--  Run: mysql -u root -p --default-character-set=utf8mb4 mart_manager < phase5_shop.sql
-- ============================================================

USE mart_manager;

-- ------------------------------------------------------------
-- 1. SHOP CUSTOMERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_customers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  phone       VARCHAR(30)  NOT NULL UNIQUE,
  email       VARCHAR(150),
  password    VARCHAR(255),
  is_verified BOOLEAN      DEFAULT FALSE,
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. ORDERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  order_number     VARCHAR(30)  NOT NULL UNIQUE,
  customer_id      INT          DEFAULT NULL,
  customer_name    VARCHAR(150) NOT NULL,
  customer_phone   VARCHAR(30)  NOT NULL,
  customer_email   VARCHAR(150),
  fulfillment_type ENUM('DELIVERY','PICKUP') NOT NULL,
  delivery_address TEXT,
  payment_method   ENUM('ONLINE','COD') NOT NULL,
  payment_status   ENUM('PENDING','PAID','FAILED') DEFAULT 'PENDING',
  status           ENUM('PENDING','CONFIRMED','PROCESSING','READY','DELIVERED','CANCELLED') DEFAULT 'PENDING',
  subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_fee     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  note             TEXT,
  cancelled_reason VARCHAR(255),
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES shop_customers(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 3. ORDER ITEMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT           NOT NULL,
  product_id   INT           NOT NULL,
  product_name VARCHAR(200)  NOT NULL,
  sku          VARCHAR(50)   NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  quantity     INT           NOT NULL,
  line_total   DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ------------------------------------------------------------
-- 4. ORDER STATUS HISTORY
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT          NOT NULL,
  status     VARCHAR(50)  NOT NULL,
  note       VARCHAR(255),
  changed_by VARCHAR(100),
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 5. Add shop columns to products
--    Using separate ALTER statements to avoid IF NOT EXISTS issue
-- ------------------------------------------------------------
ALTER TABLE products ADD COLUMN shop_visible  BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN shop_featured BOOLEAN DEFAULT FALSE;

-- Show all existing products in shop
UPDATE products SET shop_visible = TRUE, shop_featured = FALSE;

-- ------------------------------------------------------------
-- 6. Orders view
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_orders AS
  SELECT
    o.id, o.order_number, o.customer_name, o.customer_phone,
    o.fulfillment_type, o.payment_method, o.payment_status,
    o.status, o.subtotal, o.delivery_fee, o.total,
    o.note, o.created_at, o.updated_at,
    COUNT(oi.id) AS item_count
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id
  ORDER BY o.created_at DESC;

SELECT 'Phase 5 complete!' AS message;
SHOW TABLES;
