-- CreateEnum
CREATE TYPE "Type" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "StockType" AS ENUM ('OWN', 'BORROW');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('BILL', 'MANUAL');

-- CreateTable
CREATE TABLE "InventoryStockEntry" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "type" "Type" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "purity" "Purity" NOT NULL,
    "stockType" "StockType" NOT NULL,
    "reference" "ReferenceType" NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryStockEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InventoryStockEntry" ADD CONSTRAINT "InventoryStockEntry_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "JewelleryCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
