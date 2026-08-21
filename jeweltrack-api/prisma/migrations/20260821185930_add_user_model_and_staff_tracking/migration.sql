/*
  Warnings:

  - You are about to drop the column `owner_name` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Shop` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'SHOP_OWNER', 'MANAGER', 'CASHIER');

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "created_by_user_id" TEXT;

-- AlterTable
ALTER TABLE "BillPaymentsEntry" ADD COLUMN     "created_by_user_id" TEXT;

-- AlterTable
ALTER TABLE "InventoryStockEntry" ADD COLUMN     "created_by_user_id" TEXT;

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "owner_name",
DROP COLUMN "password",
DROP COLUMN "phone";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SHOP_OWNER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_shop_id_idx" ON "User"("shop_id");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Bill_created_by_user_id_idx" ON "Bill"("created_by_user_id");

-- CreateIndex
CREATE INDEX "BillPaymentsEntry_shop_id_idx" ON "BillPaymentsEntry"("shop_id");

-- CreateIndex
CREATE INDEX "BillPaymentsEntry_created_by_user_id_idx" ON "BillPaymentsEntry"("created_by_user_id");

-- CreateIndex
CREATE INDEX "InventoryStockEntry_created_by_user_id_idx" ON "InventoryStockEntry"("created_by_user_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStockEntry" ADD CONSTRAINT "InventoryStockEntry_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPaymentsEntry" ADD CONSTRAINT "BillPaymentsEntry_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
