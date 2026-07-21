-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "pricePerAdult" INTEGER NOT NULL,
    "pricePerChild" INTEGER NOT NULL DEFAULT 0,
    "defaultCapacity" INTEGER NOT NULL DEFAULT 4,
    "isOnSale" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduleSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduleSlot_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleSlotId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerKana" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "numAdults" INTEGER NOT NULL DEFAULT 1,
    "numChildren" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_scheduleSlotId_fkey" FOREIGN KEY ("scheduleSlotId") REFERENCES "ScheduleSlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE INDEX "ScheduleSlot_date_idx" ON "ScheduleSlot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSlot_activityId_date_startTime_key" ON "ScheduleSlot"("activityId", "date", "startTime");

-- CreateIndex
CREATE INDEX "Booking_scheduleSlotId_idx" ON "Booking"("scheduleSlotId");
