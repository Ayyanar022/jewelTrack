-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "balance_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BillPaymentsEntry" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillPaymentsEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BillPaymentsEntry" ADD CONSTRAINT "BillPaymentsEntry_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPaymentsEntry" ADD CONSTRAINT "BillPaymentsEntry_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
