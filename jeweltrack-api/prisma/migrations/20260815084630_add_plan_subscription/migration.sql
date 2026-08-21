/*
  Warnings:

  - The `subscription_plan` column on the `Shop` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "subscriptionStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "subscriptionStatus" ADD VALUE 'PAST_DUE';

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "subscription_plan",
ADD COLUMN     "subscription_plan" TEXT NOT NULL DEFAULT 'TRIAL';

-- DropEnum
DROP TYPE "subscriptionPlan";

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "max_users" INTEGER NOT NULL DEFAULT 1,
    "max_invoices_per_month" INTEGER,
    "max_branches" INTEGER NOT NULL DEFAULT 1,
    "features" JSONB,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "amount_paid" INTEGER NOT NULL,
    "discount_percent" INTEGER NOT NULL DEFAULT 0,
    "razorpay_subscription_id" TEXT,
    "status" "subscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_razorpay_subscription_id_key" ON "Subscription"("razorpay_subscription_id");

-- CreateIndex
CREATE INDEX "Subscription_shop_id_idx" ON "Subscription"("shop_id");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_plan_id_idx" ON "Subscription"("plan_id");

-- CreateIndex
CREATE INDEX "Bill_shop_id_idx" ON "Bill"("shop_id");

-- CreateIndex
CREATE INDEX "Bill_customer_id_idx" ON "Bill"("customer_id");

-- CreateIndex
CREATE INDEX "Customer_shop_id_idx" ON "Customer"("shop_id");

-- CreateIndex
CREATE INDEX "InventoryStockEntry_shop_id_idx" ON "InventoryStockEntry"("shop_id");

-- CreateIndex
CREATE INDEX "StockTransaction_shop_id_idx" ON "StockTransaction"("shop_id");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
