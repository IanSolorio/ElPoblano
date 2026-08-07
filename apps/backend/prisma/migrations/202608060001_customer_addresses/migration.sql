CREATE TABLE `addresses` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `label` VARCHAR(50) NOT NULL DEFAULT 'Casa',
  `address_line` VARCHAR(255) NOT NULL,
  `reference` VARCHAR(255) NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `is_default` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `addresses_user_id_is_default_idx`(`user_id`, `is_default`),
  PRIMARY KEY (`id`),
  CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `orders`
  ADD COLUMN `delivery_latitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `delivery_longitude` DECIMAL(10, 7) NULL;
