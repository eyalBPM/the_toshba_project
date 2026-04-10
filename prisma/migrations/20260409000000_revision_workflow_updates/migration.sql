-- AlterEnum: Add "Obsolete" to RevisionStatus
ALTER TYPE "RevisionStatus" ADD VALUE 'Obsolete';

-- AlterTable: Add content fields to MinorChangeRequest
ALTER TABLE "MinorChangeRequest" ADD COLUMN "title" TEXT;
ALTER TABLE "MinorChangeRequest" ADD COLUMN "content" JSONB;
ALTER TABLE "MinorChangeRequest" ADD COLUMN "snapshotData" JSONB;

-- AlterTable: Make message nullable on MinorChangeRequest
ALTER TABLE "MinorChangeRequest" ALTER COLUMN "message" DROP NOT NULL;

-- AlterTable: Remove hadMinorChangeEdit from ArticleRevision
ALTER TABLE "ArticleRevision" DROP COLUMN "hadMinorChangeEdit";

-- Migrate any existing "Used" MCR status to "Approved" before removing enum value
UPDATE "MinorChangeRequest" SET "status" = 'Approved' WHERE "status" = 'Used';

-- Remove "Used" from MinorChangeRequestStatus enum
-- PostgreSQL requires creating a new enum type and swapping
ALTER TYPE "MinorChangeRequestStatus" RENAME TO "MinorChangeRequestStatus_old";
CREATE TYPE "MinorChangeRequestStatus" AS ENUM ('Pending', 'Approved', 'Rejected');
ALTER TABLE "MinorChangeRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MinorChangeRequest" ALTER COLUMN "status" TYPE "MinorChangeRequestStatus" USING ("status"::text::"MinorChangeRequestStatus");
ALTER TABLE "MinorChangeRequest" ALTER COLUMN "status" SET DEFAULT 'Pending';
DROP TYPE "MinorChangeRequestStatus_old";
