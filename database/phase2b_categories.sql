-- ============================================================
--  MartManager — Category Hierarchy Migration
--  Adds parent_id to support Main → Sub categories
--  Run: mysql -u root -p < phase2b_categories.sql
-- ============================================================

USE mart_manager;

-- Step 1: Add parent_id and icon columns to categories
ALTER TABLE categories
  ADD COLUMN parent_id INT DEFAULT NULL AFTER id,
  ADD COLUMN icon      VARCHAR(10) DEFAULT '🏷️' AFTER description,
  ADD FOREIGN KEY fk_cat_parent (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Step 2: Clear existing sample categories (we'll re-insert properly)
-- First remove FK constraint from products temporarily
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM categories;
SET FOREIGN_KEY_CHECKS = 1;

-- Step 3: Insert main categories (parent_id = NULL)
INSERT INTO categories (id, parent_id, name, icon, description) VALUES
  (1, NULL, 'Garment',        '👗', 'All clothing and apparel items'),
  (2, NULL, 'Baby Shoes',     '👟', 'Footwear for babies and toddlers'),
  (3, NULL, 'Kids Accessory', '🎀', 'Accessories for babies and kids');

-- Step 4: Insert sub-categories under Garment (parent_id = 1)
INSERT INTO categories (parent_id, name, icon, description) VALUES
  (1, 'Man Suit',       '🤵', 'Suits and formal wear for men'),
  (1, 'Woman Suit',     '👩', 'Suits and formal wear for women'),
  (1, 'Kids Suit',      '🧒', 'Formal suits for children'),
  (1, 'Boys Suit',      '👦', 'Suits and outfits for boys'),
  (1, 'Girls Suit',     '👧', 'Suits and outfits for girls'),
  (1, 'General Clothing','👕', 'Everyday clothing for all ages');

-- Step 5: Insert sub-categories under Baby Shoes (parent_id = 2)
INSERT INTO categories (parent_id, name, icon, description) VALUES
  (2, 'Soft Sole',  '🐣', 'Soft sole shoes for newborns and crawlers'),
  (2, 'Sneakers',   '👟', 'Casual sneakers for toddlers'),
  (2, 'Sandals',    '👡', 'Sandals and open toe shoes');

-- Step 6: Insert sub-categories under Kids Accessory (parent_id = 3)
INSERT INTO categories (parent_id, name, icon, description) VALUES
  (3, 'Hair Accessories', '🎀', 'Clips, bands, pins and hair sets'),
  (3, 'Hats & Beanies',  '🧢', 'Hats, caps and beanies'),
  (3, 'Bags & Others',   '🎒', 'Bags, belts and other accessories');

-- Step 7: Re-assign the 8 existing products to sub-categories
-- Girls summer dress → Girls Suit
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Girls Suit') WHERE sku = 'GSD-001';
-- Boys denim jacket → Boys Suit
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Boys Suit') WHERE sku = 'BDJ-002';
-- Baby soft sole shoes → Soft Sole
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Soft Sole') WHERE sku = 'BSS-003';
-- Toddler sneakers → Sneakers
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Sneakers') WHERE sku = 'TS-004';
-- Kids hair accessories → Hair Accessories
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Hair Accessories') WHERE sku = 'KHA-005';
-- Baby beanie hat → Hats & Beanies
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Hats & Beanies') WHERE sku = 'BBH-006';
-- Girls leggings → Girls Suit
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Girls Suit') WHERE sku = 'GL-007';
-- Boys sandals → Sandals
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Sandals') WHERE sku = 'BS-008';

-- Step 8: Update the product view to include parent category
CREATE OR REPLACE VIEW v_products_with_stock AS
  SELECT
    p.id,
    p.name,
    p.sku,
    c.name              AS category,
    c.id                AS category_id,
    pc.name             AS main_category,
    pc.id               AS main_category_id,
    p.price,
    p.cost_price,
    i.quantity          AS stock,
    i.low_stock_alert,
    i.max_stock,
    s.name              AS supplier,
    p.is_active,
    p.created_at
  FROM products p
  JOIN categories  c  ON c.id  = p.category_id
  LEFT JOIN categories pc ON pc.id = c.parent_id
  LEFT JOIN inventory  i  ON i.product_id = p.id
  LEFT JOIN suppliers  s  ON s.id = p.supplier_id
  WHERE p.is_active = TRUE;

-- Step 9: Updated category tree view
CREATE OR REPLACE VIEW v_category_tree AS
  SELECT
    c.id,
    c.parent_id,
    c.name,
    c.icon,
    c.description,
    pc.name AS parent_name,
    (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE) AS product_count
  FROM categories c
  LEFT JOIN categories pc ON pc.id = c.parent_id
  ORDER BY COALESCE(c.parent_id, c.id), c.parent_id IS NULL DESC, c.name;

-- Verify
SELECT id, parent_id, icon, name FROM categories ORDER BY COALESCE(parent_id, id), parent_id IS NULL DESC;
