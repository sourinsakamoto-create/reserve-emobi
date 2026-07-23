-- The old per-date availability model is incompatible with the new
-- per-departure (ScheduleSlot) model below, so existing rows can't be
-- carried forward automatically. Clear them first so the NOT NULL column
-- add below succeeds even if guides had already entered old-style data.
DELETE FROM "GuideAvailability";

-- DropIndex
DROP INDEX "GuideAvailability_date_idx";

-- DropIndex
DROP INDEX "GuideAvailability_guideId_date_key";

-- AlterTable
ALTER TABLE "GuideAvailability" DROP COLUMN "date",
ADD COLUMN     "scheduleSlotId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BookingSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "requireGuideAvailability" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuideAvailability_scheduleSlotId_idx" ON "GuideAvailability"("scheduleSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideAvailability_guideId_scheduleSlotId_key" ON "GuideAvailability"("guideId", "scheduleSlotId");

-- AddForeignKey
ALTER TABLE "GuideAvailability" ADD CONSTRAINT "GuideAvailability_scheduleSlotId_fkey" FOREIGN KEY ("scheduleSlotId") REFERENCES "ScheduleSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

