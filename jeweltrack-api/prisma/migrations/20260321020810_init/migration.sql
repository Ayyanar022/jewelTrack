-- CreateEnum
CREATE TYPE "subscriptionPlan" AS ENUM ('BASIC', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "subscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('SMALL_SHOP', 'KARIGAR', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "Purity" AS ENUM ('K22', 'K18', 'K24');

-- CreateEnum
CREATE TYPE "Metal" AS ENUM ('GOLD', 'SILVER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "phone" TEXT,
    "hallmark_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "subscription_plan" "subscriptionPlan" NOT NULL DEFAULT 'BASIC',
    "subscription_status" "subscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "village" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "type" "PartyType" NOT NULL DEFAULT 'SMALL_SHOP',
    "contact_person" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rate" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "rate_22k" DOUBLE PRECISION NOT NULL,
    "rate_18k" DOUBLE PRECISION NOT NULL,
    "rate_999" DOUBLE PRECISION,
    "rate_silver" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "is_gst_bill" BOOLEAN NOT NULL DEFAULT false,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillItem" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "purity" "Purity" DEFAULT 'K22',
    "metal" "Metal" NOT NULL DEFAULT 'GOLD',
    "weight" DOUBLE PRECISION NOT NULL,
    "wastage" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL,
    "making_charge" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JewelleryCategory" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metal" "Metal" NOT NULL DEFAULT 'GOLD',
    "default_wastage" DOUBLE PRECISION,
    "default_making_charge" DOUBLE PRECISION,
    "touch_22k" DOUBLE PRECISION,
    "touch_18k" DOUBLE PRECISION,
    "touch_24k" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JewelleryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "piece_weight" DOUBLE PRECISION NOT NULL,
    "purity" "Purity" NOT NULL DEFAULT 'K18',
    "given_pieces" INTEGER NOT NULL DEFAULT 0,
    "given_weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returned_pieces" INTEGER NOT NULL DEFAULT 0,
    "returned_weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixed_touch" DOUBLE PRECISION NOT NULL,
    "actual_touch" DOUBLE PRECISION NOT NULL,
    "hallmark_rate" DOUBLE PRECISION NOT NULL,
    "give_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalPayment" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "pure_metal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetalPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JewelLoan" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "loan_number" TEXT NOT NULL,
    "loan_amount" INTEGER NOT NULL,
    "interest_rate" DOUBLE PRECISION NOT NULL,
    "gross_weight" DOUBLE PRECISION NOT NULL,
    "net_weight" DOUBLE PRECISION NOT NULL,
    "jewellery_photo_url" TEXT,
    "customer_photo_url" TEXT,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "loan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JewelLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanCollateralItem" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purity" "Purity",
    "pieces" INTEGER NOT NULL,

    CONSTRAINT "LoanCollateralItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "principal_paid" INTEGER NOT NULL,
    "interest_paid" INTEGER NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JewelleryCategory" ADD CONSTRAINT "JewelleryCategory_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "JewelleryCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalPayment" ADD CONSTRAINT "MetalPayment_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalPayment" ADD CONSTRAINT "MetalPayment_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JewelLoan" ADD CONSTRAINT "JewelLoan_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JewelLoan" ADD CONSTRAINT "JewelLoan_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanCollateralItem" ADD CONSTRAINT "LoanCollateralItem_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "JewelLoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "JewelLoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
