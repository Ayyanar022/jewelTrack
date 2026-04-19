/*
  Warnings:

  - Added the required column `payableAmount` to the `Bill` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "payableAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalGST" DOUBLE PRECISION DEFAULT 0;
