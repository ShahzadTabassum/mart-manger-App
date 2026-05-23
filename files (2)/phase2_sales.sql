-- ============================================================
--  MartManager — Phase 2: Sales & Billing Schema
--  Run: mysql -u root -p < phase2_sales.sql
-- ============================================================

USE mart_manager;

-- ------------------------------------------------------------
-- 1. SALES (each completed transaction)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  sale_number     VARCHAR(30)    NOT NULL UNIQUE,   -- e.g. SALE-20260523-001
  payment_method  ENUM('CASH','CARD','QR') NOT NULL,
  subtotal        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  discount_type   ENUM('PERCENT','FIXED') DEFAULT NULL,
  discount_value  DECIMAL(10,2)           DEFAULT 0.00,
  discount_amount DECIMAL(10,2)           DEFAULT 0.00,
  total           DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  amount_paid     DECIMAL(10,2)           DEFAULT 0.00,
  change_given    DECIMAL(10,2)           DEFAULT 0.00,
  note            VARCHAR(255),
  served_by       VARCHAR(100),
  created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. SALE ITEMS (line items per sale)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  sale_id     INT            NOT NULL,
  product_id  INT            NOT NULL,
  product_name VARCHAR(200)  NOT NULL,   -- snapshot at time of sale
  sku         VARCHAR(50)    NOT NULL,
  unit_price  DECIMAL(10,2)  NOT NULL,
  quantity    INT            NOT NULL,
  line_total  DECIMAL(10,2)  NOT NULL,
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sale_id)    REFERENCES sales(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ------------------------------------------------------------
-- 3. USEFUL VIEWS
-- ------------------------------------------------------------

-- Daily sales summary
CREATE OR REPLACE VIEW v_daily_sales AS
  SELECT
    DATE(created_at)        AS sale_date,
    COUNT(*)                AS total_transactions,
    SUM(subtotal)           AS total_subtotal,
    SUM(discount_amount)    AS total_discounts,
    SUM(total)              AS total_revenue,
    SUM(CASE WHEN payment_method='CASH' THEN total ELSE 0 END) AS cash_revenue,
    SUM(CASE WHEN payment_method='CARD' THEN total ELSE 0 END) AS card_revenue,
    SUM(CASE WHEN payment_method='QR'   THEN total ELSE 0 END) AS qr_revenue
  FROM sales
  GROUP BY DATE(created_at)
  ORDER BY sale_date DESC;

-- Top selling products
CREATE OR REPLACE VIEW v_top_products AS
  SELECT
    si.product_id,
    si.product_name,
    si.sku,
    SUM(si.quantity)   AS total_units_sold,
    SUM(si.line_total) AS total_revenue
  FROM sale_items si
  GROUP BY si.product_id, si.product_name, si.sku
  ORDER BY total_units_sold DESC;

-- Full sales with items count
CREATE OR REPLACE VIEW v_sales_summary AS
  SELECT
    s.id,
    s.sale_number,
    s.payment_method,
    s.subtotal,
    s.discount_amount,
    s.total,
    s.served_by,
    s.created_at,
    COUNT(si.id) AS item_count
  FROM sales s
  LEFT JOIN sale_items si ON si.sale_id = s.id
  GROUP BY s.id
  ORDER BY s.created_at DESC;

