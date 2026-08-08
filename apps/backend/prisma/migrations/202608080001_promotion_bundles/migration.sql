ALTER TABLE `promotions`
  ADD COLUMN `kind` ENUM('PRODUCT_DISCOUNT', 'BUNDLE') NOT NULL DEFAULT 'PRODUCT_DISCOUNT',
  ADD COLUMN `bundle_price` DECIMAL(10, 2) NULL,
  ADD COLUMN `image_url` TEXT NULL,
  MODIFY `discount_type` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NULL,
  MODIFY `discount_value` DECIMAL(10, 2) NULL;

ALTER TABLE `promotion_products`
  ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1;

ALTER TABLE `order_items`
  ADD COLUMN `promotion_id` VARCHAR(36) NULL,
  ADD COLUMN `promotion_name` VARCHAR(150) NULL;

CREATE INDEX `order_items_promotion_id_idx` ON `order_items`(`promotion_id`);

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_promotion_id_fkey`
  FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
