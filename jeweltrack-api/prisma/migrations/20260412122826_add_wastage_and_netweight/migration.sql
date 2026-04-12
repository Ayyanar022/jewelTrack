/*
  Warnings:

  - You are about to drop the column `weight` on the `BillItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bill" ALTER COLUMN "discount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BillItem" DROP COLUMN "weight",
ADD COLUMN     "gross_weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "net_weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "stone" DOUBLE PRECISION DEFAULT 0;
