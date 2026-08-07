CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Department_organizationId_name_key" ON "Department"("organizationId", "name");
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DepartmentMembership" (
  "id" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "level" TEXT NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DepartmentMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DepartmentMembership_departmentId_userId_key" ON "DepartmentMembership"("departmentId", "userId");
CREATE INDEX "DepartmentMembership_userId_idx" ON "DepartmentMembership"("userId");
ALTER TABLE "DepartmentMembership" ADD CONSTRAINT "DepartmentMembership_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepartmentMembership" ADD CONSTRAINT "DepartmentMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Skill" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Skill_organizationId_name_key" ON "Skill"("organizationId", "name");
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserSkill" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "proficiency" INTEGER NOT NULL DEFAULT 1,
  "isInterested" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserSkill_userId_skillId_key" ON "UserSkill"("userId", "skillId");
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InvitationCode" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "memberType" TEXT NOT NULL,
  "departmentId" TEXT,
  "maxUses" INTEGER,
  "uses" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvitationCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InvitationCode_code_key" ON "InvitationCode"("code");
CREATE INDEX "InvitationCode_organizationId_idx" ON "InvitationCode"("organizationId");
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WorkforceApplication" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "motivation" TEXT,
  "reviewNotes" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkforceApplication_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkforceApplication_organizationId_status_idx" ON "WorkforceApplication"("organizationId", "status");
ALTER TABLE "WorkforceApplication" ADD CONSTRAINT "WorkforceApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkforceApplication" ADD CONSTRAINT "WorkforceApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkforceApplication" ADD CONSTRAINT "WorkforceApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WorkAssignment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "departmentId" TEXT,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OFFERED',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "estimatedHours" DOUBLE PRECISION,
  "createdById" TEXT NOT NULL,
  "respondedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkAssignment_userId_status_idx" ON "WorkAssignment"("userId", "status");
CREATE INDEX "WorkAssignment_organizationId_idx" ON "WorkAssignment"("organizationId");
ALTER TABLE "WorkAssignment" ADD CONSTRAINT "WorkAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkAssignment" ADD CONSTRAINT "WorkAssignment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkAssignment" ADD CONSTRAINT "WorkAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkAssignment" ADD CONSTRAINT "WorkAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VolunteerHour" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assignmentId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "hours" DOUBLE PRECISION NOT NULL,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VolunteerHour_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VolunteerHour_userId_date_idx" ON "VolunteerHour"("userId", "date");
ALTER TABLE "VolunteerHour" ADD CONSTRAINT "VolunteerHour_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VolunteerHour" ADD CONSTRAINT "VolunteerHour_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VolunteerHour" ADD CONSTRAINT "VolunteerHour_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
