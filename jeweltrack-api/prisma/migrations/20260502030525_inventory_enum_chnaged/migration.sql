/*
  Warnings:

  - The values [MANUAL] on the enum `ReferenceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReferenceType_new" AS ENUM ('BILL', 'ADJUSTMENT');
ALTER TABLE "InventoryStockEntry" ALTER COLUMN "reference" TYPE "ReferenceType_new" USING ("reference"::text::"ReferenceType_new");
ALTER TYPE "ReferenceType" RENAME TO "ReferenceType_old";
ALTER TYPE "ReferenceType_new" RENAME TO "ReferenceType";
DROP TYPE "ReferenceType_old";
COMMIT;
