INSERT INTO `categories` (`name`, `slug`, `active`, `created_at`, `updated_at`) VALUES
  ('Tacos', 'tacos', true, NOW(3), NOW(3)),
  ('Quesadilla', 'quesadilla', true, NOW(3), NOW(3)),
  ('Nachos', 'nachos', true, NOW(3), NOW(3)),
  ('Refrescos', 'refrescos', true, NOW(3), NOW(3)),
  ('Gaseosa', 'gaseosa', true, NOW(3), NOW(3)),
  ('Cerveza', 'cerveza', true, NOW(3), NOW(3)),
  ('Agua', 'agua', true, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `active` = true, `updated_at` = NOW(3);
