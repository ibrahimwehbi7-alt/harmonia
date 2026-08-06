CREATE TYPE "EntityType" AS ENUM (
  'PROJECT', 'TASK', 'EVENT', 'NOTE', 'FILE', 'CONTACT',
  'ORGANIZATION', 'PARTNER', 'MESSAGE', 'FINANCE', 'GALLERY',
  'MARKETING', 'USER'
);

CREATE TABLE "EntityRelationship" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fromType" "EntityType" NOT NULL,
  "fromId" TEXT NOT NULL,
  "toType" "EntityType" NOT NULL,
  "toId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EntityRelationship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityEntry" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "entityType" "EntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EntityRelationship_organizationId_idx" ON "EntityRelationship"("organizationId");
CREATE INDEX "EntityRelationship_fromType_fromId_idx" ON "EntityRelationship"("fromType", "fromId");
CREATE INDEX "EntityRelationship_toType_toId_idx" ON "EntityRelationship"("toType", "toId");
CREATE INDEX "ActivityEntry_organizationId_createdAt_idx" ON "ActivityEntry"("organizationId", "createdAt");
CREATE INDEX "ActivityEntry_entityType_entityId_createdAt_idx" ON "ActivityEntry"("entityType", "entityId", "createdAt");

ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityEntry" ADD CONSTRAINT "ActivityEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityEntry" ADD CONSTRAINT "ActivityEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
