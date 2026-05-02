/*
  Warnings:

  - You are about to drop the column `item_name` on the `BillItem` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `BillItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BillItem" DROP COLUMN "item_name",
ADD COLUMN     "category_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "JewelleryCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
