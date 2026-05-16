-- CreateTable
CREATE TABLE "OldGoldEntry" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "purity" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OldGoldEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OldGoldEntry" ADD CONSTRAINT "OldGoldEntry_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OldGoldEntry" ADD CONSTRAINT "OldGoldEntry_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
