-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ScheduleSlot" ADD COLUMN     "deletedAt" TIMESTAMP(3);

