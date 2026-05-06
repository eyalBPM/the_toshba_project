-- Add OpinionResponse.savedAtRevisionId — a snapshot of the article's
-- currentRevisionId at the time the response was last saved. Informational
-- only; used by the UI to mark a response as written for an old revision.

-- 1. Add the column nullable for the backfill step.
ALTER TABLE "OpinionResponse"
  ADD COLUMN "savedAtRevisionId" TEXT;

-- 2. Backfill from the article's current revision.
UPDATE "OpinionResponse" AS r
SET "savedAtRevisionId" = a."currentRevisionId"
FROM "Article" AS a
WHERE r."articleId" = a."id";

-- 3. Drop orphans where the article had no current revision (shouldn't happen
--    in practice — articles always have a current revision once created — but
--    we cannot leave a NULL since the column will be NOT NULL).
DELETE FROM "OpinionResponse" WHERE "savedAtRevisionId" IS NULL;

-- 4. Enforce NOT NULL.
ALTER TABLE "OpinionResponse"
  ALTER COLUMN "savedAtRevisionId" SET NOT NULL;

-- 5. FK + index.
ALTER TABLE "OpinionResponse"
  ADD CONSTRAINT "OpinionResponse_savedAtRevisionId_fkey"
  FOREIGN KEY ("savedAtRevisionId") REFERENCES "ArticleRevision"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

CREATE INDEX "OpinionResponse_savedAtRevisionId_idx"
  ON "OpinionResponse" ("savedAtRevisionId");
