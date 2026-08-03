-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'FOLLOW_UP', 'INACTIVE', 'DO_NOT_CONTACT');

-- CreateEnum
CREATE TYPE "ContactCategory" AS ENUM ('COMMUNITY_LEADER', 'GOVERNMENT', 'NONPROFIT', 'EDUCATION', 'BUSINESS', 'MEDIA', 'DONOR', 'VOLUNTEER', 'STUDENT', 'PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipStrength" AS ENUM ('NEW', 'DEVELOPING', 'ESTABLISHED', 'STRONG', 'STRATEGIC');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('EMAIL', 'PHONE_CALL', 'MEETING', 'EVENT', 'INTRODUCTION', 'MESSAGE', 'NOTE', 'OTHER');

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_userId_fkey";

-- CreateTable
CREATE TABLE "ExternalOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "sector" TEXT,
    "address" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" "ContactCategory" NOT NULL DEFAULT 'OTHER',
    "status" "ContactStatus" NOT NULL DEFAULT 'PROSPECT',
    "relationshipStrength" "RelationshipStrength" NOT NULL DEFAULT 'NEW',
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "externalOrganizationId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactProject" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInteraction" (
    "id" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "subject" TEXT,
    "notes" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followUpAt" TIMESTAMP(3),
    "contactId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalOrganization_organizationId_idx" ON "ExternalOrganization"("organizationId");

-- CreateIndex
CREATE INDEX "ExternalOrganization_name_idx" ON "ExternalOrganization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalOrganization_organizationId_name_key" ON "ExternalOrganization"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- CreateIndex
CREATE INDEX "Contact_externalOrganizationId_idx" ON "Contact"("externalOrganizationId");

-- CreateIndex
CREATE INDEX "Contact_createdById_idx" ON "Contact"("createdById");

-- CreateIndex
CREATE INDEX "Contact_lastName_firstName_idx" ON "Contact"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Contact_status_idx" ON "Contact"("status");

-- CreateIndex
CREATE INDEX "Contact_category_idx" ON "Contact"("category");

-- CreateIndex
CREATE INDEX "Contact_relationshipStrength_idx" ON "Contact"("relationshipStrength");

-- CreateIndex
CREATE INDEX "Contact_nextFollowUpAt_idx" ON "Contact"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "ContactProject_projectId_idx" ON "ContactProject"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactProject_contactId_projectId_key" ON "ContactProject"("contactId", "projectId");

-- CreateIndex
CREATE INDEX "ContactInteraction_contactId_idx" ON "ContactInteraction"("contactId");

-- CreateIndex
CREATE INDEX "ContactInteraction_projectId_idx" ON "ContactInteraction"("projectId");

-- CreateIndex
CREATE INDEX "ContactInteraction_createdById_idx" ON "ContactInteraction"("createdById");

-- CreateIndex
CREATE INDEX "ContactInteraction_occurredAt_idx" ON "ContactInteraction"("occurredAt");

-- CreateIndex
CREATE INDEX "ContactInteraction_followUpAt_idx" ON "ContactInteraction"("followUpAt");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");

-- CreateIndex
CREATE INDEX "Attachment_taskId_idx" ON "Attachment"("taskId");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- CreateIndex
CREATE INDEX "TaskComment_authorId_idx" ON "TaskComment"("authorId");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalOrganization" ADD CONSTRAINT "ExternalOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_externalOrganizationId_fkey" FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactProject" ADD CONSTRAINT "ContactProject_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactProject" ADD CONSTRAINT "ContactProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactInteraction" ADD CONSTRAINT "ContactInteraction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactInteraction" ADD CONSTRAINT "ContactInteraction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactInteraction" ADD CONSTRAINT "ContactInteraction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
