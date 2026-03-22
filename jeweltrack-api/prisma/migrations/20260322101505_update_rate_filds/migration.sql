/*
  Warnings:

  - You are about to alter the column `rate_22k` on the `Rate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `rate_18k` on the `Rate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `rate_999` on the `Rate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Rate" ALTER COLUMN "rate_22k" SET DATA TYPE INTEGER,
ALTER COLUMN "rate_18k" SET DATA TYPE INTEGER,
ALTER COLUMN "rate_999" SET DATA TYPE INTEGER;
