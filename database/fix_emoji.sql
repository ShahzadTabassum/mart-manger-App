-- Fix emoji encoding issue
USE mart_manager;

ALTER TABLE categories MODIFY COLUMN icon VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE categories SET icon = '👗' WHERE name = 'Garment';
UPDATE categories SET icon = '👟' WHERE name = 'Baby Shoes';
UPDATE categories SET icon = '🎀' WHERE name = 'Kids Accessory';
UPDATE categories SET icon = '🤵' WHERE name = 'Man Suit';
UPDATE categories SET icon = '👩' WHERE name = 'Woman Suit';
UPDATE categories SET icon = '🧒' WHERE name = 'Kids Suit';
UPDATE categories SET icon = '👦' WHERE name = 'Boys Suit';
UPDATE categories SET icon = '👧' WHERE name = 'Girls Suit';
UPDATE categories SET icon = '👕' WHERE name = 'General Clothing';
UPDATE categories SET icon = '🐣' WHERE name = 'Soft Sole';
UPDATE categories SET icon = '👟' WHERE name = 'Sneakers';
UPDATE categories SET icon = '👡' WHERE name = 'Sandals';
UPDATE categories SET icon = '🎀' WHERE name = 'Hair Accessories';
UPDATE categories SET icon = '🧢' WHERE name = 'Hats & Beanies';
UPDATE categories SET icon = '🎒' WHERE name = 'Bags & Others';

SELECT id, parent_id, icon, name FROM categories ORDER BY COALESCE(parent_id, id), parent_id IS NULL DESC;
