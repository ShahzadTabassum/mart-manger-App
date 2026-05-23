-- ============================================================
--  MartManager — Phase 1 Database Schema
--  Stack: MySQL 8.0+
--  Description: Core tables for inventory & product management
-- ============================================================

CREATE DATABASE IF NOT EXISTS mart_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mart_manager;

-- ------------------------------------------------------------
-- 1. CATEGORIES
--    Garments, Baby Shoes, Kids Accessories (expandable)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, description) VALUES
  ('Garment',         'All clothing items for kids and babies'),
  ('Baby Shoes',      'Footwear for babies and toddlers'),
  ('Kids Accessory',  'Hats, bags, hair accessories and more');

-- ------------------------------------------------------------
-- 2. SUPPLIERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150)  NOT NULL,
  contact_name VARCHAR(100),
  phone        VARCHAR(30),
  email        VARCHAR(150),
  address      TEXT,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO suppliers (name, contact_name, phone, email) VALUES
  ('KidZone Wholesale',   'Ali Rahman',    '+65 9100 0001', 'ali@kidzone.sg'),
  ('TinySteps Imports',   'Sara Lim',      '+65 9100 0002', 'sara@tinysteps.sg'),
  ('BabyWorld Supplies',  'John Tan',      '+65 9100 0003', 'john@babyworld.sg');

-- ------------------------------------------------------------
-- 3. PRODUCTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200)   NOT NULL,
  sku           VARCHAR(50)    NOT NULL UNIQUE,
  category_id   INT            NOT NULL,
  supplier_id   INT,
  price         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cost_price    DECIMAL(10, 2)          DEFAULT 0.00,
  description   TEXT,
  is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- ------------------------------------------------------------
-- 4. PRODUCT VARIANTS
--    Each product can have multiple variants (size, color, age)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT          NOT NULL,
  size        VARCHAR(50),
  color       VARCHAR(50),
  age_group   VARCHAR(50),
  sku_suffix  VARCHAR(30),
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 5. INVENTORY
--    Stock levels per product (and optionally per variant)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  product_id        INT  NOT NULL UNIQUE,
  quantity          INT  NOT NULL DEFAULT 0,
  low_stock_alert   INT  NOT NULL DEFAULT 10,
  max_stock         INT           DEFAULT 100,
  last_restocked_at TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 6. STOCK MOVEMENTS
--    Full audit trail of every stock in / stock out
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   INT          NOT NULL,
  movement_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
  quantity     INT          NOT NULL,
  note         VARCHAR(255),
  created_by   VARCHAR(100),
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ------------------------------------------------------------
-- 7. SAMPLE PRODUCTS + INVENTORY (for testing)
-- ------------------------------------------------------------
INSERT INTO products (name, sku, category_id, supplier_id, price, cost_price) VALUES
  ('Girls summer dress',     'GSD-001', 1, 1, 24.90, 12.00),
  ('Boys denim jacket',      'BDJ-002', 1, 1, 34.90, 17.00),
  ('Baby soft sole shoes',   'BSS-003', 2, 2, 19.90,  9.00),
  ('Toddler sneakers',       'TS-004',  2, 2, 29.90, 14.00),
  ('Kids hair accessories',  'KHA-005', 3, 3,  9.90,  4.00),
  ('Baby beanie hat',        'BBH-006', 3, 3, 12.90,  5.50),
  ('Girls leggings 2-pack',  'GL-007',  1, 1, 16.90,  8.00),
  ('Boys sandals',           'BS-008',  2, 2, 22.90, 10.00);

INSERT INTO inventory (product_id, quantity, low_stock_alert, max_stock) VALUES
  (1,  85,  15, 100),
  (2,  12,  15,  80),
  (3,   7,  10,  60),
  (4,  44,  10,  60),
  (5, 120,  20, 150),
  (6,   8,  15,  80),
  (7,  60,  15, 100),
  (8,  31,  10,  50);

INSERT INTO product_variants (product_id, size, color, age_group) VALUES
  (1, 'XS', 'Pink',  '3-4Y'), (1, 'S', 'Pink', '4-5Y'), (1, 'M', 'Blue', '5-6Y'),
  (2, 'S',  'Blue',  '4-5Y'), (2, 'M', 'Blue', '5-6Y'), (2, 'L', 'Gray', '6-7Y'),
  (3, NULL, 'White', '0-6M'), (3, NULL, 'Pink', '6-12M'),(3, NULL, 'Blue', '12-18M'),
  (4, NULL, 'White', '1-2Y'), (4, NULL, 'Blue', '2-3Y'),
  (5, NULL, 'Pink',  NULL),   (5, NULL, 'Blue', NULL),   (5, NULL, 'Yellow', NULL),
  (6, NULL, 'Gray',  '0-3M'), (6, NULL, 'White','3-6M'),
  (7, 'S',  'Black', '3-4Y'), (7, 'M', 'Navy', '5-6Y'),
  (8, NULL, 'Brown', '1-2Y'), (8, NULL, 'Blue', '2-3Y');

-- ------------------------------------------------------------
-- 8. USEFUL VIEWS
-- ------------------------------------------------------------

-- Low stock products at a glance
CREATE OR REPLACE VIEW v_low_stock AS
  SELECT
    p.id,
    p.name,
    p.sku,
    c.name         AS category,
    i.quantity     AS stock,
    i.low_stock_alert,
    i.max_stock,
    s.name         AS supplier
  FROM inventory i
  JOIN products  p ON p.id = i.product_id
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id
  WHERE i.quantity <= i.low_stock_alert
    AND p.is_active = TRUE;

-- Full product list with stock
CREATE OR REPLACE VIEW v_products_with_stock AS
  SELECT
    p.id,
    p.name,
    p.sku,
    c.name         AS category,
    p.price,
    p.cost_price,
    i.quantity     AS stock,
    i.low_stock_alert,
    i.max_stock,
    s.name         AS supplier,
    p.is_active,
    p.created_at
  FROM products p
  JOIN categories  c ON c.id = p.category_id
  LEFT JOIN inventory  i ON i.product_id = p.id
  LEFT JOIN suppliers  s ON s.id = p.supplier_id
  WHERE p.is_active = TRUE;

