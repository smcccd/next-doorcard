/*
  Warnings:

  - You are about to drop the column `endDate` on the `Doorcard` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Doorcard` table. All the data in the column will be lost.
  - The primary key for the `DoorcardMetrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `DoorcardMetrics` table. All the data in the column will be lost.
  - You are about to drop the `DoorcardDraft` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,college,term,year,isActive]` on the table `Doorcard` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `term` on the `Doorcard` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `year` on the `Doorcard` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `college` on table `Doorcard` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TermSeason" AS ENUM ('FALL', 'SPRING', 'SUMMER');

-- DropForeignKey
ALTER TABLE "DoorcardDraft" DROP CONSTRAINT "DoorcardDraft_userId_fkey";

-- DropIndex
DROP INDEX "Doorcard_createdAt_idx";

-- DropIndex
DROP INDEX "Doorcard_isActive_idx";

-- DropIndex
DROP INDEX "Doorcard_isPublic_idx";

-- DropIndex
DROP INDEX "Doorcard_officeNumber_idx";

-- DropIndex
DROP INDEX "Doorcard_slug_idx";

-- DropIndex
DROP INDEX "Doorcard_termId_idx";

-- DropIndex
DROP INDEX "Doorcard_userId_idx";

-- DropIndex
DROP INDEX "DoorcardAnalytics_createdAt_idx";

-- DropIndex
DROP INDEX "DoorcardAnalytics_eventType_createdAt_idx";

-- DropIndex
DROP INDEX "DoorcardMetrics_doorcardId_key";

-- AlterTable
ALTER TABLE "Doorcard" DROP COLUMN "endDate",
DROP COLUMN "startDate",
DROP COLUMN "term",
ADD COLUMN     "term" "TermSeason" NOT NULL,
DROP COLUMN "year",
ADD COLUMN     "year" INTEGER NOT NULL,
ALTER COLUMN "college" SET NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT false,
ALTER COLUMN "isPublic" SET DEFAULT false;

-- AlterTable
ALTER TABLE "DoorcardMetrics" DROP CONSTRAINT "DoorcardMetrics_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "DoorcardMetrics_pkey" PRIMARY KEY ("doorcardId");

-- DropTable
DROP TABLE "DoorcardDraft";

-- CreateIndex
CREATE INDEX "Doorcard_userId_createdAt_idx" ON "Doorcard"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Doorcard_term_year_idx" ON "Doorcard"("term", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Doorcard_userId_college_term_year_isActive_key" ON "Doorcard"("userId", "college", "term", "year", "isActive");
