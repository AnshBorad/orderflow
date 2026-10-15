/*
  Warnings:

  - A unique constraint covering the columns `[providerOrderId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerOrderId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "providerOrderId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerOrderId_key" ON "payments"("providerOrderId");
