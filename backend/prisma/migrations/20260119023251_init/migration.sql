-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('SUV', 'SEDAN', 'HATCHBACK', 'MPV', 'VAN');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('AT', 'MT');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GAS', 'DIESEL', 'EV');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" TEXT NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "CarType" NOT NULL,
    "seats" INTEGER NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "fuel" "FuelType" NOT NULL,
    "daily_price" DECIMAL(10,2) NOT NULL,
    "status" "CarStatus" NOT NULL DEFAULT 'ACTIVE',
    "images" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addons" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price_per_booking" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "car_id" TEXT NOT NULL,
    "pickup_location_id" TEXT NOT NULL,
    "dropoff_location_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "days" INTEGER NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "addon_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(12,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_addons" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "booking_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "cars_type_idx" ON "cars"("type");

-- CreateIndex
CREATE INDEX "cars_status_idx" ON "cars"("status");

-- CreateIndex
CREATE INDEX "cars_daily_price_idx" ON "cars"("daily_price");

-- CreateIndex
CREATE INDEX "cars_seats_idx" ON "cars"("seats");

-- CreateIndex
CREATE INDEX "cars_transmission_idx" ON "cars"("transmission");

-- CreateIndex
CREATE INDEX "cars_fuel_idx" ON "cars"("fuel");

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "addons_name_key" ON "addons"("name");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_car_id_idx" ON "bookings"("car_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_start_date_end_date_idx" ON "bookings"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "bookings_car_id_start_date_end_date_idx" ON "bookings"("car_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at");

-- CreateIndex
CREATE INDEX "booking_addons_booking_id_idx" ON "booking_addons"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_addons_booking_id_addon_id_key" ON "booking_addons"("booking_id", "addon_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dropoff_location_id_fkey" FOREIGN KEY ("dropoff_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_addons" ADD CONSTRAINT "booking_addons_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_addons" ADD CONSTRAINT "booking_addons_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
