CREATE TABLE "ImpactMetric" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'MISSION',
  "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL DEFAULT 'count',
  "target" DOUBLE PRECISION,
  "periodLabel" TEXT,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImpactMetric_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReadinessCheck" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventId" TEXT,
  "label" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'GENERAL',
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "ownerName" TEXT,
  "dueAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReadinessCheck_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditEntry" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ImpactMetric_organizationId_idx" ON "ImpactMetric"("organizationId");
CREATE INDEX "ImpactMetric_category_idx" ON "ImpactMetric"("category");
CREATE INDEX "ReadinessCheck_organizationId_idx" ON "ReadinessCheck"("organizationId");
CREATE INDEX "ReadinessCheck_eventId_idx" ON "ReadinessCheck"("eventId");
CREATE INDEX "ReadinessCheck_completed_idx" ON "ReadinessCheck"("completed");
CREATE INDEX "AuditEntry_organizationId_idx" ON "AuditEntry"("organizationId");
CREATE INDEX "AuditEntry_actorId_idx" ON "AuditEntry"("actorId");
CREATE INDEX "AuditEntry_entityType_idx" ON "AuditEntry"("entityType");
CREATE INDEX "AuditEntry_createdAt_idx" ON "AuditEntry"("createdAt");
ALTER TABLE "ImpactMetric" ADD CONSTRAINT "ImpactMetric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImpactMetric" ADD CONSTRAINT "ImpactMetric_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReadinessCheck" ADD CONSTRAINT "ReadinessCheck_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessCheck" ADD CONSTRAINT "ReadinessCheck_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessCheck" ADD CONSTRAINT "ReadinessCheck_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
