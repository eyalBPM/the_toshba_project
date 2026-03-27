-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PendingVerification', 'VerifiedUser');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('User', 'Admin', 'Moderator', 'Senior');

-- CreateEnum
CREATE TYPE "RevisionStatus" AS ENUM ('Draft', 'Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('PendingApproval', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "ClusterVisibility" AS ENUM ('Private', 'Shared', 'Public');

-- CreateEnum
CREATE TYPE "VerificationRequestStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "googleId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PendingVerification',
    "role" "UserRole" NOT NULL DEFAULT 'User',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleSnapshot" (
    "id" TEXT NOT NULL,
    "sourcesSnapshot" JSONB NOT NULL DEFAULT '[]',
    "topicsSnapshot" JSONB NOT NULL DEFAULT '[]',
    "sagesSnapshot" JSONB NOT NULL DEFAULT '[]',
    "referencesSnapshot" JSONB NOT NULL DEFAULT '[]',
    "contentLength" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArticleSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "currentRevisionId" TEXT,
    "snapshotId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleRevision" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "status" "RevisionStatus" NOT NULL DEFAULT 'Draft',
    "createdByUserId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sage" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Sage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissingSources" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "citationNumber" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissingSources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "status" "ImageStatus" NOT NULL DEFAULT 'PendingApproval',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpinionCluster" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "introduction" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "visibility" "ClusterVisibility" NOT NULL DEFAULT 'Private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpinionCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpinionClusterAccess" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OpinionClusterAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpinionResponse" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpinionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "requestingUserId" TEXT NOT NULL,
    "requestedVerifierId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "VerificationRequestStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVerification" (
    "id" TEXT NOT NULL,
    "verifiedUserId" TEXT NOT NULL,
    "verifiedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_currentRevisionId_key" ON "Article"("currentRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_snapshotId_key" ON "Article"("snapshotId");

-- CreateIndex
CREATE INDEX "Article_createdByUserId_idx" ON "Article"("createdByUserId");

-- CreateIndex
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleRevision_snapshotId_key" ON "ArticleRevision"("snapshotId");

-- CreateIndex
CREATE INDEX "ArticleRevision_articleId_idx" ON "ArticleRevision"("articleId");

-- CreateIndex
CREATE INDEX "ArticleRevision_status_idx" ON "ArticleRevision"("status");

-- CreateIndex
CREATE INDEX "ArticleRevision_createdByUserId_idx" ON "ArticleRevision"("createdByUserId");

-- CreateIndex
CREATE INDEX "ArticleRevision_createdAt_idx" ON "ArticleRevision"("createdAt");

-- CreateIndex
CREATE INDEX "ArticleRevision_articleId_status_idx" ON "ArticleRevision"("articleId", "status");

-- CreateIndex
CREATE INDEX "Source_book_idx" ON "Source"("book");

-- CreateIndex
CREATE INDEX "Source_index_idx" ON "Source"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_text_key" ON "Topic"("text");

-- CreateIndex
CREATE UNIQUE INDEX "Sage_text_key" ON "Sage"("text");

-- CreateIndex
CREATE INDEX "MissingSources_revisionId_idx" ON "MissingSources"("revisionId");

-- CreateIndex
CREATE INDEX "Image_revisionId_idx" ON "Image"("revisionId");

-- CreateIndex
CREATE INDEX "Image_status_idx" ON "Image"("status");

-- CreateIndex
CREATE INDEX "Image_uploadedByUserId_idx" ON "Image"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "Agreement_revisionId_idx" ON "Agreement"("revisionId");

-- CreateIndex
CREATE INDEX "Agreement_userId_idx" ON "Agreement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_revisionId_userId_key" ON "Agreement"("revisionId", "userId");

-- CreateIndex
CREATE INDEX "OpinionCluster_ownerUserId_idx" ON "OpinionCluster"("ownerUserId");

-- CreateIndex
CREATE INDEX "OpinionCluster_visibility_idx" ON "OpinionCluster"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "OpinionClusterAccess_clusterId_userId_key" ON "OpinionClusterAccess"("clusterId", "userId");

-- CreateIndex
CREATE INDEX "OpinionResponse_clusterId_idx" ON "OpinionResponse"("clusterId");

-- CreateIndex
CREATE INDEX "OpinionResponse_revisionId_idx" ON "OpinionResponse"("revisionId");

-- CreateIndex
CREATE INDEX "OpinionResponse_userId_idx" ON "OpinionResponse"("userId");

-- CreateIndex
CREATE INDEX "PrintList_userId_idx" ON "PrintList"("userId");

-- CreateIndex
CREATE INDEX "VerificationRequest_requestingUserId_idx" ON "VerificationRequest"("requestingUserId");

-- CreateIndex
CREATE INDEX "VerificationRequest_requestedVerifierId_idx" ON "VerificationRequest"("requestedVerifierId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE INDEX "UserVerification_verifiedUserId_idx" ON "UserVerification"("verifiedUserId");

-- CreateIndex
CREATE INDEX "UserVerification_verifiedByUserId_idx" ON "UserVerification"("verifiedByUserId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "ArticleRevision"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ArticleSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ArticleSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissingSources" ADD CONSTRAINT "MissingSources_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ArticleRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissingSources" ADD CONSTRAINT "MissingSources_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ArticleRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ArticleRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpinionCluster" ADD CONSTRAINT "OpinionCluster_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpinionClusterAccess" ADD CONSTRAINT "OpinionClusterAccess_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "OpinionCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpinionClusterAccess" ADD CONSTRAINT "OpinionClusterAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpinionResponse" ADD CONSTRAINT "OpinionResponse_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "OpinionCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpinionResponse" ADD CONSTRAINT "OpinionResponse_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ArticleRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpinionResponse" ADD CONSTRAINT "OpinionResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintList" ADD CONSTRAINT "PrintList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_requestingUserId_fkey" FOREIGN KEY ("requestingUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_requestedVerifierId_fkey" FOREIGN KEY ("requestedVerifierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVerification" ADD CONSTRAINT "UserVerification_verifiedUserId_fkey" FOREIGN KEY ("verifiedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVerification" ADD CONSTRAINT "UserVerification_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
