/*
  Warnings:

  - The `content` column on the `OpinionResponse` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `OpinionResponse` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MinorChangeRequestStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Used');

-- AlterTable
ALTER TABLE "ArticleRevision" ADD COLUMN     "hadMinorChangeEdit" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OpinionResponse" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "MinorChangeRequest" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "requestingUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "MinorChangeRequestStatus" NOT NULL DEFAULT 'Pending',
    "reviewedByUserId" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinorChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MinorChangeRequest_revisionId_status_idx" ON "MinorChangeRequest"("revisionId", "status");

-- CreateIndex
CREATE INDEX "MinorChangeRequest_status_idx" ON "MinorChangeRequest"("status");

-- CreateIndex
CREATE INDEX "MinorChangeRequest_requestingUserId_idx" ON "MinorChangeRequest"("requestingUserId");

-- AddForeignKey
ALTER TABLE "MinorChangeRequest" ADD CONSTRAINT "MinorChangeRequest_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ArticleRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinorChangeRequest" ADD CONSTRAINT "MinorChangeRequest_requestingUserId_fkey" FOREIGN KEY ("requestingUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinorChangeRequest" ADD CONSTRAINT "MinorChangeRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
