-- Harmonia V2 Availability module
CREATE TABLE "AvailabilityProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "timeZone" TEXT NOT NULL DEFAULT 'America/Chicago',
  "preferredHoursPerWeek" INTEGER NOT NULL DEFAULT 0,
  "commitmentLevel" TEXT NOT NULL DEFAULT 'CASUAL',
  "schedulingNotes" TEXT,
  "isOpenToOpportunities" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AvailabilityProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AvailabilityProfile_userId_key" ON "AvailabilityProfile"("userId");

CREATE TABLE "WeeklyAvailability" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  CONSTRAINT "WeeklyAvailability_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WeeklyAvailability_profileId_dayOfWeek_idx" ON "WeeklyAvailability"("profileId", "dayOfWeek");

CREATE TABLE "AvailabilityException" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "available" BOOLEAN NOT NULL DEFAULT false,
  "startTime" TEXT,
  "endTime" TEXT,
  "note" TEXT,
  CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AvailabilityException_profileId_date_idx" ON "AvailabilityException"("profileId", "date");

ALTER TABLE "AvailabilityProfile" ADD CONSTRAINT "AvailabilityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyAvailability" ADD CONSTRAINT "WeeklyAvailability_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AvailabilityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AvailabilityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
