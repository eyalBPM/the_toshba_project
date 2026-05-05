-- Migrate OpinionResponse from referencing ArticleRevision (revisionId)
-- to referencing Article (articleId).
--
-- Backfill rule: articleId := the parent revision's articleId.
-- Orphan rule:   responses whose parent revision has NULL articleId
--                (i.e. drafts on a not-yet-created article) are deleted —
--                the new model only allows responses on existing articles.

-- 1. Add the new column (nullable for the backfill step).
ALTER TABLE "OpinionResponse"
  ADD COLUMN "articleId" TEXT;

-- 2. Backfill articleId from the parent revision.
UPDATE "OpinionResponse" AS r
SET "articleId" = rev."articleId"
FROM "ArticleRevision" AS rev
WHERE r."revisionId" = rev."id";

-- 3. Drop orphaned responses (parent revision has no article).
DELETE FROM "OpinionResponse" WHERE "articleId" IS NULL;

-- 4. Enforce NOT NULL now that all surviving rows have an articleId.
ALTER TABLE "OpinionResponse"
  ALTER COLUMN "articleId" SET NOT NULL;

-- 5. Drop the old FK + index + column.
ALTER TABLE "OpinionResponse"
  DROP CONSTRAINT "OpinionResponse_revisionId_fkey";

DROP INDEX "OpinionResponse_revisionId_idx";

ALTER TABLE "OpinionResponse"
  DROP COLUMN "revisionId";

-- 6. Add the new FK + index.
ALTER TABLE "OpinionResponse"
  ADD CONSTRAINT "OpinionResponse_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "Article"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

CREATE INDEX "OpinionResponse_articleId_idx" ON "OpinionResponse" ("articleId");
