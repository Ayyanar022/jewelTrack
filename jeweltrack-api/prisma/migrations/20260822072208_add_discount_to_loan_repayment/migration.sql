-- DropForeignKey
ALTER TABLE "LoanRepayment" DROP CONSTRAINT "LoanRepayment_loan_id_fkey";

-- AlterTable
ALTER TABLE "LoanRepayment" ADD COLUMN     "discount_amount" INTEGER DEFAULT 0;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "JewelLoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
