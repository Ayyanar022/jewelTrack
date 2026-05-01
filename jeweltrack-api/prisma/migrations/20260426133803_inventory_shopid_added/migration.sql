/*
  Warnings:

  - Added the required column `shop_id` to the `InventoryStockEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryStockEntry" ADD COLUMN     "shop_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "InventoryStockEntry" ADD CONSTRAINT "InventoryStockEntry_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
