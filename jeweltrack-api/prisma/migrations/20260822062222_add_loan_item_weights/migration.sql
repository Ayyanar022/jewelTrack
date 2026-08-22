-- DropForeignKey
ALTER TABLE "LoanCollateralItem" DROP CONSTRAINT "LoanCollateralItem_loan_id_fkey";

-- AlterTable
ALTER TABLE "LoanCollateralItem" ADD COLUMN     "gross_weight" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "net_weight" DOUBLE PRECISION DEFAULT 0;

-- AddForeignKey
ALTER TABLE "LoanCollateralItem" ADD CONSTRAINT "LoanCollateralItem_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "JewelLoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
