/*
  Warnings:

  - The values [SUPER_ADMIN,DOCTOR,PATIENT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `patients` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GroundStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('WEEKDAY', 'WEEKEND', 'PEAK');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PAID');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'PLAYER', 'OWNER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PLAYER';
COMMIT;

-- DropForeignKey
ALTER TABLE "patients" DROP CONSTRAINT "patients_userId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PLAYER';

-- DropTable
DROP TABLE "patients";

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "ground_id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grounds" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sport_types" TEXT[],
    "status" "GroundStatus" NOT NULL DEFAULT 'ACTIVE',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ground_photos" (
    "id" TEXT NOT NULL,
    "ground_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ground_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ground_schedules" (
    "id" TEXT NOT NULL,
    "ground_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,
    "slot_duration_min" INTEGER NOT NULL,

    CONSTRAINT "ground_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "license_doc_url" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,

    CONSTRAINT "owner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "bkash" TEXT NOT NULL,
    "transaction_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "ground_id" TEXT NOT NULL,
    "day_type" "DayType" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" TEXT NOT NULL,
    "ground_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_slot_id_key" ON "bookings"("slot_id");

-- CreateIndex
CREATE INDEX "bookings_player_id_idx" ON "bookings"("player_id");

-- CreateIndex
CREATE INDEX "bookings_ground_id_idx" ON "bookings"("ground_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "grounds_latitude_longitude_idx" ON "grounds"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "grounds_owner_id_idx" ON "grounds"("owner_id");

-- CreateIndex
CREATE INDEX "ground_photos_ground_id_idx" ON "ground_photos"("ground_id");

-- CreateIndex
CREATE INDEX "ground_schedules_ground_id_idx" ON "ground_schedules"("ground_id");

-- CreateIndex
CREATE UNIQUE INDEX "owner_profiles_user_id_key" ON "owner_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_booking_id_key" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payouts_owner_id_idx" ON "payouts"("owner_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE INDEX "pricing_rules_ground_id_idx" ON "pricing_rules"("ground_id");

-- CreateIndex
CREATE INDEX "slots_ground_id_date_idx" ON "slots"("ground_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "slots_ground_id_date_start_time_key" ON "slots"("ground_id", "date", "start_time");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_ground_id_fkey" FOREIGN KEY ("ground_id") REFERENCES "grounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grounds" ADD CONSTRAINT "grounds_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owner_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ground_photos" ADD CONSTRAINT "ground_photos_ground_id_fkey" FOREIGN KEY ("ground_id") REFERENCES "grounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ground_schedules" ADD CONSTRAINT "ground_schedules_ground_id_fkey" FOREIGN KEY ("ground_id") REFERENCES "grounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_profiles" ADD CONSTRAINT "owner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_ground_id_fkey" FOREIGN KEY ("ground_id") REFERENCES "grounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_ground_id_fkey" FOREIGN KEY ("ground_id") REFERENCES "grounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
