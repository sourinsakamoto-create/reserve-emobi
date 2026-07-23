-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "guideId" TEXT;

-- CreateTable
CREATE TABLE "GuideAvailability" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuideAvailability_date_idx" ON "GuideAvailability"("date");

-- CreateIndex
CREATE UNIQUE INDEX "GuideAvailability_guideId_date_key" ON "GuideAvailability"("guideId", "date");

-- CreateIndex
CREATE INDEX "Booking_guideId_idx" ON "Booking"("guideId");

-- AddForeignKey
ALTER TABLE "GuideAvailability" ADD CONSTRAINT "GuideAvailability_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

