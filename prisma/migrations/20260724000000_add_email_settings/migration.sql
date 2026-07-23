-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "confirmationSubject" TEXT,
    "confirmationBody" TEXT,
    "cancellationSubject" TEXT,
    "cancellationBody" TEXT,
    "changeSubject" TEXT,
    "changeBody" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

