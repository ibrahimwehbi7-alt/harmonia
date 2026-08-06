-- CreateTable
CREATE TABLE "SitePage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "draftData" JSONB,
    "draftUpdatedAt" TIMESTAMP(3),
    "publishedVersion" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "publishedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SitePage_organizationId_key_key"
ON "SitePage"("organizationId", "key");

CREATE INDEX "SitePage_organizationId_idx"
ON "SitePage"("organizationId");

CREATE INDEX "SitePage_publishedById_idx"
ON "SitePage"("publishedById");

ALTER TABLE "SitePage"
ADD CONSTRAINT "SitePage_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SitePage"
ADD CONSTRAINT "SitePage_publishedById_fkey"
FOREIGN KEY ("publishedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
