-- AlterTable
ALTER TABLE "LoanCollateralItem" ADD COLUMN     "metal" "Metal" NOT NULL DEFAULT 'GOLD',
ALTER COLUMN "pieces" SET DEFAULT 1;
