/*
  Warnings:

  - You are about to drop the column `sport_types` on the `grounds` table. All the data in the column will be lost.
  - Added the required column `sportTypes` to the `grounds` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('FUTSAL', 'CRICKET', 'BADMINTON', 'TENNIS', 'VOLLEYBALL', 'BASKETBALL');

-- AlterTable
ALTER TABLE "grounds" DROP COLUMN "sport_types",
ADD COLUMN     "sportTypes" "SportType" NOT NULL;
