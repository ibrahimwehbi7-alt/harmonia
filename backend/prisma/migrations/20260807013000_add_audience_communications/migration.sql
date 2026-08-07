ALTER TABLE "User"
  ADD COLUMN "eventUpdatesOptIn" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "volunteerUpdatesOptIn" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "partnerUpdatesOptIn" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "marketingUnsubscribedAt" TIMESTAMP(3);

CREATE TABLE "CampaignDraft" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "audienceType" TEXT NOT NULL,
  "interestFilters" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignDraft_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CampaignDraft_createdById_idx" ON "CampaignDraft"("createdById");
CREATE INDEX "CampaignDraft_status_idx" ON "CampaignDraft"("status");
ALTER TABLE "CampaignDraft" ADD CONSTRAINT "CampaignDraft_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
