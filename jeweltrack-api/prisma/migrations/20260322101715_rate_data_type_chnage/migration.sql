/*
  Warnings:

  - You are about to alter the column `rate_silver` on the `Rate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Rate" ALTER COLUMN "rate_silver" SET DATA TYPE INTEGER;
